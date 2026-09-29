const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/product.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/adminAuth');

router.route('/')
  .get(getProducts)
  .post(protect, authorize('admin', 'staff'), createProduct);

router.get('/category/:category', getProductsByCategory);

router.route('/:id')
  .get(getProductById)
  .put(protect, authorize('admin', 'staff'), updateProduct)
  .delete(protect, authorize('admin'), deleteProduct);

module.exports = router;
