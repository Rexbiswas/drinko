const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const addressSchema = new mongoose.Schema({
  label: {
    type: String,
    enum: ['Home', 'Work', 'Other'],
    default: 'Home'
  },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String, default: '' },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, default: 'India' },
  isDefault: { type: Boolean, default: false }
}, { _id: true, timestamps: true });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true,
    maxlength: 80
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false // Never return password hash in queries unless explicitly selected
  },
  role: {
    type: String,
    enum: ['customer', 'staff', 'admin'],
    default: 'customer'
  },
  profile: {
    avatar: {
      type: String,
      default: ''
    },
    dateOfBirth: { type: Date },
    gender: {
      type: String,
      enum: ['male', 'female', 'non-binary', 'other', 'prefer-not-to-say', ''],
      default: ''
    },
    bio: { type: String, maxlength: 300, default: '' }
  },
  addresses: [addressSchema],
  favourites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  loyaltyPoints: {
    type: Number,
    default: 100, // Welcome gift of 100 beans
    min: 0
  },
  preferences: {
    favouriteCategory: { type: String, default: 'Coffee' },
    favouriteDrink: { type: String, default: 'Hazelnut Cold Brew' },
    preferredSize: { type: String, enum: ['Small', 'Medium', 'Large'], default: 'Medium' },
    preferredMilk: { type: String, default: 'Oat Milk (Barista Edition)' },
    preferredSweetness: { type: String, default: '50% Sweet' }
  },
  notifications: {
    orderUpdates: { type: Boolean, default: true },
    promotions: { type: Boolean, default: true },
    newDrinks: { type: Boolean, default: true },
    loyaltyRewards: { type: Boolean, default: true }
  },
  resetPasswordToken: String,
  resetPasswordOtp: String,
  resetPasswordExpire: Date,
  lastLogin: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Encrypt password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Password match helper
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password reset token & 6-digit OTP (valid for 15 minutes)
userSchema.methods.getResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(24).toString('hex');
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordOtp = crypto.createHash('sha256').update(otp).digest('hex');
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return { resetToken, otp };
};

module.exports = mongoose.model('User', userSchema);
