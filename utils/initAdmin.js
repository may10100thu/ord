const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

// Initialize default admin account if none exists
async function initializeAdmin() {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const defaultUsername = process.env.ADMIN_USERNAME || 'admin';
      const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      const admin = new Admin({
        username: defaultUsername.toLowerCase(), // Store in lowercase
        password: hashedPassword
      });

      await admin.save();
      console.log(`✓ Default admin account created - Username: ${defaultUsername.toLowerCase()}`);
    } else {
      console.log(`✓ Admin account already exists (${adminCount} account(s) found)`);
    }
  } catch (error) {
    if (error.code === 11000) {
      console.log('✓ Admin account already exists in database');
    } else {
      console.error('Error initializing admin:', error);
    }
  }
}

module.exports = initializeAdmin;
