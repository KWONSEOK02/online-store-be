const jwt = require("jsonwebtoken");
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
require("dotenv").config();
const authController = {};
const bcrypt = require("bcryptjs");
const User = require("../models/User");

authController.loginWithEmail = async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email },"-createdAt -updatedAt -__v");
      if (user) {
        const isMatch = await bcrypt.compareSync(password, user.password); // compareSync 동기 방식   await compare 비동기 방식
          if (isMatch) {
            const token = await user.generateToken();
            return res.status(200).json({ status: "success", user, token });
          }
      }
      throw new Error("아이디 또는 비밀번호가 일치하지 않습니다");
  
    } catch (error) {
        res.status(400).json({ status: "fail", message: error.message});
    }
  }

  authController.getUser = async (req, res) => {
    try {
      const { userId } = req; // req.userId에서 userId를 구조분해 할당
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("can not find user");
      }
      res.status(200).json({ status: "success", user });    
    } catch (error) {
      console.log("getUser error");
      res.status(400).json({ status: "fail", message: error.message });
    }
  }

module.exports = authController;