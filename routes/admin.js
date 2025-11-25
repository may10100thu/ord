const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Order = require('../models/Order');
const OrderHistory = require('../models/OrderHistory');
const MasterProduct = require('../models/MasterProduct');
const { authenticateToken } = require('../middleware/auth');

// Change admin password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { currentPassword, newPassword } = req.body;
    const Admin = require('../models/Admin');
    const admin = await Admin.findById(req.user.id);

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const validPassword = await bcrypt.compare(currentPassword, admin.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    await admin.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all products grouped by customer (for manage-customers page)
router.get('/all-products', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const products = await Product.find().populate('customerId', 'companyName contactPerson username');

    const validProducts = [];
    const orphanedProducts = [];

    for (const product of products) {
      if (!product.customerId) {
        orphanedProducts.push(product._id);
      } else {
        validProducts.push(product);
      }
    }

    if (orphanedProducts.length > 0) {
      await Product.deleteMany({ _id: { $in: orphanedProducts } });
      await Order.deleteMany({ productId: { $in: orphanedProducts } });
    }

    const productsWithOrders = await Promise.all(validProducts.map(async (product) => {
      const order = await Order.findOne({
        customerId: product.customerId._id,
        productId: product._id
      });

      const orderAmount = order ? (order.lastSubmittedAmount || 0) : 0;

      return {
        ...product.toObject(),
        orderAmount: orderAmount,
        orderLastUpdated: order ? order.lastSubmittedTimestamp : null
      };
    }));

    // Group ALL products by customer (including those with no orders)
    const groupedProducts = productsWithOrders.reduce((acc, product) => {
      const customerId = product.customerId._id.toString();
      if (!acc[customerId]) {
        acc[customerId] = {
          customer: product.customerId,
          products: []
        };
      }
      acc[customerId].products.push({
        _id: product._id,
        sku: product.sku,
        name: product.name,
        price: product.price,
        unit: product.unit,
        orderAmount: product.orderAmount,
        lastUpdated: product.lastUpdated,
        orderLastUpdated: product.orderLastUpdated
      });
      return acc;
    }, {});

    res.json(Object.values(groupedProducts));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all products with orders grouped by customer (for dashboard)
router.get('/products', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const products = await Product.find().populate('customerId', 'companyName contactPerson username');

    const validProducts = [];
    const orphanedProducts = [];

    for (const product of products) {
      if (!product.customerId) {
        orphanedProducts.push(product._id);
      } else {
        validProducts.push(product);
      }
    }

    if (orphanedProducts.length > 0) {
      await Product.deleteMany({ _id: { $in: orphanedProducts } });
      await Order.deleteMany({ productId: { $in: orphanedProducts } });
    }

    const productsWithOrders = await Promise.all(validProducts.map(async (product) => {
      const order = await Order.findOne({
        customerId: product.customerId._id,
        productId: product._id
      });

      const orderAmount = order ? (order.lastSubmittedAmount || 0) : 0;

      return {
        ...product.toObject(),
        orderAmount: orderAmount,
        orderLastUpdated: order ? order.lastSubmittedTimestamp : null
      };
    }));

    const groupedProducts = productsWithOrders.reduce((acc, product) => {
      if (product.orderAmount <= 0) {
        return acc;
      }

      const customerId = product.customerId._id.toString();
      if (!acc[customerId]) {
        acc[customerId] = {
          customer: product.customerId,
          products: []
        };
      }
      acc[customerId].products.push({
        _id: product._id,
        sku: product.sku,
        name: product.name,
        price: product.price,
        unit: product.unit,
        orderAmount: product.orderAmount,
        lastUpdated: product.lastUpdated,
        orderLastUpdated: product.orderLastUpdated
      });
      return acc;
    }, {});

    res.json(Object.values(groupedProducts));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add customer
router.post('/customers', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { username, password, companyName, contactPerson } = req.body;

    const existingCustomer = await Customer.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') }
    });

    if (existingCustomer) {
      return res.status(400).json({ error: 'Username already exists (case-insensitive)' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const customer = new Customer({
      username: username.toLowerCase(),
      password: hashedPassword,
      companyName,
      contactPerson
    });

    await customer.save();
    res.status(201).json({ message: 'Customer created successfully', customer });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get all customers
router.get('/customers', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const customers = await Customer.find().select('-password');
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update customer
router.put('/customers/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { username, companyName, contactPerson, password } = req.body;
    const updateData = { username: username.toLowerCase(), companyName, contactPerson };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password');

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ message: 'Customer updated successfully', customer });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete customer
router.delete('/customers/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await Product.deleteMany({ customerId: req.params.id });
    await Order.deleteMany({ customerId: req.params.id });
    await OrderHistory.deleteMany({ customerId: req.params.id });

    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ message: 'Customer and all associated data deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get order history for a customer
router.get('/order-history/:customerId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const mostRecentOrder = await OrderHistory.findOne({
      customerId: req.params.customerId,
      orderAmount: { $gt: 0 },
      isArchived: { $ne: true }
    })
      .sort({ submittedAt: -1 })
      .limit(1);

    const query = {
      customerId: req.params.customerId,
      orderAmount: { $gt: 0 },
      isArchived: { $ne: true }
    };

    if (mostRecentOrder) {
      query.submittedAt = { $lt: mostRecentOrder.submittedAt };
    }

    const history = await OrderHistory.find(query)
      .sort({ submittedAt: -1 })
      .limit(100);

    const groupedHistory = history.reduce((acc, entry) => {
      const timestamp = entry.submittedAt.toISOString();
      if (!acc[timestamp]) {
        acc[timestamp] = {
          submittedAt: entry.submittedAt,
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
    console.error('Error fetching order history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Archive order
router.post('/archive-order/:customerId/:submittedAt', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { customerId, submittedAt } = req.params;
    const submissionDate = new Date(submittedAt);

    const result = await OrderHistory.updateMany(
      {
        customerId: customerId,
        submittedAt: submissionDate
      },
      {
        isArchived: true,
        archivedAt: new Date()
      }
    );

    await Order.updateMany(
      {
        customerId: customerId,
        lastSubmittedTimestamp: submissionDate
      },
      {
        lastSubmittedAmount: 0,
        lastSubmittedTimestamp: null
      }
    );

    res.json({
      message: 'Order archived successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error archiving order:', error);
    res.status(500).json({ error: error.message });
  }
});

// Master Products Routes
router.get('/manage-products', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const products = await MasterProduct.find().sort({ sku: 1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/manage-products', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { sku, name, price, unit } = req.body;

    const existingProduct = await MasterProduct.findOne({ sku: sku });
    if (existingProduct) {
      return res.status(400).json({ error: `Product with SKU "${sku}" already exists` });
    }

    const product = new MasterProduct({
      sku,
      name,
      price,
      unit,
      lastUpdated: new Date()
    });

    await product.save();
    res.status(201).json({ message: 'Product added successfully', product });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'SKU already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});
// Update manage product
router.put('/manage-products/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { sku, name, price, unit } = req.body;

    // Check if new SKU conflicts with another product
    if (sku) {
      const existing = await MasterProduct.findOne({
        _id: { $ne: req.params.id },
        sku: sku
      });
      if (existing) {
        return res.status(400).json({ error: `SKU "${sku}" already exists` });
      }
    }

    const product = await MasterProduct.findByIdAndUpdate(
      req.params.id,
      { sku, name, price, unit, lastUpdated: new Date() },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    console.error('Error updating manage product:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/manage-products/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const product = await MasterProduct.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Master product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove product from customer
router.delete('/customer/:customerId/product/:productId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { customerId, productId } = req.params;

    // Delete the product
    const product = await Product.findOneAndDelete({
      _id: productId,
      customerId: customerId
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found for this customer' });
    }

    // Delete associated orders
    await Order.deleteMany({
      productId: productId,
      customerId: customerId
    });

    // Delete associated order history
    await OrderHistory.deleteMany({
      productId: productId,
      customerId: customerId
    });

    res.json({ message: 'Product removed from customer successfully' });
  } catch (error) {
    console.error('Error removing product from customer:', error);
    res.status(500).json({ error: error.message });
  }
});

// Assign master products to customers
router.post('/assign-products', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { customerIds, productIds } = req.body;

    if (!customerIds || !productIds || customerIds.length === 0 || productIds.length === 0) {
      return res.status(400).json({ error: 'Please provide customer IDs and product IDs' });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Get all master products
    const masterProducts = await MasterProduct.find({ _id: { $in: productIds } });

    // For each customer
    for (const customerId of customerIds) {
      const customer = await Customer.findById(customerId);
      if (!customer) {
        errors.push(`Customer ${customerId} not found`);
        errorCount++;
        continue;
      }

      // For each product
      for (const masterProduct of masterProducts) {
        try {
          // Check if product already exists for this customer
          const existingProduct = await Product.findOne({
            customerId: customerId,
            sku: masterProduct.sku
          });

          if (existingProduct) {
            // Update existing product with master product details
            existingProduct.name = masterProduct.name;
            existingProduct.price = masterProduct.price;
            existingProduct.unit = masterProduct.unit;
            existingProduct.lastUpdated = new Date();
            await existingProduct.save();
          } else {
            // Create new product for customer
            const newProduct = new Product({
              customerId: customerId,
              sku: masterProduct.sku,
              name: masterProduct.name,
              price: masterProduct.price,
              unit: masterProduct.unit,
              lastUpdated: new Date()
            });
            await newProduct.save();
          }
          successCount++;
        } catch (error) {
          errors.push(`Error assigning ${masterProduct.sku} to ${customer.companyName}: ${error.message}`);
          errorCount++;
        }
      }
    }

    if (errorCount > 0) {
      return res.status(207).json({
        message: `Assigned ${successCount} product(s) with ${errorCount} error(s)`,
        errors: errors
      });
    }

    res.json({ message: `Successfully assigned ${successCount} product(s) to customer(s)` });
  } catch (error) {
    console.error('Error assigning products:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const totalCustomers = await Customer.countDocuments();
    const totalProducts = await Product.countDocuments();
    
    // Get customers active today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeToday = await Customer.countDocuments({
      lastActive: { $gte: today }
    });

    // Get new customers this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const newThisWeek = await Customer.countDocuments({
      createdAt: { $gte: weekAgo }
    });

    res.json({
      totalCustomers,
      totalProducts,
      activeToday,
      newThisWeek
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;
