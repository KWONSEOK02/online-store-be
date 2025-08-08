const { response } = require("express");
const Product = require("../models/Product");
const PAGE_SIZE = 5;

const productController = {};

productController.createProduct = async (req, res) => {
  try {
    const {
      sku,
      name,
      size,
      image,
      category,
      description,
      price,
      stock,
      status,
    } = req.body;

    const product = new Product({
      sku,
      name,
      size,
      image,
      category,
      description,
      price,
      stock,
      status,
    });

    await product.save();
    res.status(200).json({ status: "success", product });
  } catch (error) {
      // 1️ 스키마 유효성 검증 실패 (예: SKU 형식 오류 등)
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          status: "fail",
          message: messages.join('\n') // 여러 필드 오류 시 줄바꿈으로 전달
        });
      }
    
      // 2️ SKU 중복 오류 (MongoDB unique 제약 위반)
      if (error.code === 11000 && error.keyPattern?.sku) {
        return res.status(400).json({
          status: "fail",
          message: "이미 등록된 SKU입니다. 다른 값을 입력해주세요." //  message 키 사용
        });
      }
    
      // 3️ 그 외의 예외 (서버 오류 등)
      return res.status(500).json({
        status: "error",
        message: error.message || "서버 오류가 발생했습니다."
      });
    }
  };


productController.getProducts = async(req, res)=>{
  try{
    const {page, name} =req.query; // 퀴리에서 페이지와 이름 추출
    //const cond = name ? {  isDeleted: false, name: { $regex: name, $options: 'i' } } : {};
    const cond = {
      isDeleted: false,
      ...(name ? { name: { $regex: name, $options: 'i' } } : {}) 
      //name이 값이 있으면 { name: { $regex: name, $options: 'i' } } 객체를 cond 안에 합침
    }; //검색어가 없으면 삭제 여부 조건만 적용
    let query = Product.find(cond);
    let response = { status: "success" };
    if (page) {
      query.skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE);
      // 최종 몇개 페이지
      // 데이터가 총 몇개있는지
      const totalItemNum = await Product.countDocuments(cond);
      //const totalItemNum = await Product.find(cond).count();    // {status: 'fail', error: 'Product.find(...).count is not a function'}
      // 데이터 총 개수 / PAGE_SIZE
      const totalPageNum = Math.ceil(totalItemNum / PAGE_SIZE);
      response.totalPageNum = totalPageNum;
    }
  
    const productList = await query.exec(); // exec() 명시적으로 실행시키는 메서드
    console.log("totalPageNum", response.totalPageNum);
    response.data = productList;
    res.status(200).json(response);
    // let products;
    // if(name){
    //   products = await Product.find({
    //     name: { 
    //       // name 필드에서 'name' 문자열이 포함된 값을 찾음 (부분 일치 검색)
    //       $regex: name,          // 정규표현식: name 문자열이 포함된 항목을 검색
    //       $options: "i"          // 옵션: 대소문자를 구분하지 않음 (i = ignore case)
    //     }
    //   });
    // }else{ // 이름 안 들어오면 전부 보여주기
    //   const products = await Product.find({});
    // }  확장성 떨어짐   
  }catch(error){
    res.status(400).json({ status: "fail", error: error.message });
  }
}

productController.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id; // URL 경로에서 id 파라미터를 가져옴
    const { sku, name, size, image, price, description, category, stock, status } = req.body;

    const product = await Product.findByIdAndUpdate(
      { _id: productId },
      { sku, name, size, image, price, description, category, stock, status },
      { new: true } // 업데이트된 문서를 반환하도록 설정 (기본값: 업데이트 전 문서)  { new: true }가 빠지면 업데이트 이전의 데이터 반환
    );

    if (!product) throw new Error("item doesn't exist");

    res.status(200).json({ status: "success", data: product });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

// product.controller.js
productController.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const updatedProduct = await Product.findByIdAndUpdate(
      { _id: productId},
      { isDeleted: true },
      { new: true }
    );
    if (!updatedProduct) {
      return res.status(404).json({ status: "fail", message: "상품을 찾을 수 없습니다." });
    }
    res.status(200).json({ status: "success", message: "상품 삭제 처리 완료" });
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};


module.exports = productController;
