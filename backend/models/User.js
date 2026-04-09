const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
    },
    googleId: { type: String, unique: true, sparse: true },
    avatar: { type: String, default: null },
    avatarPublicId: { type: String, default: null }, // Cloudinary public_id for deletion

    // Student details
    registrationNumber: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },
    department: { type: String, trim: true },
    year: { type: Number, min: 1, max: 5 },
    section: { type: String, trim: true },

    // Auth
    authProvider: {
      type: String,
      enum: ['google', 'otp', 'local'],
      default: 'otp',
    },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    isProfileComplete: { type: Boolean, default: false },

    // Role
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },

    // Ride preferences
    homeLocation: {
      address: String,
      lat: Number,
      lng: Number,
    },
    preferredPickupTime: String,

    // FIX: vehicleType must use undefined default (not null/empty string)
    // Mongoose enum validator rejects empty string ""
    vehicleType: {
      type: String,
      enum: {
        values: ['bike', 'car', 'auto', 'bus'],
        message: '"{VALUE}" is not a valid vehicle type. Use: bike, car, auto, or bus',
      },
      default: undefined,
    },
    isDriver: { type: Boolean, default: false },

    // Status
    isActive: { type: Boolean, default: true },
    lastSeen: { type: Date, default: Date.now },
    notificationsEnabled: { type: Boolean, default: true },
    socketId: { type: String, default: null },
  },
  { timestamps: true }
);

userSchema.methods.checkProfileComplete = function () {
  const required = ['name', 'email', 'registrationNumber', 'department', 'year'];
  this.isProfileComplete = required.every((field) => !!this[field]);
  return this.isProfileComplete;
};

module.exports = mongoose.model('User', userSchema);
