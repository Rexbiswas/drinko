const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Please provide coupon code'],
    unique: true,
    uppercase: true,
    trim: true
  },
  discountType: {
    type: String,
    enum: ['PERCENTAGE', 'FLAT'],
    default: 'PERCENTAGE'
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minimumOrder: {
    type: Number,
    default: 0
  },
  maximumDiscount: {
    type: Number,
    default: 1000 // Cap for percentage discounts
  },
  expiryDate: {
    type: Date,
    default: () => new Date(+new Date() + 365*24*60*60*1000) // 1 year default
  },
  usageLimit: {
    type: Number,
    default: 1000
  },
  timesUsed: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Coupon', couponSchema);
