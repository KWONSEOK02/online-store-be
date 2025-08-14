const Order = require("../models/Order");
const productController = require("./product.controller");
const {randomStringGenerator} = require("../utils/randomStringGenerator"); 
const mongoose = require("mongoose");
const PAGE_SIZE = 3;

const orderController ={};


// totalPrice
// shipTo 객체 (address, city, zip)
// contact 객체 (firstName, lastName, contact)
// orderList 배열 (각 원소에 productId, price, qty, size) body에 있는 것들

orderController.createOrder = async (req, res) => {
    try{
        const { userId } = req;
        const { totalPrice, shipTo , contact , orderList} = req.body;

        //재고 확인, 제고 업데이트(await 사용)
        const insufficientStockItems = await productController.checkItemListStock(orderList);

        // 재고가 충분하지 않은 아이템이 있었다 => 에러
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

orderController.getOrderList = async (req, res) => {
    try {
      const { page, ordernum} = req.query; //ordernum으로 프론트에서 보내고 있었음.
      
      const keyword = (ordernum || '').trim(); //
      const cond = keyword ? { orderNum: { $regex: keyword, $options: 'i' } } : {};
      

      let query = Order.find(cond)
      .populate({ path: 'items.productId', select: 'name image price' }) // 상품 정보
      .populate({ path: 'userId', select: 'email name' })                // 유저 정보
      .sort({ createdAt: -1 }) // 보기 좋게 최신순
      .lean();                 // (선택) 성능

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

// -------------------수정 -----------------
orderController.updateStatus = async (req, res) => {
    try {
        const {id} = req.body; //id <=주문 번호
  
     // 1) 허용 필드만 화이트리스트
    const ALLOWED = ["status"];            // 나중에 허용 확장 시 여기만 추가
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


orderController.getMyOrder = async (req, res) => {
    try{
        const PAGE_SIZE = 10;
        const cond = { userId: req.userId };
        const pageRaw = req.query.page;
        const p = Math.max(1, parseInt(pageRaw, 10) || 1);

        const [orders, total] = await Promise.all([
          Order.find(cond)
            .populate({ path: 'items.productId', select: 'name image price' })//name image price가져 옴, _id 포함
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