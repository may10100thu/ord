const express = require('express');
const path = require('path');
const cors = require('cors');
const connectDB = require('./config/database');
const initializeAdmin = require('./utils/initAdmin');
const { scheduleCleanup } = require('./utils/cleanup');

// Import routes
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customer');
const adminRoutes = require('./routes/admin');
const orderRoutes = require('./routes/order');
const productRoutes = require('./routes/product');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// Connect to MongoDB
connectDB().then(() => {
  // Initialize admin account after DB connection
  initializeAdmin();
  // Schedule cleanup of archived orders
  scheduleCleanup();
});

// API Routes
app.use('/api', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin/products', productRoutes);

// Serve frontend pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/manage-customers.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'manage-customers.html'));
});

app.get('/products.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'products.html'));
});

app.get('/manage-suppliers.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'manage-suppliers.html'));
});

app.get('/order-history.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'order-history.html'));
});

app.get('/customer-order-history.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'customer-order-history.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Admin login: Check database for admin account');
});
