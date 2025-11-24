const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { authenticateToken } = require('../middleware/auth');

// Admin: Add product and assign to customer
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { customerId, sku, name, price, unit } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const existingProduct = await Product.findOne({
      customerId: customerId,
      sku: sku
    });

    if (existingProduct) {
      return res.status(400).json({
        error: `Product with SKU "${sku}" already exists for customer ${customer.companyName}. Please use a different SKU or update the existing product.`
      });
    }

    const product = new Product({
      customerId,
      sku,
      name,
      price,
      unit,
      lastUpdated: new Date()
    });

    await product.save();
    res.status(201).json({ message: 'Product added successfully', product });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin: Get all products for a customer
router.get('/customer/:customerId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const products = await Product.find({ customerId: req.params.customerId });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Update product
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { sku, name, price, unit } = req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { sku, name, price, unit, lastUpdated: new Date() },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'SKU already exists for this customer' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Admin: Delete product
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await Order.deleteMany({ productId: req.params.id });

    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product and associated orders deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
