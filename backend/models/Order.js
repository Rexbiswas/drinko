const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  image: { type: String },
  size: { type: String, default: 'Medium' },
  milk: { type: String, default: 'Regular' },
  sweetness: { type: String, default: '100% Sweet' },
  ice: { type: String, default: '100% Ice' },
  toppings: [{
    name: String,
    price: Number
  }],
  unitPrice: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  guestInfo: {
    name: String,
    email: String,
    phone: String
  },
  orderType: {
    type: String,
    enum: ['DELIVERY', 'DINE_IN', 'PICKUP'],
    default: 'DELIVERY'
  },
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table'
  },
  tableNumber: {
    type: String,
    default: ''
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  couponCode: {
    type: String,
    default: ''
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  deliveryFee: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryAddress: {
    fullName: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  },
  paymentMethod: {
    type: String,
    enum: ['RAZORPAY', 'DEV_MOCK', 'MOCK_RAZORPAY', 'CASH_ON_DELIVERY', 'TABLE_PAY', 'PAYTM_UPI', 'PAYTM', 'UPI'],
    default: 'PAYTM_UPI'
  },
  paymentId: {
    type: String,
    default: ''
  },
  upiTransactionId: {
    type: String,
    default: ''
  },
  upiPayerVpa: {
    type: String,
    default: ''
  },
  paymentTimestamp: {
    type: Date
  },
  razorpayOrderId: {
    type: String,
    default: ''
  },
  orderStatus: {
    type: String,
    enum: ['PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'],
    default: 'PLACED'
  },
  customerNotes: {
    type: String,
    default: ''
  },
  loyaltyPointsEarned: {
    type: Number,
    default: 0
  },
  loyaltyPointsRedeemed: {
    type: Number,
    default: 0
  },
  statusTimeline: [{
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String, default: '' }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
