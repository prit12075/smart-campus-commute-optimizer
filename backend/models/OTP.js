const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const otpSchema = new mongoose.Schema({
  identifier: { type: String, required: true }, // email or phone
  identifierType: { type: String, enum: ['email', 'phone'], required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  isUsed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // TTL 10 min
});

otpSchema.index({ identifier: 1, identifierType: 1 });

otpSchema.pre('save', async function (next) {
  if (this.isModified('otp')) {
    const salt = await bcrypt.genSalt(10);
    this.otp = await bcrypt.hash(this.otp, salt);
  }
  next();
});

otpSchema.statics.generateOTP = function () {
  return crypto.randomInt(100000, 999999).toString();
};

otpSchema.statics.createOTP = async function (identifier, identifierType) {
  // Remove previous OTPs for this identifier
  await this.deleteMany({ identifier, identifierType });

  const otp = this.generateOTP();
  const expiresAt = new Date(
    Date.now() + (parseInt(process.env.OTP_EXPIRES_MINUTES) || 10) * 60 * 1000
  );

  await this.create({ identifier, identifierType, otp, expiresAt });
  return { otp }; // Return plain string object so email service can use it
};

otpSchema.statics.verifyOTP = async function (identifier, identifierType, code) {
  const record = await this.findOne({
    identifier,
    identifierType,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  });

  if (!record) return { valid: false, reason: 'OTP expired or not found' };
  if (record.attempts >= 5) return { valid: false, reason: 'Too many verification attempts' };

  record.attempts += 1;

  const isMatch = await bcrypt.compare(code, record.otp);
  if (!isMatch) {
    await record.save();
    return { valid: false, reason: 'Invalid OTP' };
  }

  record.isUsed = true;
  await record.save();
  return { valid: true };
};

module.exports = mongoose.model('OTP', otpSchema);
