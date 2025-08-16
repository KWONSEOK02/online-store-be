const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const jwt = require("jsonwebtoken");
require('dotenv').config(); 
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

const userSchema = Schema({
  name: {
    type: String,
    required: [true, '이름은 필수 입력사항입니다.'] 
  },
  email: {
    type: String,
    unique: true,
    required: [true, '이메일은 필수 입력사항입니다.'] 
  },
  password: {
    type: String,
    required: true
  },
  level: {
    type: String,
    default: "customer"
  }// 권한 기본값: "customer" (admin은 운영자가 DB에서 부여)
}, { timestamps: true });

userSchema.methods.toJSON = function () {
  const obj = this._doc;
  delete obj.password;
  delete obj.updatedAt; 
  delete obj.createdAt;
  delete obj.__v;  
  return obj;
};


userSchema.methods.generateToken = function () { 
  const token = jwt.sign({ _id: this._id }, JWT_SECRET_KEY, { expiresIn: '1d' });
  return token;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
