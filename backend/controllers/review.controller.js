const Review = require('../models/Review');

const getReviews = async (req, res, next) => {
  try {
    const { category } = req.query;
    let filter = { approved: true };

    if (category && category !== 'all') {
      filter.category = category.toLowerCase().trim();
    }

    const reviews = await Review.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (err) {
    next(err);
  }
};

const createReview = async (req, res, next) => {
  try {
    const { drinkName, category, rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide rating and review comment.'
      });
    }

    const review = await Review.create({
      customer: req.user._id,
      customerName: req.user.name,
      customerAvatar: req.user.profile?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
      drinkName: drinkName || 'Artisan Drink',
      category: category || 'coffee',
      rating: Number(rating),
      comment: comment.trim(),
      approved: true
    });

    res.status(201).json({
      success: true,
      message: 'Review published successfully!',
      data: review
    });
  } catch (err) {
    next(err);
  }
};

const updateReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    if (review.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to edit this review.' });
    }

    if (req.body.rating) review.rating = req.body.rating;
    if (req.body.comment) review.comment = req.body.comment.trim();
    if (req.body.drinkName) review.drinkName = req.body.drinkName;

    await review.save();

    res.status(200).json({
      success: true,
      message: 'Review updated.',
      data: review
    });
  } catch (err) {
    next(err);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    if (review.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this review.' });
    }

    await Review.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getReviews,
  createReview,
  updateReview,
  deleteReview
};
