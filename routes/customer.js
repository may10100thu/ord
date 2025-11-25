const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Order = require('../models/Order');
const OrderHistory = require('../models/OrderHistory');
const { authenticateToken } = require('../middleware/auth');

// Get customer's products
router.get('/products', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const products = await Product.find({ customerId: req.user.id });

    // Get order amounts for each product
    const productsWithOrders = await Promise.all(products.map(async (product) => {
      const order = await Order.findOne({
        customerId: req.user.id,
        productId: product._id
      });

      return {
        ...product.toObject(),
        orderAmount: order ? order.orderAmount : 0,
        lastUpdatedTimestamp: order ? order.lastUpdatedTimestamp : null,
        lastSubmittedTimestamp: order ? order.lastSubmittedTimestamp : null
      };
    }));

    res.json(productsWithOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update customer password
router.put('/password', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { currentPassword, newPassword } = req.body;

    const customer = await Customer.findById(req.user.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, customer.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    customer.password = hashedPassword;
    await customer.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get customer order history (view their own history)
router.get('/order-history', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get ALL orders for this customer (including archived ones)
    // Only exclude orders that are actually deleted from the database
    const history = await OrderHistory.find({
      customerId: req.user.id,
      orderAmount: { $gt: 0 }
    })
      .sort({ submittedAt: -1 })
      .limit(100);

    // Group by submission timestamp
    const groupedHistory = history.reduce((acc, entry) => {
      const timestamp = entry.submittedAt.toISOString();
      if (!acc[timestamp]) {
        acc[timestamp] = {
          submittedAt: entry.submittedAt,
          isArchived: entry.isArchived || false,
          items: []
        };
      }
      acc[timestamp].items.push({
        sku: entry.productDetails.sku,
        name: entry.productDetails.name,
        price: entry.productDetails.price,
        unit: entry.productDetails.unit,
        orderAmount: entry.orderAmount
      });
      return acc;
    }, {});

    const result = Object.values(groupedHistory);
    res.json(result);
  } catch (error) {
    console.error('Error fetching customer order history:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
