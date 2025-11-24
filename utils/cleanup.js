const OrderHistory = require('../models/OrderHistory');

// Cleanup archived orders older than 60 days
async function cleanupArchivedOrders() {
  try {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const result = await OrderHistory.deleteMany({
      isArchived: true,
      archivedAt: { $lt: sixtyDaysAgo }
    });

    if (result.deletedCount > 0) {
      console.log(`Deleted ${result.deletedCount} archived orders older than 60 days`);
    }
  } catch (error) {
    console.error('Error cleaning up archived orders:', error);
  }
}

// Schedule cleanup to run daily (every 24 hours)
function scheduleCleanup() {
  setInterval(cleanupArchivedOrders, 24 * 60 * 60 * 1000);
  // Run cleanup on startup
  cleanupArchivedOrders();
}

module.exports = { cleanupArchivedOrders, scheduleCleanup };
