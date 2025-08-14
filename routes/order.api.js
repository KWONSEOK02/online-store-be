const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const orderController = require("../controllers/order.controller");

router.post("/", authController.authenticate, orderController.createOrder);
router.get("/", authController.authenticate, orderController.getOrderList);
router.put("/", authController.authenticate, orderController.updateStatus);
router.get("/me", authController.authenticate, orderController.getMyOrder);


module.exports = router;