const express = require('express');
const router = express.Router();
const {
  getAdminOverview,
  getAllOrders,
  updateOrderStatus,
  getKitchenDisplayOrders,
  getAnalytics,
  getCustomers,
  toggleReviewApproval
} = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/adminAuth');

// All admin routes require authentication and staff/admin role
router.use(protect, authorize('admin', 'staff'));

router.get('/overview', getAdminOverview);
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.get('/kitchen', getKitchenDisplayOrders);
router.get('/analytics', authorize('admin'), getAnalytics);
router.get('/customers', getCustomers);
router.put('/reviews/:id/approve', authorize('admin'), toggleReviewApproval);

module.exports = router;
