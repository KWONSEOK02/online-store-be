const jwt = require("jsonwebtoken");
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
require("dotenv").config();
const authController = {};
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const {OAuth2Client} = require('google-auth-library');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

authController.loginWithEmail = async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email },"-createdAt -updatedAt -__v");
      if (user) {
        const isMatch = bcrypt.compareSync(password, user.password);
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

  //비밀번호 랜덤 생성 이유 : Google 계정 기반 신규 가입 시 비밀번호 필드 채우기 목적
// - 구글 로그인은 비밀번호 로그인은 불가(랜덤 생성값으로 저장)
// - 데이터 무결성 유지 및 기존 User 스키마 요구사항 충족
  authController.loginWithGoogle = async (req, res) => {
    try {
        const { token } = req.body;
        const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID,
        });
        const { email, name } = ticket.getPayload();
        
        // 기존 사용자 조회
        let user = await User.findOne({ email });

        if (!user) {
          // 유저를 새로 생성
          const randomPassword = "" + Math.floor(Math.random() * 100000000);
          const salt = await bcrypt.genSalt(10);
          const newPassword = await bcrypt.hash(randomPassword, salt);
          user = new User({
            name,
            email,
            password: newPassword
          });
          await user.save();
        }
        // 토큰발행 리턴
        const sessionToken = await user.generateToken();
        res.status(200).json({ status: "success", user, token: sessionToken });
    } catch (error) {
      res.status(400).json({ status: "fail", error: error.message});
    }
};

// JWT 인증 미들웨어
// - Authorization 헤더의 Bearer 토큰을 검증
// - 검증 실패 시: 401 응답(JSON {status:"fail", message:"유효하지 않은 토큰"})
// - 성공 시: payload._id 값을 req.userId에 저장하여 이후 미들웨어/라우트에서 사용
  authController.authenticate = (req, res, next) => {
  try {
    const tokenString = req.headers.authorization;
    if (!tokenString) {
      return res.status(401).json({ status: "fail", message: "토큰 없음" });
    }
    const token = tokenString.replace("Bearer ", "");
    jwt.verify(token, JWT_SECRET_KEY, (error, payload) => {
        if (error) {
          return res.status(401).json({ status: "fail", message: "유효하지 않은 토큰" });
        }
        req.userId = payload._id;
      });
      next();
  } catch (error) {
    console.log("authenticate error");
    res.status(400).json({ status: "fail", message: error.message });
  }
};

  authController.getUser = async (req, res) => {
    try {
      const { userId } = req;
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("can not find user");
      }
      res.status(200).json({ status: "success", user });    
    } catch (error) {
      res.status(400).json({ status: "fail", message: error.message });
    }
  }

  // 관리자 권한 검증 미들웨어
// - User.level이 "admin"인 경우에만 다음 단계 진행
// - level 필드는 User.js에서 기본 "customer"로 설정
// - "admin" 권한은 운영자가 DB에서 직접 부여
// - 권한 부족 시 400 응답(JSON {status:"fail", error:"권한 부족"})
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