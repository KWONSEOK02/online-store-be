const jwt = require("jsonwebtoken");
require("dotenv").config();
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

// const authenticateToken = (req, res, next) => {
//   const authHeader = req.headers["authorization"];
//   const token = authHeader?.split(" ")[1];

//   if (!token) return res.status(401).json({ message: "토큰 없음" });

//   jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
//     if (err) return res.status(403).json({ message: "토큰 유효하지 않음" });

//     console.log("✅ decoded JWT:", decoded); // 이 부분 추가
//     req.userId = decoded.id;
//     next();
//   });
// };

const authenticateToken = (req, res, next) => {
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
          //throw new Error("invalid token");
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

module.exports = authenticateToken;
