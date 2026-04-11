const Review = require('../models/Review');
const User = require('../models/User');
const Ride = require('../models/Ride');

// POST /api/reviews
exports.createReview = async (req, res, next) => {
  try {
    const { rideId, revieweeId, rating, comment } = req.body;

    if (!rideId || !revieweeId || !rating) {
      return res.status(400).json({ success: false, message: 'rideId, revieweeId, and rating are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }
    if (revieweeId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot review yourself' });
    }

    // Verify ride exists and is completed
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
    if (ride.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Can only review completed rides' });
    }

    const review = await Review.create({
      reviewer: req.user._id,
      reviewee: revieweeId,
      ride: rideId,
      rating,
      comment: comment || '',
    });

    // Update reviewee's average rating
    const stats = await Review.aggregate([
      { $match: { reviewee: review.reviewee } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (stats.length > 0) {
      await User.findByIdAndUpdate(revieweeId, {
        rating: parseFloat(stats[0].avg.toFixed(1)),
      });
    }

    return res.status(201).json({ success: true, review });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this ride' });
    }
    next(err);
  }
};

// GET /api/reviews/user/:userId
exports.getUserReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate('reviewer', 'name avatar')
      .populate('ride', 'pickup destination departureTime')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const stats = await Review.aggregate([
      { $match: { reviewee: require('mongoose').Types.ObjectId.createFromHexString(req.params.userId) } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    return res.json({
      success: true,
      reviews,
      stats: stats[0] ? { average: parseFloat(stats[0].avg.toFixed(1)), count: stats[0].count } : { average: 0, count: 0 },
    });
  } catch (err) {
    next(err);
  }
};
