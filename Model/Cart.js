const mongoose = require("mongoose");
const Product = require("./Product");
const User = require("./User");
const Schema = mongoose.Schema;
require('dotenv').config(); // dotenv	환경변수 파일을 읽어서 process.env에 로드하는 라이브러리

const cartSchema = Schema({
  userId: { type: mongoose.ObjectId, ref: "User", required: true },
  items: [
    {
      productId: { type: mongoose.ObjectId, ref: "Product", required: true },
      size: { type: String, required: true },
      qty: { type: Number, default: 1, required: true },
    },
  ],
}, { timestamps: true });

cartSchema.methods.toJSON = function () {
  const obj = this._doc;
  delete obj.updatedAt; //  빼고 싶은 정보 임의 추가
  delete obj.createdAt;
  delete obj.__v;  // 빼고 싶은 정보 임의 추가가
  return obj;
};

const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;