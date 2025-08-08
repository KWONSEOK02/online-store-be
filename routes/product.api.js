const express = require("express");
const router = express.Router();
const authController = require("..//controllers//auth.controller");
const productController = require("..//controllers//product.controller");



router.post("/", authController.authenticate, authController.checkAdminPermission, productController.createProduct); 
//authenticate에서 토큰 가져와서 checkAdminPermission에서 토큰으로 admin인지 확인 그 후 상품 생성

router.get("/", productController.getProducts);

router.put(
    "/:id",
    authController.authenticate,
    authController.checkAdminPermission,
    productController.updateProduct
  );  // 업데이트  

  router.delete( // 프론트엔드에서 호출시 겹치면 안되니 delete로 
    "/:id",
    authController.authenticate,
    authController.checkAdminPermission,
    productController.deleteProduct
  );  // 소프트 삭제 

  router.get(
    "/:id",
    productController.getProductById
  ); // 개별 상품 가져오기
  


module.exports = router;