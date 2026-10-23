const express = require('express');
const router = express.Router();
const {
  getBrands,
  getBrandBySlug,
  createBrand,
  updateBrand,
  deleteBrand
} = require('../controllers/brandController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(getBrands)
  .post(protect, admin, createBrand);

router.route('/:slug')
  .get(getBrandBySlug);

router.route('/id/:id')
  .put(protect, admin, updateBrand)
  .delete(protect, admin, deleteBrand);

module.exports = router;
