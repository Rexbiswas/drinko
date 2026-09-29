const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide product name'],
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide product description']
  },
  category: {
    type: String,
    required: [true, 'Please specify category (coffee, tea, mocktail, smoothie, etc.)'],
    lowercase: true,
    trim: true
  },
  categoryRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  price: {
    type: Number,
    required: [true, 'Please provide base price'],
    min: [0, 'Price cannot be negative']
  },
  rating: {
    type: Number,
    default: 4.9,
    min: 1,
    max: 5
  },
  reviewsCount: {
    type: Number,
    default: 0
  },
  calories: {
    type: String,
    default: '140 kcal'
  },
  image: {
    type: String,
    required: true,
    default: 'asset/coffee-cup.png'
  },
  gallery: [{
    type: String
  }],
  sizes: [{
    size: { type: String, enum: ['Small', 'Medium', 'Large'], default: 'Medium' },
    priceMultiplier: { type: Number, default: 1.0 },
    additionalPrice: { type: Number, default: 0 }
  }],
  customizationOptions: {
    milks: [{
      name: { type: String, required: true },
      additionalPrice: { type: Number, default: 0 }
    }],
    sweetness: [{
      level: { type: String, required: true },
      additionalPrice: { type: Number, default: 0 }
    }],
    iceLevels: [{
      level: { type: String, required: true },
      additionalPrice: { type: Number, default: 0 }
    }],
    toppings: [{
      name: { type: String, required: true },
      price: { type: Number, default: 0.80 }
    }]
  },
  ingredients: [{
    type: String
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isBestseller: {
    type: Boolean,
    default: false
  },
  stockRequired: [{
    ingredientName: { type: String, required: true },
    quantityNeeded: { type: Number, required: true },
    unit: { type: String, default: 'g' }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
