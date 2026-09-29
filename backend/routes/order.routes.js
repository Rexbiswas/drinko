const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  reorder,
  verifyPayment
} = require('../controllers/order.controller');
const { protect } = require('../middleware/auth');

// Optional auth helper: if bearer token is present, populate req.user, otherwise continue as guest
const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'drinko_secret_jwt_safe');
      req.user = await User.findById(decoded.id).select('-password');
    } catch (e) {}
  }
  next();
};

router.post('/', optionalAuth, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/:id', optionalAuth, getOrderById);
router.put('/:id/cancel', protect, cancelOrder);
router.post('/:id/reorder', protect, reorder);
router.put('/:id/verify-payment', verifyPayment);

module.exports = router;
