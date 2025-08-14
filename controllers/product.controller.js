const { response } = require("express");
const Product = require("../models/Product");
const mongoose = require("mongoose");
const PAGE_SIZE = 5;

const productController = {};

const allowed = new Set(['XS','S','M','L','XL']);

// stock 키 대문자화 + 수량 숫자화
function normalizeStockKeys(stock) {
  const result = {};
  for (const [size, qty] of Object.entries(stock || {})) {
    const upper = size.toUpperCase();
    result[upper] = Number(qty); // 숫자로 변환
  }
  return result;
}

// -------------------- 생성 --------------------
productController.createProduct = async (req, res) => {
  try {
    if (req.body.stock) req.body.stock = normalizeStockKeys(req.body.stock);

    const { sku, name, image, category, description, price, stock, status } = req.body;

    const product = await Product.create({
      sku, name, image, category, description, price, stock, status
    });

    return res.status(201).json({ status: "success", data: product });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ status: "fail", message: messages.join('\n') });
    }
    if (error.code === 11000 && error.keyPattern?.sku) {
      return res.status(400).json({ status: "fail", message: "이미 등록된 SKU입니다. 다른 값을 입력해주세요." });
    }
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// -------------------- 목록 --------------------
productController.getProducts = async (req, res) => {
  try {
    const { page, name } = req.query;
    const cond = {
      isDeleted: false,
      ...(name ? { name: { $regex: name, $options: 'i' } } : {})
    };
    let query = Product.find(cond);
    const response = { status: "success" };

    if (page) {
      query = query.skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE);
      const totalItemNum = await Product.countDocuments(cond);
      response.totalPageNum = Math.ceil(totalItemNum / PAGE_SIZE);
    }

    response.data = await query.exec();
    return res.status(200).json(response);
  } catch (error) {
    return res.status(400).json({ status: "fail", error: error.message });
  }
};

// -------------------- 수정 --------------------
productController.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    // 허용 필드만 업데이트(스키마에 없는 size 제거함) <== size 있으면 유효성 검사 통과 못함. 프론트에서 size 소문자로 보내는 거 대문자화 m->M 이런 식으로 사이즈 저장
    const allow = ['sku','name','image','price','description','category','stock','status'];
    const updates = {};
    for (const k of allow) if (k in req.body) updates[k] = req.body[k];

    if (updates.stock) {
      updates.stock = normalizeStockKeys(updates.stock);
    }

    const updated = await Product.findByIdAndUpdate(
      { _id: productId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updated) throw new Error("item doesn't exist");
    return res.status(200).json({ status: "success", data: updated });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ status: "fail", message: messages.join('\n') });
    }
    if (error.code === 11000 && error.keyPattern?.sku) {
      return res.status(400).json({ status: "fail", message: "이미 등록된 SKU입니다. 다른 값을 입력해주세요." });
    }
    return res.status(400).json({ status: "fail", error: error.message });
  }
};

// -------------------- 삭제(소프트) --------------------
productController.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const updated = await Product.findByIdAndUpdate(
      { _id: productId },
      { isDeleted: true },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ status: "fail", message: "상품을 찾을 수 없습니다." });
    }
    return res.status(200).json({ status: "success", message: "상품 삭제 처리 완료" });
  } catch (error) {
    return res.status(400).json({ status: "fail", error: error.message });
  }
};

// -------------------- 단건 조회 --------------------
productController.getProductById = async (req, res) => {
  const productId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: "유효하지 않은 상품 ID입니다." });
  }
  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
    return res.status(200).json({ status: "success", data: product });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};


// 검증과 차감이 병렬이면 재고가 있는 상품에서는 재고가 나가는 문제 검증과 차감 분리로 해결
//-----------------재고 검증----------------
productController.verifyStock = async (item) => {
  // 내가 사려는 아이템 재고 정보 들고오기
  const product = await Product.findById(item.productId);
  // 내가 사려는 아이템 qty, 재고 비교
  const current = product?.stock?.[item.size] ?? 0;

  if (current < item.qty) {
    // 재고가 불충분하면 불충분 메세지와 함께 데이터 반환
    return { isVerify: false, message: `${product.name}의 ${item.size} 재고가 부족합니다. 현재 ${current}벌 남았습니다.` };
  }
  return { isVerify: true };
};

//----------------- 실제 차감(검증 통과 후만 호출)-----------------
productController.deductStock = async (item) => {
  const product = await Product.findById(item.productId);
  const newStock = { ...product.stock };
  newStock[item.size] -= item.qty; //새로운 stock에 정보 업데이트
  product.stock = newStock;
  await product.save();
};


productController.checkItemListStock = async (itemList) => {
  // 1. 전수 검증
  const insufficientStockItems = [] // 재고가 불충분한 아이템을 저장


  await Promise.all( // 비동기 여러 개를 한번에 처리(병렬 실행)
    itemList.map(async(item) => {
      const stockCheck = await productController.verifyStock(item);
        if(!stockCheck.isVerify){
          insufficientStockItems.push({item, message: stockCheck.message})
        }
        return stockCheck;
    })
  );

  if(insufficientStockItems.length > 0){ 
    return insufficientStockItems;
  }
   // 2. 일괄 차감
   await Promise.all( // 비동기 여러 개를 한번에 처리(병렬 실행)
    itemList.map(async(item) => productController.deductStock(item)));
  return insufficientStockItems;
};

module.exports = productController;
