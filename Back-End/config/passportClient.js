import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Client } from "../models/Client.js";

// Créer une instance séparée pour les clients
const passportClient = new passport.Passport();

passportClient.serializeUser((client, done) => {
  done(null, client.id);
});

passportClient.deserializeUser(async (id, done) => {
  try {
    const client = await Client.findById(id);
    done(null, client);
  } catch (err) {
    done(err, null);
  }
});

passportClient.use('google-client', new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/api/google/callback/client" // Callback pour port 3001
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
          coordinates: [0, 0]
        }
      });
    }
    return done(null, client);
  } catch (err) {
    return done(err, null);
  }
}));

export default passportClient;