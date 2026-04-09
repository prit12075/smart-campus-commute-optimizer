const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  address: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
}, { _id: false });

const rideSchema = new mongoose.Schema(
  {
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['offer', 'request'], required: true },
    pickup: { type: locationSchema, required: true },
    destination: { type: locationSchema, required: true },
    waypoints: [locationSchema],
    departureTime: { type: Date, required: true },
    isRecurring: { type: Boolean, default: false },
    recurringDays: [{ type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }],
    totalSeats: { type: Number, default: 1, min: 1, max: 6 },
    availableSeats: { type: Number, default: 1, min: 0 },
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
    matchedRide: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', default: null },
    status: {
      type: String,
      enum: ['active', 'full', 'in_progress', 'completed', 'cancelled'],
      default: 'active',
    },
    // FIX: same enum fix — no empty string allowed
    vehicleType: {
      type: String,
      enum: {
        values: ['bike', 'car', 'auto', 'bus'],
        message: '"{VALUE}" is not a valid vehicle type',
      },
      default: undefined,
    },
    vehicleNumber: { type: String, trim: true, uppercase: true },
    notes: { type: String, maxlength: 300, trim: true },
    matchScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

rideSchema.index({ 'pickup.lat': 1, 'pickup.lng': 1 });
rideSchema.index({ departureTime: 1, status: 1 });
rideSchema.index({ creator: 1 });

module.exports = mongoose.model('Ride', rideSchema);
