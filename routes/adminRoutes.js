const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllCustomers,
  getInventoryReport,
  updateStock,
  getPaymentsOverview
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect, admin);

router.get('/dashboard', getDashboardStats);
router.get('/customers', getAllCustomers);
router.get('/inventory', getInventoryReport);
router.put('/inventory/:id', updateStock);
router.get('/payments', getPaymentsOverview);

module.exports = router;
