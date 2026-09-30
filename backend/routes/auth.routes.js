const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  logout, 
  getMe, 
  forgotPassword, 
  resetPassword,
  getGoogleConfig,
  googleAuth,
  linkGoogleAccount 
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// Google Identity Services endpoints
router.get('/google/config', getGoogleConfig);
router.post('/google', authLimiter, googleAuth);
router.post('/google/link', authLimiter, linkGoogleAccount);

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.post('/forgot-password', authLimiter, forgotPassword);
router.put('/reset-password', authLimiter, resetPassword);
router.put('/reset-password/:token', authLimiter, resetPassword);

module.exports = router;
