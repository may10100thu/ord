const mongoose = require('mongoose');

// Order Schema - Tracks both draft and submitted orders
const orderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },

  // Draft order (customer is working on)
  orderAmount: { type: Number, default: 0 },  // Last updated amount (draft)
  lastUpdatedTimestamp: { type: Date },  // When draft was last updated

  // Submitted order (sent to admin)
  lastSubmittedAmount: { type: Number, default: 0 },  // Last submitted amount
  lastSubmittedTimestamp: { type: Date }  // When order was last submitted
});

module.exports = mongoose.model('Order', orderSchema);
