const Order = require("../models/Order");
const productController = require("./product.controller");
const {randomStringGenerator} = require("../utils/randomStringGenerator"); 
const mongoose = require("mongoose");
const PAGE_SIZE = 3;

const orderController ={};


// 주문 생성 규칙
// - 재고는 주문 직전 재검증 (productController.checkItemListStock)
// - 금액 신뢰 경계: totalPrice는 요청값을 그대로 신뢰하지 않고 서버에서 재계산/검증
// - 재고 차감은 주문 확정 트랜잭션 내에서 처리(동시성/이중주문 대비)
orderController.createOrder = async (req, res) => {
    try{
        const { userId } = req;
        const { totalPrice, shipTo , contact , orderList} = req.body;

        //재고 확인, 제고 업데이트(await 사용)
        const insufficientStockItems = await productController.checkItemListStock(orderList);

        if (insufficientStockItems.length > 0) {
            const errorMessage = insufficientStockItems.reduce(
                (total, item) => (total += item.message),
                ""
            );
            throw new Error(errorMessage);
        }


        const newOrder = new Order({
            userId,
            totalPrice,
            shipTo,
            contact,
            items: orderList,
            orderNum: randomStringGenerator(),
        });

        await newOrder.save();
        res.status(200).json({ status: "success", orderNum: newOrder.orderNum});
    }catch(error){
        res.status(400).json({ status: "fail", error: error.message });
    }
}

//[목적] 관리자 테이블/상세 모달 렌더링에 필요한 정보를 한 번의 조회로 가져오기
// - items.productId, userId는 화면 렌더링에 필요한 최소 필드만 populate(select 사용)
// - createdAt 기준 최신순 정렬, 대량 응답 방지 위해 페이지네이션 필수
// - lean()으로 조회 성능 최적화(뷰 전용)
orderController.getOrderList = async (req, res) => {
    try {
      const { page, ordernum} = req.query;
      
      const keyword = (ordernum || '').trim(); 
      const cond = keyword ? { orderNum: { $regex: keyword, $options: 'i' } } : {};
      
      let query = Order.find(cond)
      .populate({ path: 'items.productId', select: 'name image price' }) 
      .populate({ path: 'userId', select: 'email name' })                
      .sort({ createdAt: -1 }) 
      .lean();                 

      const response = { status: "success" };
  
      if (page) {
        query = query.skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE);
        const totalItemNum = await Order.countDocuments(cond);
        response.totalPageNum = Math.ceil(totalItemNum / PAGE_SIZE);
      }
  
      response.data = await query.exec();
      return res.status(200).json(response);
    } catch (error) {
      return res.status(400).json({ status: "fail", error: error.message });
    }
};

// 주문 상태 변경 정책
// - 허용 필드 화이트리스트(ALLOWED)만 업데이트
// - id는 MongoDB ObjectId 기준(주문번호 orderNum과 혼동 금지)
// - 상태 전이 규칙(예: pending→paid→shipped)을 서비스 레벨에서 검증
orderController.updateStatus = async (req, res) => {
    try {
        const {id} = req.body; // MongoDB ObjectId
  
     // 1) 허용 필드만 화이트리스트
    const ALLOWED = ["status"]; 
    const updates = {};
    for (const k of ALLOWED) {
      if (k in req.body) updates[k] = req.body[k];
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ status: "fail", message: "No updatable fields" });
    }

    // 3) 업데이트
    const updated = await Order.findByIdAndUpdate(
        id,
      { $set: updates },
      { new: true}
    );

    if (!updated) return res.status(404).json({ status: "fail", message: "order not found" });
    return res.status(200).json({ status: "success", data: updated });
    } catch (error) {
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(e => e.message);
        return res.status(400).json({ status: "fail", message: messages.join('\n') });
      }
      return res.status(400).json({ status: "fail", error: error.message });
    }
  };  

// 내 주문 목록 조회
// - 인증된 사용자 userId 기준, 페이지네이션 기본값 보장
// - 화면에 필요한 필드만 populate, 가능하면 lean() 사용
orderController.getMyOrder = async (req, res) => {
    try{
        const PAGE_SIZE = 10;
        const cond = { userId: req.userId };
        const pageRaw = req.query.page;
        const p = Math.max(1, parseInt(pageRaw, 10) || 1);

        const [orders, total] = await Promise.all([
          Order.find(cond)
            .populate({ path: 'items.productId', select: 'name image price' })
            .sort({ createdAt: -1 })
            .skip((p - 1) * PAGE_SIZE)
            .limit(PAGE_SIZE),
          Order.countDocuments(cond),
        ]);
    
        return res.status(200).json({
          status: "success",
          data: orders,                 
          totalPageNum: Math.ceil(total / PAGE_SIZE),
        });
    } catch (error) {
      return res.status(500).json({ status: "error", error: error.message });
    }
};

module.exports = orderController;