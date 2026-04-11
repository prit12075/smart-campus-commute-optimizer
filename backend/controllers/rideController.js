const Ride = require('../models/Ride');
const Notification = require('../models/Notification');
const { findMatches, estimateFare } = require('../utils/matcher');

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

    // Auto-calculate fare
    if (pickup?.lat && pickup?.lng && destination?.lat && destination?.lng) {
      const fareData = estimateFare(pickup.lat, pickup.lng, destination.lat, destination.lng, vehicleType || 'auto', totalSeats || 1);
      ride.distanceKm = fareData.distanceKm;
      ride.estimatedFare = fareData.estimatedFare;
      ride.farePerPerson = fareData.farePerPerson;
      await ride.save();
    }

    await ride.populate('creator', 'name avatar registrationNumber department');
    return res.status(201).json({ success: true, ride });
  } catch (err) {
    next(err);
  }
};

// GET /api/rides
exports.getRides = async (req, res, next) => {
  try {
    const { type, status = 'active', page = 1, limit = 20, lat, lng, all } = req.query;

    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const pageNum  = Math.max(parseInt(page)  || 1, 1);

    // Base query: only future rides with the requested status
    const baseQuery = {};
    if (status) baseQuery.status = status;
    if (type)   baseQuery.type   = type;
    // Only show future rides unless caller explicitly wants all
    if (!all) baseQuery.departureTime = { $gte: new Date() };

    let rides, total;

    // Try geo-aware query first; fall back to plain query if index missing / no coords
    const hasCoords = lat && lng;
    if (hasCoords) {
      const geoQuery = {
        ...baseQuery,
        'pickup.lat': { $exists: true }, // only docs with coordinates
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: 75000, // 75 km
          },
        },
      };
      try {
        [rides, total] = await Promise.all([
          Ride.find(geoQuery)
            .populate('creator', 'name avatar registrationNumber department year rating')
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .lean(),
          Ride.countDocuments(geoQuery),
        ]);
      } catch (_geoErr) {
        // Index not ready — fall through to plain query
        rides = null;
      }
    }

    // Plain fallback (or primary when no coords supplied)
    if (!rides) {
      [rides, total] = await Promise.all([
        Ride.find(baseQuery)
          .sort({ departureTime: 1 })
          .populate('creator', 'name avatar registrationNumber department year rating')
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum)
          .lean(),
        Ride.countDocuments(baseQuery),
      ]);
    }

    return res.json({ success: true, rides, total, page: pageNum, pages: Math.ceil((total || 0) / limitNum) });
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

// PUT /api/rides/:id/status  —  lifecycle transitions
exports.updateRideStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const VALID_TRANSITIONS = {
      active: ['in_progress', 'cancelled'],
      full: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
    };

    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
    if (ride.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the ride creator can update status' });
    }

    const allowed = VALID_TRANSITIONS[ride.status];
    if (!allowed || !allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Cannot transition from '${ride.status}' to '${status}'` });
    }

    ride.status = status;
    await ride.save();

    // Notify all accepted passengers
    const io = req.app.get('io');
    const accepted = ride.passengers.filter((p) => p.status === 'accepted');
    const statusMessages = {
      in_progress: { type: 'system', title: '🚗 Ride Started!', msg: 'Your ride is now in progress.' },
      completed: { type: 'system', title: '✅ Ride Completed!', msg: 'Your ride has been completed. Please rate your experience!' },
      cancelled: { type: 'ride_cancelled', title: 'Ride Cancelled', msg: 'A ride you joined has been cancelled.' },
    };
    const info = statusMessages[status];
    if (info) {
      await Promise.all(
        accepted.map((p) => notify(p.user, info.type, info.title, info.msg, { rideId: ride._id }, io))
      );
    }

    // Emit real-time status change
    if (io) io.to(`ride:${ride._id}`).emit('ride:status_change', { rideId: ride._id, status });

    return res.json({ success: true, ride });
  } catch (err) {
    next(err);
  }
};

// GET /api/rides/suggestions  — smart ride suggestions for the logged-in user
exports.getSuggestions = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Get user's recent completed rides to detect patterns
    const history = await Ride.find({
      creator: userId,
      status: 'completed',
    }).sort({ createdAt: -1 }).limit(10).lean();

    // 2. Find active offers whose pickup/dest overlaps with user's history
    const activeOffers = await Ride.find({
      type: 'offer',
      status: 'active',
      creator: { $ne: userId },
      departureTime: { $gte: new Date() },
    })
      .populate('creator', 'name avatar registrationNumber department year rating')
      .limit(50)
      .lean();

    // 3. Score suggestions — favor overlapping destination areas
    let suggestions = activeOffers;
    if (history.length > 0) {
      const recentDest = history[0].destination;
      suggestions = activeOffers
        .map((ride) => {
          const { haversineDistance } = require('../utils/matcher');
          const destDist = haversineDistance(
            recentDest.lat, recentDest.lng,
            ride.destination.lat, ride.destination.lng
          );
          return { ...ride, _suggestScore: Math.max(0, 10 - destDist) };
        })
        .sort((a, b) => b._suggestScore - a._suggestScore);
    }

    // 4. Peak hour prediction — find the most common hour user posts rides
    const hourCounts = {};
    history.forEach((r) => {
      const h = new Date(r.departureTime).getHours();
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    });
    const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    return res.json({
      success: true,
      suggestions: suggestions.slice(0, 5),
      peakHour: peakHour ? parseInt(peakHour) : null,
      historyCount: history.length,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/rides/sos  —  emergency alert
exports.triggerSOS = async (req, res, next) => {
  try {
    const { lat, lng, message } = req.body;
    const io = req.app.get('io');

    // Notify all admins
    const User = require('../models/User');
    const admins = await User.find({ role: 'admin' }).select('_id').lean();
    const alertMsg = message || `${req.user.name} triggered an SOS alert!`;

    await Promise.all(
      admins.map((admin) =>
        notify(admin._id, 'system', '🚨 SOS EMERGENCY', alertMsg, { userId: req.user._id, lat, lng }, io)
      )
    );

    // Also create a notification for the user as confirmation
    await notify(req.user._id, 'system', 'SOS Sent', 'Your emergency alert has been sent to campus security.', { lat, lng }, io);

    return res.json({ success: true, message: 'SOS alert sent to campus security' });
  } catch (err) {
    next(err);
  }
};
