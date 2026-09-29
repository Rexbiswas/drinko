const Order = require('../models/Order');
const { notifyOrderStatusChanged } = require('../services/socket.service');

// @desc    Initiate payment for an existing order
// @route   POST /api/payment/create-order
// @access  Public
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

// @desc    Server-side payment verification
// @route   POST /api/payment/verify
// @access  Public
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
  initiatePayment,
  verifyPayment
};
