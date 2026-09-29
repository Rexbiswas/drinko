const express = require('express');
const router = express.Router();
const {
  getPaytmConfig,
  initiatePaytmUpi,
  submitPaytmUtr,
  updatePaytmSettings,
  initiatePayment,
  verifyPayment
} = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/adminAuth');

// Public Paytm UPI endpoints
router.get('/paytm-config', getPaytmConfig);
router.post('/paytm-upi/initiate', initiatePaytmUpi);
router.post('/paytm-upi/submit-utr', submitPaytmUtr);

// Admin configuration endpoint
router.put('/paytm-settings', protect, authorize('admin'), updatePaytmSettings);

// Legacy Razorpay / generic endpoints
router.post('/create-order', initiatePayment);
router.post('/verify', verifyPayment);

module.exports = router;
