const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
//const authController = require("../controller/auth.controller");


// 1. 회원가입 endpoint
router.post("/", userController.createUser);
//router.post("/login", userController.loginWithEmail);
//토큰을 통해 유저 id 빼내고 => 그 아이디로 유저 객체 찾아서 보내주기
//router.get("/me", authController.authenticate, userController.getUser); // authController.authenticate: 인증 미들웨어 (토큰 검증 후 req.user 설정) → 검증 성공 시 다음(userController.getUser)으로 넘어감
module.exports = router;