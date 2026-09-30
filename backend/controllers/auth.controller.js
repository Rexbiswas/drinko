const User = require('../models/User');
const LoyaltyTransaction = require('../models/LoyaltyTransaction');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'drinko_secret_jwt_safe', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @desc    Register a new customer account
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, confirmPassword, favoriteStyle } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.'
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in.'
      });
    }

    // Create user with 100 welcome loyalty beans
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : '',
      password: password,
      loyaltyPoints: 100,
      preferences: {
        favouriteDrink: favoriteStyle || 'Hazelnut Cold Brew',
        favouriteCategory: 'Coffee'
      }
    });

    // Record welcome bonus loyalty transaction
    await LoyaltyTransaction.create({
      user: user._id,
      type: 'WELCOME_BONUS',
      points: 100,
      balanceAfter: 100,
      reason: 'Welcome bonus on joining Drinko Artisan Club'
    });

    const token = generateToken(user._id);

    // Send back sanitized user
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profile: user.profile,
      loyaltyPoints: user.loyaltyPoints,
      preferences: user.preferences
    };

    res.status(201).json({
      success: true,
      token,
      user: userResponse,
      message: 'Account created successfully! +100 Loyalty Beans credited.'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    // Explicitly select password field since it is marked select: false
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No account found with this email. Please check your email or create an account.'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password does not match.'
      });
    }

    // Update lastLogin
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profile: user.profile,
      loyaltyPoints: user.loyaltyPoints,
      preferences: user.preferences,
      favourites: user.favourites
    };

    res.status(200).json({
      success: true,
      token,
      user: userResponse,
      message: `Welcome back, ${user.name}!`
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Logout user (clear cookie if any)
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
};


const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('favourites', 'name price image category rating slug');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (err) {
    next(err);
  }
};


const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your registered email address.'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account registered with this email address. Please check your spelling or sign up.'
      });
    }

    // Get reset token and 6-digit OTP and save
    const { resetToken, otp } = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Determine the client base URL (supports both local and production)
    const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;
    const resetUrl = `${origin}/index.html?resetToken=${resetToken}&email=${encodeURIComponent(user.email)}`;

    const message = `Hello ${user.name},\n\nYou requested to reset your password for Drinko Artisan Café.\n\nYour 6-Digit Verification Code is: ${otp}\n\nAlternatively, click the link below to reset directly:\n${resetUrl}\n\nThis code and link will expire in 15 minutes.`;

    const html = `
      <div style="background-color: #0f0a07; color: #f5ede4; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center;">
        <div style="max-width: 520px; margin: 0 auto; background: #1a120c; border: 1px solid #3d2817; border-radius: 16px; padding: 32px 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <div style="font-size: 40px; margin-bottom: 12px;">☕</div>
          <h2 style="color: #e6a86c; margin-top: 0; font-size: 24px; letter-spacing: 0.5px;">Drinko Artisan Café</h2>
          <p style="font-size: 15px; color: #c4b5a5; line-height: 1.6;">Hello <strong>${user.name}</strong>, use the verification code below to set your new password:</p>
          
          <div style="margin: 24px auto; background: #26170d; border: 2px dashed #e6a86c; border-radius: 14px; padding: 18px 24px; display: inline-block;">
            <div style="font-size: 12px; color: #d4a373; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; margin-bottom: 6px;">Your 6-Digit Reset Code</div>
            <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #ffcb77; font-family: 'Courier New', Courier, monospace;">${otp}</div>
          </div>

          <p style="font-size: 13px; color: #8f7f72; line-height: 1.5; margin-top: 15px;">Or reset with a single tap:</p>
          <div style="margin: 14px 0 24px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #c87d42, #e6a86c); color: #120a05; padding: 12px 26px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 15px rgba(230,168,108,0.3);">Reset My Password</a>
          </div>

          <p style="font-size: 12px; color: #8f7f72; line-height: 1.5;">This code will expire in <strong>15 minutes</strong>.<br>If you did not make this request, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #332115; margin: 24px 0;">
          <p style="font-size: 11px; color: #6b5d52;">Drinko Artisan Coffee & Crafted Beverages • Handcrafted with passion</p>
        </div>
      </div>
    `;

    try {
      const emailResult = await sendEmail({
        email: user.email,
        subject: `☕ [${otp}] Drinko Artisan Café — Password Reset Code`,
        message,
        html
      });

      res.status(200).json({
        success: true,
        message: `Verification code sent to ${user.email}!`,
        email: user.email
      });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordOtp = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Email could not be delivered. Please try again later.'
      });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Reset Password with 6-digit OTP code or reset token
// @route   PUT /api/auth/reset-password OR PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const rawCode = (req.params && req.params.token) || req.body.otp || req.body.token || req.body.code;
    const { email, password, confirmPassword } = req.body;

    if (!rawCode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your 6-digit verification code or reset token.'
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a new password.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.'
      });
    }

    const codeStr = String(rawCode).trim();
    const hashedCode = crypto.createHash('sha256').update(codeStr).digest('hex');

    // First try finding user matching OTP or Token
    let query = {
      resetPasswordExpire: { $gt: Date.now() },
      $or: [
        { resetPasswordOtp: hashedCode },
        { resetPasswordToken: hashedCode }
      ]
    };

    if (email) {
      query.email = email.toLowerCase().trim();
    }

    let user = await User.findOne(query);

    // If query with email fails, try without email filter (token is globally unique)
    if (!user && email) {
      delete query.email;
      user = await User.findOne(query);
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code. Please check your email or request a new code.'
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const authToken = generateToken(user._id);

    res.status(200).json({
      success: true,
      token: authToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        loyaltyPoints: user.loyaltyPoints,
        preferences: user.preferences
      },
      message: 'Password changed successfully! You can now sign in.'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword
};

