const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const authController = require("..//controllers//auth.controller");


// 1. 회원가입 endpoint
router.post("/", userController.createUser);

router.get("/me", authController.authenticate, authController.getUser); // 프론트에서 header로 보내서 get 사용

module.exports = router;