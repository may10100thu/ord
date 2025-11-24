const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const Admin = require('../models/Admin');
const { JWT_SECRET } = require('../middleware/auth');

// Customer Login (case-insensitive)
router.post('/customer/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find customer by username (case-insensitive)
    const customer = await Customer.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') }
    });

    if (!customer) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, customer.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Update last active
    customer.lastActive = new Date();
    await customer.save();

    // Create JWT token
    const token = jwt.sign(
      { id: customer._id, username: customer.username, role: 'customer' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      customer: {
        id: customer._id,
        username: customer.username,
        companyName: customer.companyName,
        contactPerson: customer.contactPerson
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Login
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find admin in database (case-insensitive)
    const admin = await Admin.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') }
    });

    if (!admin) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: admin._id, username: admin.username, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
