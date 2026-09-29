const express = require('express');
const router = express.Router();
const { getMyLoyalty, redeemPoints } = require('../controllers/loyalty.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/balance', getMyLoyalty);
router.get('/transactions', getMyLoyalty);
router.post('/redeem', redeemPoints);

module.exports = router;
