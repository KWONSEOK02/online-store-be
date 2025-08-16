const mongoose = require("mongoose");
const Schema = mongoose.Schema;
require('dotenv').config();

const productSchema = Schema({
  sku: { 
    type: String, 
    required: [true, 'SKU는 필수 입력 항목입니다.'], 
    unique: true,
    validate: { 
      validator: function(value) {
        return /^sku/.test(value);  // 'sku'로 시작하는지 확인
      },
      message: 'SKU는 "sku"로 시작해야 합니다. 예: sku001'
    } 
  }, // 상품 고유 코드
  name: { 
    type: String, 
    required: [true, '상품명을 입력해주세요.'] 
  }, // 상품명
  image: { 
    type: String, 
    required: [true, '상품 이미지 URL을 입력해주세요.'] 
  }, // 이미지 URL
  price: { 
    type: Number, 
    required: [true, '가격을 입력해주세요.'] 
  }, // 가격
  description: { 
    type: String, 
    required: [true, '상품 설명을 입력해주세요.'] 
  }, // 설명
  stock: { 
    type: Object, 
    required: [true, '재고 정보를 입력해주세요.'],
    default: {}, //stock 필드를 비워두더라도 DB에 undefined가 아닌 빈 객체({})가 저장
    validate: {
      validator: function (value) {
        if (typeof value !== 'object' || value === null) return false;
  
        const allowed = new Set(['XS', 'S', 'M', 'L', 'XL']);
        return Object.entries(value).every(([size, qty]) => {
          if (!allowed.has(size)) return false;  // 허용된 사이즈만 검사
          const n = Number(qty);                 // "9" 같은 문자열도 숫자로 변환
          return Number.isInteger(n) && n >= 0;  // 존재하는 키만 0 이상 정수 확인
        });
      },
      message: '사이즈 추가시 재고는 0개 이상이어야 합니다.'
    } 
  }, // 재고
  category: { 
    type: Array, 
    required: [true, '카테고리를 입력해주세요.'] 
  }, // 카테고리
  status: { 
    type: String, 
    default: "active" 
  }, // 상태
  isDeleted: { 
    type: Boolean, 
    default: false, 
    required: true 
  } // 삭제 여부
}, { timestamps: true });

productSchema.methods.toJSON = function () {
  const obj = this._doc;
  delete obj.updatedAt;
  delete obj.createdAt;
  delete obj.__v;
  return obj;
};

const Product = mongoose.model("Product", productSchema);
module.exports = Product;