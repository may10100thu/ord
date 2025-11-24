const mongoose = require('mongoose');

// Product Schema - Products are now managed by admin and assigned to customers
const productSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  sku: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  unit: { type: String, required: true },
  lastUpdated: { type: Date, default: Date.now }
});

// Compound index to ensure SKU is unique per customer (same SKU can exist for different customers)
productSchema.index({ customerId: 1, sku: 1 }, { unique: true });

module.exports = mongoose.model('Product', productSchema);
