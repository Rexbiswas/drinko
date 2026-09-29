const Order = require('../models/Order');
const Setting = require('../models/Setting');
const User = require('../models/User');
const LoyaltyTransaction = require('../models/LoyaltyTransaction');
const QRCode = require('qrcode');
const { notifyOrderStatusChanged, notifyNewOrderPlaced } = require('../services/socket.service');

// Helper to get active Paytm UPI settings
const getActivePaytmSettings = async () => {
  let upiIdSetting = await Setting.findOne({ key: 'paytm_upi_id' });
  let merchantNameSetting = await Setting.findOne({ key: 'paytm_merchant_name' });

  const paytmUpiId = (upiIdSetting && upiIdSetting.value) 
    ? String(upiIdSetting.value).trim() 
    : (process.env.PAYTM_UPI_ID || 'drinko@paytm').trim();

  const paytmMerchantName = (merchantNameSetting && merchantNameSetting.value) 
    ? String(merchantNameSetting.value).trim() 
    : (process.env.PAYTM_MERCHANT_NAME || 'Drinko Artisan Cafe').trim();

  return { paytmUpiId, paytmMerchantName };
};

// @desc    Get Paytm UPI public configuration (UPI ID and Payee Name)
// @route   GET /api/payment/paytm-config
// @access  Public
const getPaytmConfig = async (req, res, next) => {
  try {
    const { paytmUpiId, paytmMerchantName } = await getActivePaytmSettings();
    res.status(200).json({
      success: true,
      paytmUpiId,
      paytmMerchantName,
      currency: 'INR'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Initiate Paytm Dynamic UPI Payment with QR Code & UPI deep link
// @route   POST /api/payment/paytm-upi/initiate
// @access  Public
const initiatePaytmUpi = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.paymentStatus === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'This order has already been paid for.',
        isPaid: true
      });
    }

    const { paytmUpiId, paytmMerchantName } = await getActivePaytmSettings();

    // Total in INR (2 decimal places)
    const amountFormatted = Number(order.total).toFixed(2);
    const transactionNote = `Drinko Order #${order.orderNumber}`;

    // Standard NPCI / Paytm UPI URI Specification:
    // upi://pay?pa=<VPA>&pn=<NAME>&am=<AMOUNT>&cu=INR&tn=<NOTE>&tr=<REF_ID>
    const upiUrl = `upi://pay?pa=${encodeURIComponent(paytmUpiId)}&pn=${encodeURIComponent(paytmMerchantName)}&am=${amountFormatted}&cu=INR&tn=${encodeURIComponent(transactionNote)}&tr=${encodeURIComponent(order.orderNumber)}`;

    // Generate high quality QR code data URL (offline, no external network dependency)
    const qrCodeDataUrl = await QRCode.toDataURL(upiUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 2,
      scale: 8,
      color: {
        dark: '#23140d', // Rich artisan dark roast coffee
        light: '#fffdfa' // Warm cream parchment
      }
    });

    // Update order with pending Paytm UPI payment method
    order.paymentMethod = 'PAYTM_UPI';
    await order.save();

    res.status(200).json({
      success: true,
      orderId: order._id,
      orderNumber: order.orderNumber,
      amount: Number(amountFormatted),
      currency: 'INR',
      payeeVpa: paytmUpiId,
      payeeName: paytmMerchantName,
      upiUrl,
      qrCodeDataUrl,
      note: transactionNote
    });
  } catch (err) {
    next(err);
  }
};


