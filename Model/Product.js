const mongoose = require("mongoose");
const Schema = mongoose.Schema;
require('dotenv').config(); // dotenv	환경변수 파일을 읽어서 process.env에 로드하는 라이브러리

const productSchema = Schema({
  sku: { type: String, required: true, unique: true },      // 상품 고유 코드
  name: { type: String, required: true },                   // 상품명
  image: { type: String, required: true },                                  // 이미지 URL
  price: { type: Number, required: true },                  // 가격
  description: { type: String, required: true },                            // 설명
  stock: { type: Object, required: true },                      // 재고
  category: { type: Array, required: true },                               // 카테고리
  status: { type: String, default: "active" },              // 상태 (예: active, inactive)
  isDeleted: { type: Boolean, default: false, required: true },             // 삭제 여부
}, { timestamps: true });

productSchema.methods.toJSON = function () {
  const obj = this._doc;
  delete obj.updatedAt; //  빼고 싶은 정보 임의 추가
  delete obj.createdAt;
  delete obj.__v;  // 빼고 싶은 정보 임의 추가가
  return obj;
};

const Product = mongoose.model("Product", productSchema);
module.exports = Product;