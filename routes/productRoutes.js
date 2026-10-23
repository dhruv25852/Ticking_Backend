const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  getProductBySlug,
  getFeaturedProducts,
  getNewArrivals,
  getBestSellers,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  deleteProductImage
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Special queries
router.get('/special/featured', getFeaturedProducts);
router.get('/special/new-arrivals', getNewArrivals);
router.get('/special/best-sellers', getBestSellers);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id/related', getRelatedProducts);

// Cloudinary image upload & deletion endpoints (Admin only)
router.post('/upload', protect, admin, upload.any(), uploadProductImages);
router.post('/delete-image', protect, admin, deleteProductImage);

// Standard CRUD
router.route('/')
  .get(getProducts)
  .post(protect, admin, createProduct);

router.route('/:id')
  .get(getProductById)
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);

module.exports = router;
