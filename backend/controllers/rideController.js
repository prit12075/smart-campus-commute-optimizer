const Ride = require('../models/Ride');
const Notification = require('../models/Notification');
const { findMatches } = require('../utils/matcher');

const notifyUser = async (recipientId, type, title, message, data = {}, io = null) => {
  const notif = await Notification.create({ recipient: recipientId, type, title, message, data });
  if (io) {
    // Emit to recipient's socket room
    io.to(`user:${recipientId}`).emit('notification', notif);
  }
  return notif;
};

// POST /api/rides
exports.createRide = async (req, res, next) => {
  try {
    const { type, pickup, destination, departureTime, totalSeats, vehicleType, vehicleNumber, notes, isRecurring, recurringDays } = req.body;

    const ride = await Ride.create({
      creator: req.user._id,
      type,
      pickup,
      destination,
      departureTime,
      totalSeats: totalSeats || 1,
      availableSeats: totalSeats || 1,
      vehicleType: vehicleType || req.user.vehicleType,
      vehicleNumber,
      notes,
      isRecurring: isRecurring || false,
      recurringDays: recurringDays || [],
    });

    await ride.populate('creator', 'name avatar registrationNumber department');

    return res.status(201).json({ success: true, ride });
  } catch (err) {
    next(err);
  }
};

// GET /api/rides — list rides with filters
exports.getRides = async (req, res, next) => {
  try {
    const {
      type, status = 'active', page = 1, limit = 20,
      lat, lng, radius = 5, // radius in km
    } = req.query;

    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    query.departureTime = { $gte: new Date() };

    const rides = await Ride.find(query)
      .populate('creator', 'name avatar registrationNumber department year')
      .sort({ departureTime: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Ride.countDocuments(query);

    return res.json({ success: true, rides, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// GET /api/rides/my
exports.getMyRides = async (req, res, next) => {
  try {
    const rides = await Ride.find({ creator: req.user._id })
      .sort({ createdAt: -1 })
      .populate('passengers.user', 'name avatar registrationNumber')
      .lean();

    return res.json({ success: true, rides });
  } catch (err) {
    next(err);
  }
};

// GET /api/rides/:id
exports.getRide = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('creator', 'name avatar registrationNumber department phone')
      .populate('passengers.user', 'name avatar registrationNumber');

    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });

    return res.json({ success: true, ride });
  } catch (err) {
    next(err);
  }
};

// GET /api/rides/:id/matches — find matching rides using DSA algorithm
exports.getMatches = async (req, res, next) => {
  try {
    const rideRequest = await Ride.findById(req.params.id);
    if (!rideRequest) return res.status(404).json({ success: false, message: 'Ride not found' });

    if (rideRequest.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get opposite type rides
    const oppositeType = rideRequest.type === 'request' ? 'offer' : 'request';
    const candidates = await Ride.find({
      type: oppositeType,
      status: 'active',
      creator: { $ne: req.user._id },
      departureTime: {
        $gte: new Date(new Date(rideRequest.departureTime).getTime() - 60 * 60 * 1000),
        $lte: new Date(new Date(rideRequest.departureTime).getTime() + 60 * 60 * 1000),
      },
    }).populate('creator', 'name avatar registrationNumber department');

    const matches = findMatches(rideRequest, candidates, 10);

    return res.json({ success: true, matches });
  } catch (err) {
    next(err);
  }
};

// POST /api/rides/:id/join — request to join a ride
exports.joinRide = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
    if (ride.status !== 'active') return res.status(400).json({ success: false, message: 'Ride is no longer active' });
    if (ride.availableSeats < 1) return res.status(400).json({ success: false, message: 'No seats available' });
    if (ride.creator.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot join your own ride' });
    }

    const alreadyJoined = ride.passengers.some(
      (p) => p.user.toString() === req.user._id.toString()
    );
    if (alreadyJoined) return res.status(400).json({ success: false, message: 'Already joined this ride' });

    ride.passengers.push({ user: req.user._id, status: 'pending' });
    await ride.save();

    // Notify ride creator
    const io = req.app.get('io');
    await notifyUser(
      ride.creator,
      'ride_request',
      'New Ride Request',
      `${req.user.name} wants to join your ride`,
      { rideId: ride._id, userId: req.user._id },
      io
    );

    return res.json({ success: true, message: 'Join request sent' });
  } catch (err) {
    next(err);
  }
};

// PUT /api/rides/:id/passengers/:userId — accept/reject a passenger
exports.respondToPassenger = async (req, res, next) => {
  try {
    const { status } = req.body; // 'accepted' or 'rejected'
    const ride = await Ride.findById(req.params.id);

    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
    if (ride.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const passenger = ride.passengers.find((p) => p.user.toString() === req.params.userId);
    if (!passenger) return res.status(404).json({ success: false, message: 'Passenger not found' });

    passenger.status = status;

    if (status === 'accepted') {
      ride.availableSeats = Math.max(0, ride.availableSeats - 1);
      if (ride.availableSeats === 0) ride.status = 'full';
    }

    await ride.save();

    const io = req.app.get('io');
    const notifType = status === 'accepted' ? 'ride_accepted' : 'ride_rejected';
    const notifMsg = status === 'accepted'
      ? `Your request to join ${req.user.name}'s ride has been accepted!`
      : `Your request to join ${req.user.name}'s ride was not accepted.`;

    await notifyUser(req.params.userId, notifType, `Ride ${status}`, notifMsg, { rideId: ride._id }, io);

    return res.json({ success: true, ride });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/rides/:id
exports.cancelRide = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
    if (ride.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    ride.status = 'cancelled';
    await ride.save();

    // Notify accepted passengers
    const io = req.app.get('io');
    const acceptedPassengers = ride.passengers.filter((p) => p.status === 'accepted');
    await Promise.all(
      acceptedPassengers.map((p) =>
        notifyUser(p.user, 'ride_cancelled', 'Ride Cancelled', 'A ride you joined has been cancelled', { rideId: ride._id }, io)
      )
    );

    return res.json({ success: true, message: 'Ride cancelled' });
  } catch (err) {
    next(err);
  }
};
