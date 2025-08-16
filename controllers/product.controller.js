const Product = require("../models/Product");
const mongoose = require("mongoose");
const PAGE_SIZE = 5;

const productController = {};


// 재고 입력 표준화 유틸
// - 입력된 stock 객체의 키를 대문자로, 수량은 숫자로 변환
// - 미승인(size whitelist) 여부는 "제품 스키마"에서 이미 검증/차단하므로 여기서는 표준화만 담당
function normalizeStockKeys(stock) {
  const result = {};
  for (const [size, qty] of Object.entries(stock || {})) {
    const upper = size.toUpperCase();
    result[upper] = Number(qty);
  }
  return result;
}

productController.createProduct = async (req, res) => {
  try {
     // stock은 저장 전에 표준화(normalize)
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
    // SKU 유니크 충돌 확인
    if (error.code === 11000 && error.keyPattern?.sku) {
      return res.status(400).json({ status: "fail", message: "이미 등록된 SKU입니다. 다른 값을 입력해주세요." });
    }
    return res.status(500).json({ status: "error", message: error.message });
  }
};

productController.getProducts = async (req, res) => {
  try {
     // 목록 조회: 소프트삭제 제외 + 이름 부분검색(대소문자 무시)
    const { page, name } = req.query;
    const cond = {
      isDeleted: false,
      ...(name ? { name: { $regex: name, $options: 'i' } } : {})
    };
    let query = Product.find(cond);
    const response = { status: "success" };

    // 페이지네이션
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

productController.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    // 화이트리스트 필드만 업데이트
    const allow = ['sku','name','image','price','description','category','stock','status'];
    const updates = {};
    for (const k of allow) if (k in req.body) updates[k] = req.body[k];

    // stock 업데이트 시에도 표준화 적용
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

// 소프트 삭제: isDeleted 플래그만 true로 설정
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

productController.getProductById = async (req, res) => {
  const productId = req.params.id;
  // 개별 조회: 유효한 ObjectId인지 선검증
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


// [재고 처리 정책]
// - verifyStock: 요청 수량이 현재 재고를 초과하는지 확인(차감 없음)
// - deductStock: 검증 통과 후 실제 차감 (여기서는 원자적 트랜잭션 아님 → 동시성은 주문 단계에서 보완)
// - checkItemListStock: "전수 검증 → 일괄 차감"의 2단계 수행
productController.verifyStock = async (item) => {
  const product = await Product.findById(item.productId);
  const current = product?.stock?.[item.size] ?? 0;

  if (current < item.qty) {
    // 재고가 불충분하면 불충분 메세지와 함께 데이터 반환
    return { isVerify: false, message: `${product.name}의 ${item.size} 재고가 부족합니다. 현재 ${current}벌 남았습니다.` };
  }
  return { isVerify: true };
};

productController.deductStock = async (item) => {
  const product = await Product.findById(item.productId);
  const newStock = { ...product.stock };
  newStock[item.size] -= item.qty; //검증 통과분에 한해 차감해서 새로운 stock에 정보 업데이트
  product.stock = newStock;
  await product.save();
};


productController.checkItemListStock = async (itemList) => {
  // 1) 전수 검증 단계(재고 부족 항목 확인)
  const insufficientStockItems = [] // 재고가 불충분한 아이템을 저장

  await Promise.all(
    itemList.map(async(item) => {
      const stockCheck = await productController.verifyStock(item);
        if(!stockCheck.isVerify){
          insufficientStockItems.push({item, message: stockCheck.message})
        }
        return stockCheck;
    })
  );

   // 부족한 항목이 있으면 검증 실패 목록 반환(차감하지 않음)
  if(insufficientStockItems.length > 0){ 
    return insufficientStockItems;
  }
   // 2) 일괄 차감 단계(검증 통과 케이스)
   await Promise.all(
    itemList.map(async(item) => productController.deductStock(item)));
  return insufficientStockItems;
};

module.exports = productController;
