const express = require('express');
const router = express.Router();
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist
} = require('../controllers/wishlistController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getWishlist)
  .post(addToWishlist);

router.route('/:productId')
  .delete(removeFromWishlist);

module.exports = router;
