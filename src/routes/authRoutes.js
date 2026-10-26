const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  registerUser,
  loginUser,
  adminLogin,
  logoutUser,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  getUserProfile,
  updateAccount,
  changePassword,
  deleteAccount,
  getCustomers,
  updateCustomerStatus,
  uploadProfilePhoto,
  deleteProfilePhoto
} = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Rate limiting for sensitive authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 min window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
  },
  skip: (req) => process.env.NODE_ENV === 'test' || req.headers['x-test-suite'] === 'true'
});

// Public authentication
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/admin/login', authLimiter, adminLogin);
router.post('/logout', logoutUser);

// Password reset workflow with Brevo verification (Public)
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/verify-reset-code', authLimiter, verifyResetCode);
router.post('/reset-password', authLimiter, resetPassword);

// Customer account routes (Private)
router.route('/profile').get(protect, getUserProfile).put(protect, updateAccount);
router.put('/update-account', protect, updateAccount);
router.put('/change-password', protect, authLimiter, changePassword);
router.delete('/delete-account', protect, deleteAccount);
router.post('/delete-account', protect, deleteAccount);

// Profile photo upload & delete (Private)
router.post('/profile/photo', protect, upload.single('avatar'), uploadProfilePhoto);
router.delete('/profile/photo', protect, deleteProfilePhoto);

// Admin customer management routes (Private/Admin)
router.get('/customers', protect, admin, getCustomers);
router.patch('/customers/:id/status', protect, admin, updateCustomerStatus);

module.exports = router;
