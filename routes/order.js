const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const OrderHistory = require('../models/OrderHistory');
const { authenticateToken } = require('../middleware/auth');

// Update order amount (draft)
router.post('/update', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { productId, orderAmount } = req.body;

    const updatedOrder = await Order.findOneAndUpdate(
      { customerId: req.user.id, productId: productId },
      {
        orderAmount: orderAmount,
        lastUpdatedTimestamp: new Date()
      },
      { upsert: true, new: true }
    );

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update all draft orders
router.post('/update-all', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { orders } = req.body;
    const timestamp = new Date();

    for (const order of orders) {
      await Order.findOneAndUpdate(
        { customerId: req.user.id, productId: order.productId },
        {
          orderAmount: order.orderAmount,
          lastUpdatedTimestamp: timestamp
        },
        { upsert: true, new: true }
      );
    }

    res.json({ message: 'All drafts updated successfully', timestamp });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit all orders
router.post('/submit-all', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { orders } = req.body;
    const timestamp = new Date();

    for (const order of orders) {
      const { productId, orderAmount } = order;

      // Get product details for history
      const product = await Product.findById(productId);
      if (!product) continue;

      // Save to order history (only if quantity > 0)
      if (orderAmount > 0) {
        const historyEntry = new OrderHistory({
          customerId: req.user.id,
          productId: productId,
          orderAmount: orderAmount,
          submittedAt: timestamp,
          productDetails: {
            sku: product.sku,
            name: product.name,
            price: product.price,
            unit: product.unit
          }
        });
        await historyEntry.save();
      }

      // Update current order - set submitted amount and reset draft
      const updatedOrder = await Order.findOneAndUpdate(
        { customerId: req.user.id, productId: productId },
        {
          lastSubmittedAmount: orderAmount,
          lastSubmittedTimestamp: timestamp,
          orderAmount: 0,
          lastUpdatedTimestamp: timestamp
        },
        { new: true, upsert: true }
      );
    }

    res.json({ message: 'Orders submitted successfully', timestamp });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
