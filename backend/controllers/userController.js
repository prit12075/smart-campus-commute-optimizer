const User = require('../models/User');
const Ride = require('../models/Ride');
const { deleteImage, isConfigured } = require('../utils/cloudinary');
const { haversineDistance } = require('../utils/matcher');

// PUT /api/users/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = [
      'name', 'registrationNumber', 'department', 'year', 'section',
      'phone', 'homeLocation', 'preferredPickupTime', 'vehicleType',
      'isDriver', 'notificationsEnabled', 'showPhoneNumber',
    ];

    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        // FIX: convert empty string vehicleType to undefined so Mongoose doesn't
        // run enum validation against "" which is not in ['bike','car','auto','bus']
        if (field === 'vehicleType' && req.body[field] === '') {
          updates[field] = undefined;
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    if (updates.registrationNumber) {
      updates.registrationNumber = updates.registrationNumber.toUpperCase().trim();
    }

    // Use $set so that setting vehicleType to undefined unsets it in MongoDB
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    user.checkProfileComplete();
    await user.save({ validateBeforeSave: false });

    return res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// POST /api/users/avatar
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!isConfigured()) {
      return res.status(501).json({
        success: false,
        message: 'Photo upload not configured. Add Cloudinary env variables.',
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const user = await User.findById(req.user._id);

    // Delete old avatar from Cloudinary if exists
    if (user.avatarPublicId) {
      await deleteImage(user.avatarPublicId);
    }

    user.avatar = req.file.path;
    user.avatarPublicId = req.file.filename;
    await user.save({ validateBeforeSave: false });

    return res.json({ success: true, avatar: user.avatar, message: 'Photo updated!' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/avatar
exports.removeAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.avatarPublicId) await deleteImage(user.avatarPublicId);
    user.avatar = null;
    user.avatarPublicId = null;
    await user.save({ validateBeforeSave: false });
    return res.json({ success: true, message: 'Photo removed' });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/profile
exports.getProfile = async (req, res) => {
  return res.json({ success: true, user: req.user });
};

// GET /api/users/dashboard
exports.getDashboardData = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Use user homeLocation or fallback to SRM AP Campus default coordinates
    const userLat = req.user.homeLocation?.lat || 16.4420;
    const userLng = req.user.homeLocation?.lng || 80.6220;

    const baseOfferQuery = {
      type: 'offer',
      status: 'active',
      creator: { $ne: userId },
      availableSeats: { $gte: 1 },
      departureTime: { $gte: new Date() },
    };

    const [myRides, totalRides, ridesAsPassenger] = await Promise.all([
      Ride.find({ creator: userId, status: { $in: ['active', 'in_progress'] } })
        .sort({ departureTime: 1 }).limit(5).lean(),
      Ride.countDocuments({ creator: userId }),
      Ride.find({
        'passengers.user': userId,
        'passengers.status': 'accepted',
        status: { $in: ['active', 'in_progress'] },
      })
        .populate('creator', 'name avatar registrationNumber')
        .sort({ departureTime: 1 }).limit(3).lean(),
    ]);

    // Try geo query; fall back to plain sort if 2dsphere index not ready
    let nearbyOffers = null;
    try {
      nearbyOffers = await Ride.find({
        ...baseOfferQuery,
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [userLng, userLat] },
            $maxDistance: 50000,
          },
        },
      }).populate('creator', 'name avatar registrationNumber department').limit(6).lean();
    } catch (_) { nearbyOffers = null; }

    if (!nearbyOffers) {
      nearbyOffers = await Ride.find(baseOfferQuery)
        .sort({ departureTime: 1 })
        .populate('creator', 'name avatar registrationNumber department')
        .limit(6).lean();
    }

    return res.json({
      success: true,
      data: {
        myRides,
        ridesAsPassenger,
        nearbyOffers,
        stats: { totalRides, activeRides: myRides.length },
      },
    });
  } catch (err) {
    next(err);
  }
};
