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
    res.status(400).json({ status: "fail", error: error.message });
  }
};

productController.getProducts = async(req, res)=>{
  try{
    const {page, name} =req.query; // 퀴리에서 페이지와 이름 추출
    const cond = name ? { name: { $regex: name, $options: 'i' } } : {};
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

module.exports = productController;
