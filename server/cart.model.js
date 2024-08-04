const mongo = require('mongoose');

const CartSchema = new mongo.Schema({
  sessionId: { type: String},
  productId: { type: String},
  color: { type: String},
  size: { type: String},
  quantity: { type: Number},
});

module.exports = mongo.model('cart', CartSchema);