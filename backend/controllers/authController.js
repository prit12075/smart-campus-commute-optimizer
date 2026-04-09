const User = require('../models/User');
const OTP = require('../models/OTP');
const { signToken } = require('../middleware/auth');
const { sendOTPEmail, sendWelcomeEmail } = require('../utils/emailService');

const ALLOWED_DOMAINS = (process.env.ALLOWED_EMAIL_DOMAINS || 'srmsp.edu.in,srmap.edu.in,srmist.edu.in')
  .split(',')
  .map((d) => d.trim().toLowerCase());

const isAllowedEmail = (email) => {
  const domain = email?.split('@')[1]?.toLowerCase();
  return ALLOWED_DOMAINS.includes(domain);
};

const sendAuthResponse = (res, user, statusCode = 200) => {
  const token = signToken(user._id);
  return res.status(statusCode).json({
    success: true,
    token,
    user: sanitizeUser(user),
  });
};

const sanitizeUser = (user) => ({
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
});

// POST /api/auth/send-otp
exports.sendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const normalizedEmail = email.toLowerCase().trim();

    if (!isAllowedEmail(normalizedEmail)) {
      return res.status(403).json({
        success: false,
        message: `Only SRM students can access this platform. Use your @srmsp.edu.in email address.`,
      });
    }

    console.log(`[OTP] Generating new OTP for ${normalizedEmail}...`);
    const otpRecord = await OTP.createOTP(normalizedEmail, 'email');

    // Attempt to send email — log failures explicitly
    try {
      await sendOTPEmail(normalizedEmail, otpRecord.otp);
      console.log(`[OTP] Successfully delivered OTP to ${normalizedEmail}`);
    } catch (emailErr) {
      console.error(`[OTP] Email send FAILED for ${normalizedEmail}:`, emailErr.message);
      console.error('[OTP] Full error:', emailErr);
      // In dev, return OTP in response so you can still test
      if (process.env.NODE_ENV !== 'production') {
        return res.json({
          success: true,
          message: `Email delivery failed (check SMTP config). DEV OTP: ${otpRecord.otp}`,
          devOtp: otpRecord.otp,
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please check your email address and try again.',
      });
    }

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

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`[OTP] Verification attempt for ${normalizedEmail}...`);
    
    const result = await OTP.verifyOTP(normalizedEmail, 'email', String(otp).trim());

    if (!result.valid) {
      console.error(`[OTP] Verification failed for ${normalizedEmail}: ${result.reason}`);
      return res.status(400).json({ success: false, message: result.reason });
    }

    console.log(`[OTP] Verification successful for ${normalizedEmail}. Establishing session...`);

    let user = await User.findOne({ email: normalizedEmail });
    const isNewUser = !user;

    if (!user) {
      // Auto-extract name from email prefix
      const emailPrefix = normalizedEmail.split('@')[0];
      const autoName = emailPrefix
        .replace(/[._\-]/g, ' ')
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      user = await User.create({
        email: normalizedEmail,
        name: autoName,
        isEmailVerified: true,
        authProvider: 'otp',
      });
      sendWelcomeEmail(normalizedEmail, autoName).catch((e) =>
        console.error('[Welcome email] Failed:', e.message)
      );
    } else {
      user.isEmailVerified = true;
      await user.save({ validateBeforeSave: false });
    }

    return sendAuthResponse(res, user, isNewUser ? 201 : 200);
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/google/callback
exports.googleCallback = async (req, res) => {
  try {
    const token = signToken(req.user._id);
    const isNew = !req.user.isProfileComplete;
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    console.log(`[OAuth] Callback success, redirecting to frontend. New user: ${isNew}`);
    res.redirect(`${frontendURL}/auth/callback?token=${token}&new=${isNew}`);
  } catch (err) {
    console.error('[OAuth] Callback error:', err);
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendURL}/login?error=auth_failed`);
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  return res.json({ success: true, user: sanitizeUser(req.user) });
};

// POST /api/auth/logout
exports.logout = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};
