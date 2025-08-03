const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const indexRouter = require('./routes/index');
require('dotenv').config();

const app = express();

// CORS 설정
const allowedOrigins = [
  'https://online-store-mall.netlify.app', // 배포 환경
  'http://localhost:3000'                  // 개발 환경
];


app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('허용되지 않은 CORS 요청입니다.'));
    }
  },
  credentials: true
}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/api', indexRouter);

// 오직 LOCAL_DB_ADDRESS만 사용
const mongoURI = process.env.LOCAL_DB_ADDRESS;

const connectDB = async () => {
  try {
    if (!mongoURI) {
      console.error("MongoDB URI 환경 변수가 설정되지 않았습니다. .env 파일 또는 시스템 환경 변수를 확인해주세요.");
      process.exit(1);
    }

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("MongoDB 연결 성공...");
  } catch (err) {
    console.error("DB 연결 실패:", err.message);
    process.exit(1);
  }
};

connectDB()
  .then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`서버가 ${PORT}번 포트에서 실행 중입니다.`);
    });
  })
  .catch((err) => {
    console.error("서버 시작 중 오류 발생:", err);
  });
