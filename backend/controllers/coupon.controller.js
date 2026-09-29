const Coupon = require('../models/Coupon');

// @desc    Validate coupon code
// @route   POST /api/coupons/validate
// @access  Public
const validateCoupon = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Please provide a coupon code.' });
    }

    const orderSubtotal = Number(subtotal) || 0;
    const cleanCode = code.trim().toUpperCase();

    const coupon = await Coupon.findOne({ code: cleanCode, isActive: true });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or inactive promo code.' });
    }

    const now = new Date();
    if (coupon.expiryDate && coupon.expiryDate < now) {
      return res.status(400).json({ success: false, message: 'This promo code has expired.' });
    }

    if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'This promo code has reached its maximum usage limit.' });
    }

    if (orderSubtotal < coupon.minimumOrder) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ₹${coupon.minimumOrder} required to apply this coupon.`
      });
    }

    let discount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      const calculated = (orderSubtotal * coupon.discountValue) / 100;
      discount = Math.min(calculated, coupon.maximumDiscount || 1000);
    } else {
      discount = Math.min(coupon.discountValue, orderSubtotal);
    }

    discount = Math.round(discount * 100) / 100;

    res.status(200).json({
      success: true,
      message: `Promo code "${coupon.code}" applied!`,
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: discount,
        discount: discount
      }
    });
  } catch (err) {
    next(err);
  }
};

// Admin endpoints
const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: coupons.length, data: coupons });
  } catch (err) {
    next(err);
  }
};

const createCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, message: 'Coupon created.', data: coupon });
  } catch (err) {
    next(err);
  }
};

const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, message: 'Coupon updated.', data: coupon });
  } catch (err) {
    next(err);
  }
};

const deleteCoupon = async (req, res, next) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Coupon deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon
};
