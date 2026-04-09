const User = require('../models/User');
const Ride = require('../models/Ride');
const Notification = require('../models/Notification');

// GET /api/admin/stats
exports.getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalRides, activeRides, pendingVerifications] = await Promise.all([
      User.countDocuments(),
      Ride.countDocuments(),
      Ride.countDocuments({ status: 'active' }),
      User.countDocuments({ isProfileComplete: false }),
    ]);

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email registrationNumber department createdAt role');

    const ridesThisWeek = await Ride.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });

    return res.json({
      success: true,
      stats: {
        totalUsers,
        totalRides,
        activeRides,
        pendingVerifications,
        ridesThisWeek,
      },
      recentUsers,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users
exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await User.countDocuments(query);
    return res.json({ success: true, users, total });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/users/:id
exports.updateUser = async (req, res, next) => {
  try {
    const allowed = ['role', 'isActive', 'isEmailVerified'];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    return res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/broadcast
exports.broadcastNotification = async (req, res, next) => {
  try {
    const { title, message, type = 'system' } = req.body;

    const users = await User.find({ isActive: true }).select('_id');
    const notifications = users.map((u) => ({
      recipient: u._id,
      type,
      title,
      message,
    }));

    await Notification.insertMany(notifications);

    const io = req.app.get('io');
    if (io) {
      io.emit('notification', { type, title, message, broadcast: true });
    }

    return res.json({ success: true, message: `Broadcast sent to ${users.length} users` });
  } catch (err) {
    next(err);
  }
};
