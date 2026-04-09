const User = require('../models/User');
const OTP = require('../models/OTP');
const { signToken } = require('../middleware/auth');
const { sendOTPEmail, sendWelcomeEmail } = require('../utils/emailService');

const ALLOWED_DOMAINS = (process.env.ALLOWED_EMAIL_DOMAINS || 'srmist.edu.in,srmap.edu.in')
  .split(',')
  .map((d) => d.trim().toLowerCase());

const isAllowedEmail = (email) => {
  const domain = email?.split('@')[1]?.toLowerCase();
  return ALLOWED_DOMAINS.includes(domain);
};

const sendAuthResponse = (res, user, statusCode = 200) => {
  const token = signToken(user._id);
  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    role: user.role,
    registrationNumber: user.registrationNumber,
    department: user.department,
    year: user.year,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
    isProfileComplete: user.isProfileComplete,
    authProvider: user.authProvider,
  };
  return res.status(statusCode).json({ success: true, token, user: userData });
};

// POST /api/auth/send-otp
exports.sendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    if (!isAllowedEmail(email)) {
      return res.status(403).json({
        success: false,
        message: 'Access restricted to SRM AP students. Use your @srmist.edu.in email.',
      });
    }

    const otpRecord = await OTP.createOTP(email.toLowerCase(), 'email');
    await sendOTPEmail(email, otpRecord.otp);

    return res.json({ success: true, message: 'OTP sent to your email' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/verify-otp
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const result = await OTP.verifyOTP(email.toLowerCase(), 'email', otp);
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.reason });
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    const isNewUser = !user;

    if (!user) {
      user = await User.create({
        email: email.toLowerCase(),
        name: email.split('@')[0], // temp name from email prefix
        isEmailVerified: true,
        authProvider: 'otp',
      });
      // Send welcome email async (don't block)
      sendWelcomeEmail(email, user.name).catch(() => {});
    } else {
      user.isEmailVerified = true;
      await user.save({ validateBeforeSave: false });
    }

    return sendAuthResponse(res, user, isNewUser ? 201 : 200);
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/google/callback (handled by passport, then redirects here)
exports.googleCallback = async (req, res) => {
  try {
    const token = signToken(req.user._id);
    const isNew = !req.user.isProfileComplete;

    // Redirect to frontend with token
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendURL}/auth/callback?token=${token}&new=${isNew}`);
  } catch (err) {
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendURL}/login?error=auth_failed`);
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  const user = req.user;
  return res.json({
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      registrationNumber: user.registrationNumber,
      department: user.department,
      year: user.year,
      section: user.section,
      homeLocation: user.homeLocation,
      preferredPickupTime: user.preferredPickupTime,
      vehicleType: user.vehicleType,
      isDriver: user.isDriver,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      isProfileComplete: user.isProfileComplete,
      notificationsEnabled: user.notificationsEnabled,
      authProvider: user.authProvider,
      createdAt: user.createdAt,
    },
  });
};

// POST /api/auth/logout
exports.logout = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};
