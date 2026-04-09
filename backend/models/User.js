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
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      match: [/^\+?[1-9]\d{9,14}$/, 'Invalid phone number'],
    },
    googleId: { type: String, unique: true, sparse: true },
    avatar: { type: String, default: null },

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
    vehicleType: {
      type: String,
      enum: ['bike', 'car', 'auto', 'bus', null],
      default: null,
    },
    isDriver: { type: Boolean, default: false },

    // Status
    isActive: { type: Boolean, default: true },
    lastSeen: { type: Date, default: Date.now },
    notificationsEnabled: { type: Boolean, default: true },

    // Push notification socket
    socketId: { type: String, default: null },
  },
  { timestamps: true }
);

// Virtual for display name
userSchema.virtual('initials').get(function () {
  return this.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
});

// Check if profile is complete
userSchema.methods.checkProfileComplete = function () {
  const required = ['name', 'email', 'registrationNumber', 'department', 'year'];
  this.isProfileComplete = required.every((field) => !!this[field]);
  return this.isProfileComplete;
};

module.exports = mongoose.model('User', userSchema);
