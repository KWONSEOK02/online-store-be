const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const cartController = require("../controllers/cart.controller");

 // 모든 엔드포인트는 인증 필요. :id 는 "카트 아이템(document) _id"를 의미
router.post("/",
    authController.authenticate,
     cartController.addItemToCart);

router.get("/",
    authController.authenticate,
    cartController.getCart);
 
router.delete(
    "/:id",
    authController.authenticate,
    cartController.deleteCartItem);
      
router.put("/:id", authController.authenticate, cartController.updateCartItemQty);

router.get("/qty", authController.authenticate, cartController.getCartQty);


module.exports = router;
