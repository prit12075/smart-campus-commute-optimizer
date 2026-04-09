const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  address: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
}, { _id: false });

const rideSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['offer', 'request'],
      required: true,
    },

    // Route
    pickup: { type: locationSchema, required: true },
    destination: { type: locationSchema, required: true },
    waypoints: [locationSchema],

    // Schedule
    departureTime: { type: Date, required: true },
    isRecurring: { type: Boolean, default: false },
    recurringDays: [{ type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }],

    // Capacity
    totalSeats: { type: Number, default: 1, min: 1, max: 6 },
    availableSeats: { type: Number, default: 1, min: 0 },

    // Passengers
    passengers: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: {
          type: String,
          enum: ['pending', 'accepted', 'rejected', 'cancelled'],
          default: 'pending',
        },
        joinedAt: { type: Date, default: Date.now },
      },
    ],

    // Match
    matchedRide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      default: null,
    },

    // Status
    status: {
      type: String,
      enum: ['active', 'full', 'in_progress', 'completed', 'cancelled'],
      default: 'active',
    },

    // Vehicle info (for offers)
    vehicleType: {
      type: String,
      enum: ['bike', 'car', 'auto', 'bus', null],
      default: null,
    },
    vehicleNumber: { type: String, trim: true, uppercase: true },

    // Notes
    notes: { type: String, maxlength: 300, trim: true },

    // Matching score (set by algorithm)
    matchScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Index for geospatial + time queries
rideSchema.index({ 'pickup.lat': 1, 'pickup.lng': 1 });
rideSchema.index({ departureTime: 1, status: 1 });
rideSchema.index({ creator: 1 });

module.exports = mongoose.model('Ride', rideSchema);
