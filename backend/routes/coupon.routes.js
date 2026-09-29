const express = require('express');
const router = express.Router();
const {
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon
} = require('../controllers/coupon.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/adminAuth');

router.post('/validate', validateCoupon);

router.route('/admin')
  .get(protect, authorize('admin', 'staff'), getCoupons)
  .post(protect, authorize('admin'), createCoupon);

router.route('/admin/:id')
  .put(protect, authorize('admin'), updateCoupon)
  .delete(protect, authorize('admin'), deleteCoupon);

module.exports = router;
