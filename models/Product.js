const mongoose = require("mongoose");
const Schema = mongoose.Schema;
require('dotenv').config(); // dotenv	환경변수 파일을 읽어서 process.env에 로드하는 라이브러리

const productSchema = Schema({
  sku: { 
    type: String, 
    required: [true, 'SKU는 필수 입력 항목입니다.'], 
    unique: true,
    validate: { //validate.validator 해당 필드값에 대해 유효성 검증을 수행하는 함수
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
    validate: {
      validator: function (value) {
        if (typeof value !== 'object' || value === null) return false;
  
        return Object.values(value).every(qty => {
          return Number.isInteger(qty) && qty >= 0;
        });
      },
      message: '각 사이즈별 재고는 0 이상의 정수여야 합니다.'
    } 
  }, // 재고
  category: { 
    type: Array, 
    required: [true, '카테고리를 입력해주세요.'] 
  }, // 카테고리
  status: { 
    type: String, 
    default: "active" 
  }, // 상태 (예: active, inactive)
  isDeleted: { 
    type: Boolean, 
    default: false, 
    required: true 
  } // 삭제 여부
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