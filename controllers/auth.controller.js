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

  
  authController.authenticate = (req, res, next) => {
  try {
    const tokenString = req.headers.authorization; // 헤더에서 토큰 추출  앞에 Bearer가 붙어있는 상태
    if (!tokenString) {
      return res.status(401).json({ status: "fail", message: "토큰 없음" });
      //throw new Error("invalid token");
    }
    const token = tokenString.replace("Bearer ", ""); // Bearer 제거
    jwt.verify(token, JWT_SECRET_KEY, (error, payload) => { // 토큰 해석을 위한 비밀키 제공 
        if (error) {
          return res.status(401).json({ status: "fail", message: "유효하지 않은 토큰" });
        }
        req.userId = payload._id;
      });
      console.log("userId define?" , req.userId); // usetId 정의된 상태 확인
      next(); // 미들웨어 지나고 다음 것 호출 // verify 비동기 함수라서 next가 userId설정 전에 실행 될 수 있어서 verify안에 next가 있어야 하는가? 강의 코드 오류에서는 왜 밖으로 뺐을까? 
  } catch (error) {
    console.log("authenticate error");
    res.status(400).json({ status: "fail", message: error.message });
  }
};

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

  authController.checkAdminPermission = async (req, res, next) => {
    try {
      const { userId } = req;
      const user = await User.findById(userId);
      if (user.level !== "admin") throw new Error("권한 부족");
      next();
    } catch (error) {
      res.status(400).json({ status: "fail", error: error.message });
    }
  };
  
module.exports = authController;