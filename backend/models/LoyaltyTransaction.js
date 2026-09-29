const mongoose = require('mongoose');

const loyaltyTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  type: {
    type: String,
    enum: ['EARNED', 'REDEEMED', 'WELCOME_BONUS', 'ADMIN_ADJUSTMENT'],
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LoyaltyTransaction', loyaltyTransactionSchema);
