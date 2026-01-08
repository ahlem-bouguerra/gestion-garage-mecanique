import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Garagiste } from "../models/Garagiste.js";
import dotenv from "dotenv";

dotenv.config();

// Créer une instance séparée pour les garages
const passportGarage = new passport.Passport();

// ✅ VÉRIFICATION DES VARIABLES D'ENVIRONNEMENT GARAGE
if (!process.env.GOOGLE_CLIENT_ID_GARAGE || !process.env.GOOGLE_CLIENT_SECRET_GARAGE) {
  console.error("❌ ERREUR CRITIQUE: Variables Google OAuth GARAGE manquantes!");
  console.error("Ajoutez dans votre fichier .env:");
  console.error("  GOOGLE_CLIENT_ID_GARAGE=votre_client_id");
  console.error("  GOOGLE_CLIENT_SECRET_GARAGE=votre_secret");
  process.exit(1);
}

console.log("✅ Configuration Google OAuth GARAGE chargée");
console.log("   Client ID:", process.env.GOOGLE_CLIENT_ID_GARAGE.substring(0, 20) + "...");

passportGarage.serializeUser((user, done) => {
  done(null, user.id);
});

passportGarage.deserializeUser(async (id, done) => {
  try {
    const user = await Garagiste.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passportGarage.use(
  'google-garage',
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID_GARAGE,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET_GARAGE,
      callbackURL: "http://localhost:5000/api/garage/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("🔍 Google Auth GARAGE - Email:", profile.emails[0].value);

        let user = await Garagiste.findOne({ googleId: profile.id });

        if (!user) {
          // Vérifier si un utilisateur existe déjà avec cet email
          user = await Garagiste.findOne({ email: profile.emails[0].value });

          if (user) {
            // Lier le compte Google existant
            user.googleId = profile.id;
            user.isVerified = true;
            await user.save();
            console.log("🔗 Compte Google lié à un utilisateur existant");
          } else {
            // Créer un nouvel utilisateur
            user = await Garagiste.create({
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
            console.log("➕ Nouvel utilisateur GARAGE créé");
          }
        } else {
          console.log("✅ Utilisateur GARAGE existant trouvé");
        }

        return done(null, user);
      } catch (err) {
        console.error("❌ Erreur Google Strategy GARAGE:", err);
        return done(err, null);
      }
    }
  )
);

export default passportGarage;