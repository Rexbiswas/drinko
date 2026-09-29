const User = require('../models/User');
const LoyaltyTransaction = require('../models/LoyaltyTransaction');

const getMyLoyalty = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('loyaltyPoints name');
    const transactions = await LoyaltyTransaction.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      points: user.loyaltyPoints,
      transactions
    });
  } catch (err) {
    next(err);
  }
};

const redeemPoints = async (req, res, next) => {
  try {
    const { pointsToRedeem, orderId } = req.body;
    const points = parseInt(pointsToRedeem, 10);

    if (isNaN(points) || points <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid points amount.' });
    }

    const user = await User.findById(req.user._id);

    if (user.loyaltyPoints < points) {
      return res.status(400).json({
        success: false,
        message: `Insufficient loyalty beans. You have ${user.loyaltyPoints} beans available.`
      });
    }

    user.loyaltyPoints -= points;
    await user.save();

    await LoyaltyTransaction.create({
      user: user._id,
      order: orderId || null,
      type: 'REDEEMED',
      points: -points,
      balanceAfter: user.loyaltyPoints,
      reason: 'Redeemed for order discount'
    });

    res.status(200).json({
      success: true,
      message: `${points} Loyalty Beans redeemed successfully!`,
      balance: user.loyaltyPoints
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyLoyalty, redeemPoints };
