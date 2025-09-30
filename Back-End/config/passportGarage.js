import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/User.js";

// Créer une instance séparée pour les garages
const passportGarage = new passport.Passport();

passportGarage.serializeUser((user, done) => {
  done(null, user.id);
});

passportGarage.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passportGarage.use('google-garage', new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/api/google/callback" // Callback pour port 3000
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
        governorateId: null,
        matriculefiscal: "",
        garagenom: "",
        location: {
          type: "Point",
          coordinates: [0, 0]
        }
      });
    }
    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

export default passportGarage;