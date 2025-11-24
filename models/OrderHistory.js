const mongoose = require('mongoose');

// Order History Schema - Stores all past submissions
const orderHistorySchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  orderAmount: { type: Number, required: true },
  submittedAt: { type: Date, required: true },
  isArchived: { type: Boolean, default: false },
  archivedAt: { type: Date },
  productDetails: {
    sku: String,
    name: String,
    price: Number,
    unit: String
  }
});

module.exports = mongoose.model('OrderHistory', orderHistorySchema);
