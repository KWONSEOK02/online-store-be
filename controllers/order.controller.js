const Order = require("../models/Order");
const productController = require("./product.controller");
const {randomStringGenerator} = require("../utils/randomStringGenerator"); 

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

module.exports = orderController;