const Ride = require('../models/Ride');
const Notification = require('../models/Notification');
const { findMatches } = require('../utils/matcher');

const notify = async (recipientId, type, title, message, data = {}, io = null) => {
  try {
    const notif = await Notification.create({ recipient: recipientId, type, title, message, data });
    if (io) io.to(`user:${recipientId}`).emit('notification', notif);
    return notif;
  } catch (e) {
    console.error('[Notify] Failed:', e.message);
  }
};

// Helper: strip empty string from vehicleType before saving
const sanitizeRideBody = (body) => {
  const out = { ...body };
  if (out.vehicleType === '' || out.vehicleType === null) delete out.vehicleType;
  if (out.vehicleNumber === '') delete out.vehicleNumber;
  if (out.notes === '') delete out.notes;
  return out;
};

// POST /api/rides
exports.createRide = async (req, res, next) => {
  try {
    const body = sanitizeRideBody(req.body);
    const { type, pickup, destination, departureTime, totalSeats, vehicleType, vehicleNumber, notes, isRecurring, recurringDays } = body;

    if (!type || !pickup || !destination || !departureTime) {
      return res.status(400).json({ success: false, message: 'type, pickup, destination, and departureTime are required' });
    }

    const ride = await Ride.create({
      creator: req.user._id,
      type,
      pickup,
      destination,
      departureTime,
      totalSeats: totalSeats || 1,
      availableSeats: totalSeats || 1,
      ...(vehicleType && { vehicleType }),
      ...(vehicleNumber && { vehicleNumber }),
      ...(notes && { notes }),
      isRecurring: isRecurring || false,
      recurringDays: recurringDays || [],
    });

    await ride.populate('creator', 'name avatar registrationNumber department');
    return res.status(201).json({ success: true, ride });
  } catch (err) {
    next(err);
  }
};

// GET /api/rides
exports.getRides = async (req, res, next) => {
  try {
    const { type, status = 'active', page = 1, limit = 20 } = req.query;
    const query = { departureTime: { $gte: new Date() } };
    if (type) query.type = type;
    if (status) query.status = status;

    const [rides, total] = await Promise.all([
      Ride.find(query)
        .populate('creator', 'name avatar registrationNumber department year')
        .sort({ departureTime: 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean(),
      Ride.countDocuments(query),
    ]);

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

// GET /api/rides/:id/matches
exports.getMatches = async (req, res, next) => {
  try {
    const rideRequest = await Ride.findById(req.params.id);
    if (!rideRequest) return res.status(404).json({ success: false, message: 'Ride not found' });
    if (rideRequest.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

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

// POST /api/rides/:id/join
exports.joinRide = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
    if (ride.status !== 'active') return res.status(400).json({ success: false, message: 'Ride is no longer active' });
    if (ride.availableSeats < 1) return res.status(400).json({ success: false, message: 'No seats available' });
    if (ride.creator.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot join your own ride' });
    }

    const alreadyJoined = ride.passengers.some((p) => p.user.toString() === req.user._id.toString());
    if (alreadyJoined) return res.status(400).json({ success: false, message: 'Already requested to join this ride' });

    ride.passengers.push({ user: req.user._id, status: 'pending' });
    await ride.save();

    const io = req.app.get('io');
    await notify(ride.creator, 'ride_request', 'New Ride Request',
      `${req.user.name} wants to join your ride`, { rideId: ride._id }, io);

    return res.json({ success: true, message: 'Join request sent!' });
  } catch (err) {
    next(err);
  }
};

// PUT /api/rides/:id/passengers/:userId
exports.respondToPassenger = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be accepted or rejected' });
    }

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
    const isAccepted = status === 'accepted';
    await notify(
      req.params.userId,
      isAccepted ? 'ride_accepted' : 'ride_rejected',
      isAccepted ? '🎉 Ride Accepted!' : 'Ride Request Update',
      isAccepted
        ? `${req.user.name} accepted your ride request!`
        : `${req.user.name} couldn't accommodate your request.`,
      { rideId: ride._id },
      io
    );

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

    const io = req.app.get('io');
    const accepted = ride.passengers.filter((p) => p.status === 'accepted');
    await Promise.all(
      accepted.map((p) =>
        notify(p.user, 'ride_cancelled', 'Ride Cancelled',
          'A ride you joined has been cancelled by the organizer.', { rideId: ride._id }, io)
      )
    );

    return res.json({ success: true, message: 'Ride cancelled' });
  } catch (err) {
    next(err);
  }
};
