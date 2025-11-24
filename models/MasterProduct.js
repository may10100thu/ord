const mongoose = require('mongoose');

// Master Product Schema - Central product catalog
const manageProductSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  unit: { type: String, required: true },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MasterProduct', manageProductSchema);
