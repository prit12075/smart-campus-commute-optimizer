const express = require('express');
const router = express.Router();
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const sendOtpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min cooldown
  max: 1,
  keyGenerator: (req) => `${req.ip}_${req.body.email || ''}`,
  message: { success: false, message: 'Please wait 60 seconds before requesting another OTP' },
});

const verifyOtpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 min
  max: 5,
  keyGenerator: (req) => `${req.ip}_${req.body.email || ''}`,
  message: { success: false, message: 'Too many verification attempts, please try again later' },
});

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// Email OTP
router.post(
  '/send-otp',
  sendOtpLimiter,
  [body('email').isEmail().normalizeEmail()],
  validate,
  authController.sendOTP
);

router.post(
  '/verify-otp',
  verifyOtpLimiter,
  [body('email').isEmail().normalizeEmail(), body('otp').isLength({ min: 6, max: 6 }).isNumeric()],
  validate,
  authController.verifyOTP
);

// Google OAuth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_restricted`,
  }),
  authController.googleCallback
);

// Protected routes
router.get('/me', protect, authController.getMe);
router.post('/logout', protect, authController.logout);

module.exports = router;
