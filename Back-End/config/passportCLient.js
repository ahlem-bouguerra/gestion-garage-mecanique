import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Client } from "../models/Client.js";

passport.serializeUser((client, done) => {
  done(null, client.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const client = await Client.findById(id);
    done(null, client);
  } catch (err) {
    done(err, null);
  }
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID, // depuis .env
  clientSecret: process.env.GOOGLE_CLIENT_SECRET, // depuis .env
  callbackURL: "/api/google/callback/client"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let client = await Client.findOne({ googleId: profile.id });

    if (!client) {
      client = await Client.create({
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
    return done(null, client);
  } catch (err) {
    return done(err, null);
  }
}));

export default passport;
