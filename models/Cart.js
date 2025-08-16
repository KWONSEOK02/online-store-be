const mongoose = require("mongoose");
const Schema = mongoose.Schema;
require('dotenv').config();

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
  delete obj.updatedAt; 
  delete obj.createdAt;
  delete obj.__v; 
  return obj;
};

const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;