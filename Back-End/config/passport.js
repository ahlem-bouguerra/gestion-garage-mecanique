import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/User.js";

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID, // depuis .env
  clientSecret: process.env.GOOGLE_CLIENT_SECRET, // depuis .env
  callbackURL: "/api/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });

    if (!user) {
      user = await User.create({
        username: profile.displayName.replace(/\s+/g, '').toLowerCase(),
        email: profile.emails[0].value,
        googleId: profile.id,
        phone: "",
        isVerified: true,
        city: "",
        location: {
          type: "Point",
          coordinates: [0, 0] // placeholder valide pour éviter l'erreur
        }

      });
    }
    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

export default passport;
