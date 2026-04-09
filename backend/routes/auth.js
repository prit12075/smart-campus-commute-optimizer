const express = require('express');
const router = express.Router();
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,
  message: { success: false, message: 'Too many OTP requests, please try again later' },
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
  otpLimiter,
  [body('email').isEmail().normalizeEmail()],
  validate,
  authController.sendOTP
);

router.post(
  '/verify-otp',
  otpLimiter,
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
