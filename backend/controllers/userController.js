const User = require('../models/User');
const Ride = require('../models/Ride');

// PUT /api/users/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = [
      'name', 'registrationNumber', 'department', 'year', 'section',
      'phone', 'homeLocation', 'preferredPickupTime', 'vehicleType',
      'isDriver', 'notificationsEnabled',
    ];

    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // Validate reg number format (SRM AP: AP21110010001 style)
    if (updates.registrationNumber) {
      updates.registrationNumber = updates.registrationNumber.toUpperCase().trim();
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    user.checkProfileComplete();
    await user.save({ validateBeforeSave: false });

    return res.json({ success: true, user });
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

    const [myRides, totalRides] = await Promise.all([
      Ride.find({ creator: userId, status: { $in: ['active', 'in_progress'] } })
        .sort({ departureTime: 1 })
        .limit(5)
        .lean(),
      Ride.countDocuments({ creator: userId }),
    ]);

    // Rides where user is a passenger
    const ridesAsPassenger = await Ride.find({
      'passengers.user': userId,
      'passengers.status': 'accepted',
      status: { $in: ['active', 'in_progress'] },
    })
      .populate('creator', 'name avatar registrationNumber')
      .sort({ departureTime: 1 })
      .limit(3)
      .lean();

    // Active offers from other users (for browse)
    const nearbyOffers = await Ride.find({
      type: 'offer',
      status: 'active',
      creator: { $ne: userId },
      availableSeats: { $gte: 1 },
      departureTime: { $gte: new Date() },
    })
      .populate('creator', 'name avatar registrationNumber department')
      .sort({ departureTime: 1 })
      .limit(5)
      .lean();

    return res.json({
      success: true,
      data: {
        myRides,
        ridesAsPassenger,
        nearbyOffers,
        stats: {
          totalRides,
          activeRides: myRides.length,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
