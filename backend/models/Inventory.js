const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  ingredient: {
    type: String,
    required: [true, 'Please provide ingredient name'],
    unique: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  unit: {
    type: String,
    enum: ['kg', 'L', 'g', 'ml', 'pcs'],
    default: 'kg'
  },
  minimumStock: {
    type: Number,
    required: true,
    default: 1.0
  },
  cost: {
    type: Number,
    default: 0
  },
  lastRestocked: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for low stock status
inventorySchema.virtual('isLowStock').get(function() {
  return this.quantity <= this.minimumStock;
});

module.exports = mongoose.model('Inventory', inventorySchema);
