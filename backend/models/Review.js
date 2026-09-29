const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerAvatar: {
    type: String,
    default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop'
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  drinkName: {
    type: String,
    default: 'Signature Artisan Brew'
  },
  category: {
    type: String,
    enum: ['coffee', 'tea', 'mocktail', 'smoothie', 'general'],
    default: 'coffee'
  },
  rating: {
    type: Number,
    required: [true, 'Please provide rating between 1 and 5'],
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: [true, 'Please provide review comment'],
    trim: true,
    maxlength: 600
  },
  approved: {
    type: Boolean,
    default: true // auto-approve verified customer reviews, can be toggled by admin
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Review', reviewSchema);
