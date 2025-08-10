const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const cartController = require("../controllers/cart.controller");

//카트는 로그인을 해야 수정할 수 있어서 인증 필요
router.post("/",
    authController.authenticate,
     cartController.addItemToCart);

router.get("/",
    authController.authenticate,
    cartController.getCart);

router.delete( // 삭제할 상품 카트에서의 id 제공
    "/:id",
    authController.authenticate,
    cartController.deleteCartItem);
      
router.put("/:id", authController.authenticate, cartController.updateCartItemQty);
// 수정할 상품 카트에서의  id 제공

router.get("/qty", authController.authenticate, cartController.getCartQty);


module.exports = router;
