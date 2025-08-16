const User = require("../models/User");
const bcrypt = require("bcryptjs"); 
const saltRounds = 10


const userController = {}

// 사용자 생성
//프론트엔드에서 비밀번호 제외 입력 검증이 존재하지만, 비밀번호 미입력 시 알 수 없는 값이 들어올 수 있어 서버에서 한 번 더 확인(오류 방지)
//비밀번호는 bcryptjs로 해시
//권한 레벨은 스키마 기본값("customer") 사용: 클라이언트 입력값 무시해 권한 상승 방지
userController.createUser = async (req, res) => {
  try {
    const { email, name, password, level} = req.body

    // 입력 검증: 필수 필드
    if (!password) {
      throw new Error('비밀번호를 입력해주세요');
    }  
    // 중복 이메일 방지
    const user = await User.findOne({ email })
    if (user) {
      throw new Error('이미 가입된 유저입니다') 
    }

    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(password, salt);

    const newUser = new User({ email, name, password: hash, level: level?level:"customer" });
    await newUser.save();
    res.status(200).json({ status: "success" });
    
  } catch (error) {
    // 스키마 검증 에러: 필드별 메시지 병합
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        status: "fail",
        message: messages.join('\n') // 에러 메시지 출력 후 줄바꿈
      });
    }
      res.status(400).json({ status: "fail", message: error.message });
  }
}

module.exports = userController;