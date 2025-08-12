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

// //생성
// productController.createProduct = async (req, res) => {
//   try {
//     const {
//       sku,
//       name,
//       size,
//       image,
//       category,
//       description,
//       price,
//       stock,
//       status,
//     } = req.body;

//     const product = new Product({
//       sku,
//       name,
//       size,
//       image,
//       category,
//       description,
//       price,
//       stock,
//       status,
//     });

//     await product.save();
//     res.status(200).json({ status: "success", product });
//   } catch (error) {
//       // 1️ 스키마 유효성 검증 실패 (예: SKU 형식 오류 등)
//       if (error.name === 'ValidationError') {
//         const messages = Object.values(error.errors).map(err => err.message);
//         return res.status(400).json({
//           status: "fail",
//           message: messages.join('\n') // 여러 필드 오류 시 줄바꿈으로 전달
//         });
//       }
    
//       // 2️ SKU 중복 오류 (MongoDB unique 제약 위반)
//       if (error.code === 11000 && error.keyPattern?.sku) {
//         return res.status(400).json({
//           status: "fail",
//           message: "이미 등록된 SKU입니다. 다른 값을 입력해주세요." //  message 키 사용
//         });
//       }
    
//       // 3️ 그 외의 예외 (서버 오류 등)
//       return res.status(500).json({
//         status: "error",
//         message: error.message || "서버 오류가 발생했습니다."
//       });
//     }
//   };


// productController.getProducts = async(req, res)=>{
//   try{
//     const {page, name} =req.query; // 퀴리에서 페이지와 이름 추출
//     //const cond = name ? {  isDeleted: false, name: { $regex: name, $options: 'i' } } : {};
//     const cond = {
//       isDeleted: false,
//       ...(name ? { name: { $regex: name, $options: 'i' } } : {}) 
//       //name이 값이 있으면 { name: { $regex: name, $options: 'i' } } 객체를 cond 안에 합침
//     }; //검색어가 없으면 삭제 여부 조건만 적용
//     let query = Product.find(cond);
//     let response = { status: "success" };
//     if (page) {
//       query.skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE);
//       // 최종 몇개 페이지
//       // 데이터가 총 몇개있는지
//       const totalItemNum = await Product.countDocuments(cond);
//       //const totalItemNum = await Product.find(cond).count();    // {status: 'fail', error: 'Product.find(...).count is not a function'}
//       // 데이터 총 개수 / PAGE_SIZE
//       const totalPageNum = Math.ceil(totalItemNum / PAGE_SIZE);
//       response.totalPageNum = totalPageNum;
//     }
  
//     const productList = await query.exec(); // exec() 명시적으로 실행시키는 메서드
//     console.log("totalPageNum", response.totalPageNum);
//     response.data = productList;
//     res.status(200).json(response);  
//   }catch(error){
//     res.status(400).json({ status: "fail", error: error.message });
//   }
// }

// productController.updateProduct = async (req, res) => {
//   try {
//     const productId = req.params.id; // URL 경로에서 id 파라미터를 가져옴
//     const { sku, name, size, image, price, description, category, stock, status } = req.body;

//     const product = await Product.findByIdAndUpdate(
//       { _id: productId },
//       { $set: {sku, name, size, image, price, description, category, stock, status} }, //set으로 하면 가능함?
//       { new: true, runValidators: true} // 업데이트된 문서를 반환하도록 설정 (기본값: 업데이트 전 문서)  { new: true }가 빠지면 업데이트 이전의 데이터 반환
//     ); //runValidators: true 업데이트 시 유효성 검사  runValidators: true 넣으면 왜 수정이 안되는 것인가?

//     if (!product) throw new Error("item doesn't exist");

//     res.status(200).json({ status: "success", data: product });
//   } catch (error) {
//     // 스키마 유효성 검증 실패 시 
//     if (error.name === 'ValidationError') {
//       const messages = Object.values(error.errors).map(err => err.message);
//       return res.status(400).json({
//         status: "fail",
//         message: messages.join('\n') // 여러 오류 메시지를 한번에 전달
//       });
//     }
    
//     // SKU 중복 오류 발생 시
//     if (error.code === 11000 && error.keyPattern?.sku) {
//       return res.status(400).json({
//         status: "fail",
//         message: "이미 등록된 SKU입니다. 다른 값을 입력해주세요."
//       });
//     }

//     // 그 외의 예외 (일반 서버 오류 등)
//     return res.status(400).json({ status: "fail", error: error.message });
//   }
// };

// // product.controller.js
// productController.deleteProduct = async (req, res) => {
//   try {
//     const productId = req.params.id;
//     const updatedProduct = await Product.findByIdAndUpdate(
//       { _id: productId},
//       { isDeleted: true },
//       { new: true }
//     );
//     if (!updatedProduct) {
//       return res.status(404).json({ status: "fail", message: "상품을 찾을 수 없습니다." });
//     }
//     res.status(200).json({ status: "success", message: "상품 삭제 처리 완료" });
//   } catch (error) {
//     res.status(400).json({ status: "fail", error: error.message });
//   }
// };

// productController.getProductById = async (req, res) => {
//   const productId = req.params.id; // catch에서도 사용해서 밖으로

//    // 1) ID 유효성 검사
//    if (!mongoose.Types.ObjectId.isValid(productId)) {
//     return res.status(400).json({ message: "유효하지 않은 상품 ID입니다." });
//   }
//   try {
//     // 2) 조회
//     const product = await Product.findById(productId);
//     if (!product) {
//       return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
//     }
//      // 3) 성공
//     return res.status(200).json({ status: "success", data: product });
//   } catch (error) {
//      // 4) 서버 에러
//      return res.status(500).json({ status: "error", message: error.message });
//   }
// };

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

productController.checkStock = async (item) => {
  // 내가 사려는 아이템 재고 정보 들고오기
  const product = await Product.findById(item.productId)
  // 내가 사려는 아이템 qty, 재고 비교
  const current = product.stock[item.size]
  if (current < item.qty) {
      // 재고가 불충분하면 불충분 메세지와 함께 데이터 반환
      return { isVerify: false, message: `${product.name}의 ${item.size} 재고가 부족합니다 현재 ${current}벌 남았습니다.` }
  }

  const newStock = { ...product.stock }
  newStock[item.size] -= item.qty  //새로운 stock에 정보 업데이트
  product.stock = newStock

  await product.save()
  // 충분하다면, 재고에서 qty 성공
  return {isVerify:true};
}


productController.checkItemListStock = async (itemList) => {
    const insufficientStockItems = [] // 재고가 불충분한 아이템을 저장할 예정
    // 재고 확인 로직
    await Promise.all( // 비동기 여러 개를 한번에 처리(병렬 실행)
      itemList.map(async(item) => {
        const stockCheck = await productController.checkStock(item);
        if(!stockCheck.isVerify){
          insufficientStockItems.push({item, message: stockCheck.message})
        }
        return stockCheck;
      })
    );
    return insufficientStockItems
}


module.exports = productController;
