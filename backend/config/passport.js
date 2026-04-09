const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// All allowed SRM domains — primary is srmsp.edu.in
const ALLOWED_DOMAINS = (process.env.ALLOWED_EMAIL_DOMAINS || 'srmsp.edu.in,srmap.edu.in,srmist.edu.in')
  .split(',')
  .map((d) => d.trim().toLowerCase());

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
          console.log(`[OAuth] Blocked non-SRM email: ${email}`);
          return done(null, false, {
            message: 'Access restricted to SRM students only (@srmsp.edu.in)',
          });
        }

        let user = await User.findOne({ email });

        if (user) {
          if (!user.googleId) {
            user.googleId = profile.id;
            user.isEmailVerified = true;
            if (!user.avatar && profile.photos?.[0]?.value) {
              user.avatar = profile.photos[0].value;
            }
            await user.save();
          }
          console.log(`[OAuth] Existing user logged in: ${email}`);
          return done(null, user);
        }

        user = await User.create({
          googleId: profile.id,
          email,
          name: profile.displayName || email.split('@')[0],
          avatar: profile.photos?.[0]?.value || null,
          isEmailVerified: true,
          authProvider: 'google',
        });

        console.log(`[OAuth] New user created: ${email}`);
        return done(null, user);
      } catch (err) {
        console.error('[OAuth] Strategy error:', err);
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
