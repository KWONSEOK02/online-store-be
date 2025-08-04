const express = require("express");
const router = express.Router();
const authController = require("..//controllers//auth.controller");

router.post("/login", authController.loginWithEmail);
// 로그인 유지용 사용자 정보 조회 API

module.exports = router;
