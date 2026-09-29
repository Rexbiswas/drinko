const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  tableNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  capacity: {
    type: Number,
    default: 4,
    min: 1
  },
  section: {
    type: String,
    enum: ['Main Lounge', 'Artisan Bar', 'Patio Garden', 'Mezzanine', 'Window Counter'],
    default: 'Main Lounge'
  },
  qrCodeUrl: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING'],
    default: 'AVAILABLE'
  },
  currentOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Table', tableSchema);
