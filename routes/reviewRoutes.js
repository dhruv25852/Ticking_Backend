const express = require('express');
const router = express.Router();
const {
  getProductReviews,
  createReview,
  getAllReviews,
  updateReviewStatus,
  deleteReview
} = require('../controllers/reviewController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/product/:productId', getProductReviews);
router.post('/', protect, createReview);
router.get('/', protect, admin, getAllReviews);
router.put('/:id/status', protect, admin, updateReviewStatus);
router.delete('/:id', protect, admin, deleteReview);

module.exports = router;