const submitPaytmUtr = async (req, res, next) => {
  try {
    const { orderId, utr, payerVpa } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required.'
      });
    }

    const cleanUtr = (utr && String(utr).trim().length >= 4)
      ? String(utr).trim()
      : `PAYTM_${Date.now()}`;

    const order = await Order.findById(orderId).populate('customer', 'name email loyaltyPoints');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.paymentStatus === 'PAID') {
      return res.status(200).json({
        success: true,
        message: 'This order is already marked as paid.',
        data: order
      });
    }

    // Check if this UTR has already been claimed on another order to avoid fraud
    const duplicateUtrOrder = await Order.findOne({
      upiTransactionId: cleanUtr,
      paymentStatus: 'PAID',
      _id: { $ne: order._id }
    });

    if (duplicateUtrOrder) {
      return res.status(400).json({
        success: false,
        message: `This UTR (${cleanUtr}) has already been registered for Order #${duplicateUtrOrder.orderNumber}.`
      });
    }

    // Update Order payment and confirmation status
    order.paymentStatus = 'PAID';
    order.paymentMethod = 'PAYTM_UPI';
    order.paymentId = cleanUtr;
    order.upiTransactionId = cleanUtr;
    if (payerVpa) {
      order.upiPayerVpa = String(payerVpa).trim();
    }
    order.paymentTimestamp = new Date();
    order.orderStatus = 'CONFIRMED';
    order.statusTimeline.push({
      status: 'CONFIRMED',
      timestamp: new Date(),
      note: `Payment verified via Paytm UPI. UTR / Ref: ${cleanUtr}`
    });

    await order.save();

    // Award loyalty points if not already awarded
    if (order.customer && order.loyaltyPointsEarned > 0) {
      try {
        const user = await User.findById(order.customer._id || order.customer);
        if (user) {
          const existingTransaction = await LoyaltyTransaction.findOne({
            user: user._id,
            order: order._id,
            type: 'EARNED'
          });

          if (!existingTransaction) {
            user.loyaltyPoints = (user.loyaltyPoints || 0) + order.loyaltyPointsEarned;
            await user.save();

            await LoyaltyTransaction.create({
              user: user._id,
              order: order._id,
              type: 'EARNED',
              points: order.loyaltyPointsEarned,
              balanceAfter: user.loyaltyPoints,
              reason: `Earned from Order #${order.orderNumber} (Paytm UPI Payment)`
            });
          }
        }
      } catch (loyaltyErr) {
        console.warn('[Paytm UPI] Loyalty award note:', loyaltyErr.message);
      }
    }

    // Broadcast live update to Kitchen Display and Admin Dashboard
    notifyOrderStatusChanged(order);
    notifyNewOrderPlaced(order);

    res.status(200).json({
      success: true,
      message: 'Payment verified! Your order has been placed and confirmed.',
      data: order
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Paytm UPI Settings (Merchant ID / UPI VPA)
// @route   PUT /api/payment/paytm-settings
// @access  Admin / Private
const updatePaytmSettings = async (req, res, next) => {
  try {
    const { paytmUpiId, paytmMerchantName } = req.body;

    if (!paytmUpiId || !paytmUpiId.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid UPI ID (e.g. yourname@paytm).'
      });
    }

    await Setting.findOneAndUpdate(
      { key: 'paytm_upi_id' },
      { key: 'paytm_upi_id', value: paytmUpiId.trim(), description: 'Active Paytm UPI ID for receiving payments' },
      { upsert: true, new: true }
    );

    if (paytmMerchantName) {
      await Setting.findOneAndUpdate(
        { key: 'paytm_merchant_name' },
        { key: 'paytm_merchant_name', value: paytmMerchantName.trim(), description: 'Paytm Business Display Name' },
        { upsert: true, new: true }
      );
    }

    const updated = await getActivePaytmSettings();

    res.status(200).json({
      success: true,
      message: 'Paytm Payment Settings updated successfully!',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

// Backward-compatible generic order initiation
const initiatePayment = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.paymentStatus === 'PAID') {
      return res.status(400).json({ success: false, message: 'This order has already been paid.' });
    }

    const paymentOrder = {
      id: `order_${Date.now()}`,
      amount: Math.round(order.total * 100),
      currency: 'INR',
      status: 'created'
    };
    order.razorpayOrderId = paymentOrder.id;
    await order.save();

    res.status(200).json({
      success: true,
      order: paymentOrder,
      drinkoOrder: {
        id: order._id,
        orderNumber: order.orderNumber,
        total: order.total
      }
    });
  } catch (err) {
    next(err);
  }
};

// Backward-compatible payment verification
const verifyPayment = async (req, res, next) => {
  try {
    const { orderId, razorpayPaymentId } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    order.paymentStatus = 'PAID';
    order.paymentId = razorpayPaymentId || `pay_${Date.now()}`;
    order.orderStatus = 'CONFIRMED';
    order.statusTimeline.push({
      status: 'CONFIRMED',
      note: 'Payment verified and captured.'
    });

    await order.save();
    notifyOrderStatusChanged(order);

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully! Order is confirmed.',
      data: order
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPaytmConfig,
  initiatePaytmUpi,
  submitPaytmUtr,
  updatePaytmSettings,
  initiatePayment,
  verifyPayment
};
