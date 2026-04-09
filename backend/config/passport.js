const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

const ALLOWED_DOMAINS = (process.env.ALLOWED_EMAIL_DOMAINS || 'srmist.edu.in,srmap.edu.in')
  .split(',')
  .map(d => d.trim().toLowerCase());

const isAllowedEmail = (email) => {
  if (!email) return false;
  const domain = email.split('@')[1]?.toLowerCase();
  return ALLOWED_DOMAINS.includes(domain);
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email || !isAllowedEmail(email)) {
          return done(null, false, {
            message: 'Access restricted to SRM AP University students only. Use your @srmist.edu.in email.',
          });
        }

        let user = await User.findOne({ email });

        if (user) {
          // Update Google ID if not set
          if (!user.googleId) {
            user.googleId = profile.id;
            user.isEmailVerified = true;
            await user.save();
          }
          return done(null, user);
        }

        // Create new user from Google profile
        user = await User.create({
          googleId: profile.id,
          email,
          name: profile.displayName,
          avatar: profile.photos?.[0]?.value,
          isEmailVerified: true,
          authProvider: 'google',
        });

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
