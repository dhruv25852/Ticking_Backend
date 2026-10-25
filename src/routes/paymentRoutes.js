const express = require('express');
const router = express.Router();
const {
  getPaymentConfig,
  createRazorpayOrder,
  verifyRazorpayPayment
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Get Razorpay configuration (Public Key ID & configuration status)
router.get('/config', getPaymentConfig);
router.get('/razorpay-key', getPaymentConfig);

// Initiate Razorpay checkout order
router.post('/create-order', protect, createRazorpayOrder);
router.post('/razorpay/create-order', protect, createRazorpayOrder);

// Cryptographically verify Razorpay payment and fulfill order
router.post('/verify', protect, verifyRazorpayPayment);
router.post('/razorpay/verify', protect, verifyRazorpayPayment);

module.exports = router;
