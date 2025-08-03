const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");



// 1. 회원가입 endpoint
router.post("/", userController.createUser);

module.exports = router;