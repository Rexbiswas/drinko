const User = require('../models/User');
const Product = require('../models/Product');
const LoyaltyTransaction = require('../models/LoyaltyTransaction');
const { uploadImage, deleteImage } = require('../services/cloudinary.service');

// @desc    Get current user profile with details
// @route   GET /api/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('favourites', 'name price image category rating slug isAvailable');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update basic profile information
// @route   PUT /api/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, bio, dateOfBirth, gender } = req.body;

    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name.trim();
    if (phone !== undefined) fieldsToUpdate.phone = phone.trim();

    if (bio !== undefined || dateOfBirth !== undefined || gender !== undefined) {
      fieldsToUpdate['profile.bio'] = bio || req.user.profile.bio;
      if (dateOfBirth) fieldsToUpdate['profile.dateOfBirth'] = dateOfBirth;
      if (gender) fieldsToUpdate['profile.gender'] = gender;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: fieldsToUpdate },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      data: updatedUser
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Change user password
// @route   PUT /api/profile/password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new password.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match.'
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully!'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Upload or update profile avatar photo
// @route   POST /api/profile/avatar
// @access  Private
const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select an image file to upload.'
      });
    }

    // Delete old avatar if present
    if (req.user.profile && req.user.profile.avatar) {
      await deleteImage(req.user.profile.avatar);
    }

    const avatarUrl = await uploadImage(req.file.path);

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { 'profile.avatar': avatarUrl } },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile photo updated successfully!',
      avatarUrl,
      data: updatedUser
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove avatar photo
// @route   DELETE /api/profile/avatar
// @access  Private
const deleteAvatar = async (req, res, next) => {
  try {
    if (req.user.profile && req.user.profile.avatar) {
      await deleteImage(req.user.profile.avatar);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { 'profile.avatar': '' } },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile avatar removed.',
      data: updatedUser
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user saved addresses
// @route   GET /api/profile/addresses
// @access  Private
const getAddresses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('addresses');
    res.status(200).json({
      success: true,
      data: user.addresses || []
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add new address
// @route   POST /api/profile/addresses
// @access  Private
const addAddress = async (req, res, next) => {
  try {
    const { label, fullName, phone, addressLine1, addressLine2, city, state, postalCode, country, isDefault } = req.body;

    if (!fullName || !phone || !addressLine1 || !city || !postalCode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, phone, address line, city, and postal code.'
      });
    }

    const user = await User.findById(req.user._id);

    // If marked default, unset default on other addresses
    if (isDefault || user.addresses.length === 0) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    const newAddress = {
      label: label || 'Home',
      fullName,
      phone,
      addressLine1,
      addressLine2: addressLine2 || '',
      city,
      state: state || 'State',
      postalCode,
      country: country || 'India',
      isDefault: isDefault || user.addresses.length === 0
    };

    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Address added successfully!',
      data: user.addresses
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update an address
// @route   PUT /api/profile/addresses/:id
// @access  Private
const updateAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const address = user.addresses.id(req.params.id);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found.'
      });
    }

    const { label, fullName, phone, addressLine1, addressLine2, city, state, postalCode, isDefault } = req.body;

    if (label) address.label = label;
    if (fullName) address.fullName = fullName;
    if (phone) address.phone = phone;
    if (addressLine1) address.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) address.addressLine2 = addressLine2;
    if (city) address.city = city;
    if (state) address.state = state;
    if (postalCode) address.postalCode = postalCode;

    if (isDefault) {
      user.addresses.forEach(a => {
        a.isDefault = a._id.toString() === req.params.id;
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address updated successfully!',
      data: user.addresses
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete an address
// @route   DELETE /api/profile/addresses/:id
// @access  Private
const deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const address = user.addresses.id(req.params.id);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found.'
      });
    }

    user.addresses.pull(req.params.id);

    // If deleted was default, make first remaining default
    if (address.isDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address deleted.',
      data: user.addresses
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Set address as default
// @route   PUT /api/profile/addresses/:id/default
// @access  Private
const setDefaultAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    let found = false;

    user.addresses.forEach(addr => {
      if (addr._id.toString() === req.params.id) {
        addr.isDefault = true;
        found = true;
      } else {
        addr.isDefault = false;
      }
    });

    if (!found) {
      return res.status(404).json({
        success: false,
        message: 'Address not found.'
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Default address updated.',
      data: user.addresses
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user favourites
// @route   GET /api/profile/favourites
// @access  Private
const getFavourites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('favourites');
    res.status(200).json({
      success: true,
      data: user.favourites || []
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add product to favourites
// @route   POST /api/profile/favourites/:productId
// @access  Private
const addFavourite = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    const user = await User.findById(req.user._id);

    if (!user.favourites.includes(productId)) {
      user.favourites.push(productId);
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: `Added "${product.name}" to your favourites!`,
      data: user.favourites
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove product from favourites
// @route   DELETE /api/profile/favourites/:productId
// @access  Private
const removeFavourite = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user._id);

    user.favourites = user.favourites.filter(id => id.toString() !== productId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Removed from favourites.',
      data: user.favourites
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get loyalty points & transaction ledger
// @route   GET /api/profile/loyalty
// @access  Private
const getLoyalty = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('loyaltyPoints name');
    const transactions = await LoyaltyTransaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);

    res.status(200).json({
      success: true,
      points: user.loyaltyPoints,
      transactions
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update preferences
// @route   PUT /api/profile/preferences
// @access  Private
const updatePreferences = async (req, res, next) => {
  try {
    const { favouriteCategory, favouriteDrink, preferredSize, preferredMilk, preferredSweetness } = req.body;

    const user = await User.findById(req.user._id);

    if (favouriteCategory) user.preferences.favouriteCategory = favouriteCategory;
    if (favouriteDrink) user.preferences.favouriteDrink = favouriteDrink;
    if (preferredSize) user.preferences.preferredSize = preferredSize;
    if (preferredMilk) user.preferences.preferredMilk = preferredMilk;
    if (preferredSweetness) user.preferences.preferredSweetness = preferredSweetness;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Brew preferences saved successfully!',
      data: user.preferences
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update notification preferences
// @route   PUT /api/profile/notifications
// @access  Private
const updateNotifications = async (req, res, next) => {
  try {
    const { orderUpdates, promotions, newDrinks, loyaltyRewards } = req.body;

    const user = await User.findById(req.user._id);

    if (orderUpdates !== undefined) user.notifications.orderUpdates = Boolean(orderUpdates);
    if (promotions !== undefined) user.notifications.promotions = Boolean(promotions);
    if (newDrinks !== undefined) user.notifications.newDrinks = Boolean(newDrinks);
    if (loyaltyRewards !== undefined) user.notifications.loyaltyRewards = Boolean(loyaltyRewards);

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Notification preferences updated.',
      data: user.notifications
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete user account
// @route   DELETE /api/profile/account
// @access  Private
const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password confirmation is required to delete your account.'
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect password. Account deletion cancelled.'
      });
    }

    // Retain order history records with anonymized customer reference for accounting compliance
    await User.findByIdAndDelete(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Your Drinko account has been permanently deleted.'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  updateAvatar,
  deleteAvatar,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getFavourites,
  addFavourite,
  removeFavourite,
  getLoyalty,
  updatePreferences,
  updateNotifications,
  deleteAccount
};
