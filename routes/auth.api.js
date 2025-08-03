const express = require("express");
const router = express.Router();
const authController = require("..//controllers//auth.controller");
const authenticateToken = require("../middlewares/authenticateToken");

router.post("/login", authController.loginWithEmail);
// 로그인 유지용 사용자 정보 조회 API
router.get("/me", authenticateToken, authController.getUser);

module.exports = router;
