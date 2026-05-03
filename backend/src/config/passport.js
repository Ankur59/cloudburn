import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { config } from './config.js';
import User from '../models/user.model.js';
import Organization from '../models/organization.model.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      // In production, you might want to use a full URL like `https://api.cloudburn.online/api/auth/google/callback`
      callbackURL: config.NODE_ENV === 'production' 
        ? 'https://api.cloudburn.online/api/auth/google/callback'
        : 'http://localhost:5000/api/auth/google/callback',
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName || (profile.name && profile.name.givenName) || email.split('@')[0];

        // 1. Check if user exists by googleId
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          return done(null, user);
        }

        // 2. Check if user exists by email (linked account)
        user = await User.findOne({ email });
        if (user) {
          user.googleId = profile.id;
          user.isEmailVerified = true; // Google verifies emails
          if (user.authProvider !== 'google') {
            // Keep existing provider info if needed or just update to 'google' or something
            // We can leave authProvider as 'local' or change it
          }
          await user.save();
          return done(null, user);
        }

        // 3. User doesn't exist, create new user and organization
        const orgName = `${name}'s Organization`;
        const org = await Organization.create({ name: orgName, email });

        user = await User.create({
          orgId: org._id,
          name: name,
          email: email,
          role: 'Admin',
          authProvider: 'google',
          googleId: profile.id,
          inviteAccepted: true,
          isEmailVerified: true, // Trusted from Google
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export default passport;
