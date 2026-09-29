const express = require('express');
const router = express.Router();
const { initiatePayment, verifyPayment } = require('../controllers/payment.controller');

router.post('/create-order', initiatePayment);
router.post('/verify', verifyPayment);

module.exports = router;
