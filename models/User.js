const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const jwt = require("jsonwebtoken");
require('dotenv').config(); // dotenv	환경변수 파일을 읽어서 process.env에 로드하는 라이브러리
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY; //process.env는 Node.js에서 환경변수를 다루는 객체

const userSchema = Schema({
  name: {
    type: String,
    required: [true, '이름은 필수 입력사항입니다.'] // 사용자 친화적 메시지 제공을 위한  Mongoose의 validation 에러를 커스터마이징
  },
  email: {
    type: String,
    unique: true,
    required: [true, '이메일은 필수 입력사항입니다.'] // 사용자 친화적 메시지 제공을 위한  Mongoose의 validation 에러를 커스터마이징
  },
  password: {
    type: String,
    required: true  // 비번 입력 안 해도 비번이 자동 생성 되는 오류가 있어서  userController.createUser에서 오류 핸들링
  },
  level: {
    type: String,
    default: "customer"
  }// 2types : customer, admin
}, { timestamps: true });

userSchema.methods.toJSON = function () {
  const obj = this._doc;
  delete obj.password;
  delete obj.updatedAt; //  빼고 싶은 정보 임의 추가
  delete obj.createdAt;
  delete obj.__v;  // 빼고 싶은 정보 임의 추가가
  return obj;
};


userSchema.methods.generateToken = function () { // 동기 함수
  const token = jwt.sign({ _id: this._id }, JWT_SECRET_KEY, { expiresIn: '1d' }); //expiresIn 토큰 유통기한 1d
  return token;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
