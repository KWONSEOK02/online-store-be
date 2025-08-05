const express = require("express");
const router = express.Router();
const authController = require("..//controllers//auth.controller");
const productController = require("..//controllers//product.controller");



router.post("/", authController.authenticate, authController.checkAdminPermission, productController.createProduct); 
//authenticate에서 토큰 가져와서 checkAdminPermission에서 토큰으로 admin인지 확인 그 후 상품 생성

router.get("/", productController.getProducts);


module.exports = router;