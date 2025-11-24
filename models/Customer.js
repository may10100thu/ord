const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  companyName: { type: String, required: true },
  contactPerson: { type: String, required: true },
  lastActive: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

// Case-insensitive index for username
customerSchema.index({ username: 1 }, {
  unique: true,
  collation: { locale: 'en', strength: 2 }
});

module.exports = mongoose.model('Customer', customerSchema);
