import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Client } from "../models/Client.js";
import dotenv from "dotenv";

dotenv.config();

// Créer une instance séparée pour les clients
const passportClient = new passport.Passport();

// ✅ VÉRIFICATION DES VARIABLES D'ENVIRONNEMENT CLIENT (optionnel)
if (!process.env.GOOGLE_CLIENT_ID_CLIENT || !process.env.GOOGLE_CLIENT_SECRET_CLIENT) {
  console.warn("⚠️  Variables Google OAuth CLIENT manquantes - L'authentification Google sera désactivée");
  console.warn("   Pour activer Google OAuth, ajoutez dans votre fichier .env:");
  console.warn("     GOOGLE_CLIENT_ID_CLIENT=votre_client_id");
  console.warn("     GOOGLE_CLIENT_SECRET_CLIENT=votre_secret");
} else {
  console.log("✅ Configuration Google OAuth CLIENT chargée");
  console.log("   Client ID:", process.env.GOOGLE_CLIENT_ID_CLIENT.substring(0, 20) + "...");
}

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

// Configurer Google Strategy seulement si les credentials sont disponibles
if (process.env.GOOGLE_CLIENT_ID_CLIENT && process.env.GOOGLE_CLIENT_SECRET_CLIENT) {
  passportClient.use(
    'google-client',
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID_CLIENT,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET_CLIENT,
        callbackURL: "http://localhost:5000/api/client/google/callback"
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log("🔍 Google Auth CLIENT - Email:", profile.emails[0].value);

          let client = await Client.findOne({ googleId: profile.id });

          if (!client) {
            // Vérifier si un client existe déjà avec cet email
            client = await Client.findOne({ email: profile.emails[0].value });

            if (client) {
              // Lier le compte Google existant
              client.googleId = profile.id;
              client.isVerified = true;
              await client.save();
              console.log("🔗 Compte Google lié à un client existant");
            } else {
              // Créer un nouveau client
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
              console.log("➕ Nouveau CLIENT créé");
            }
          } else {
            console.log("✅ Client existant trouvé");
          }

          return done(null, client);
        } catch (err) {
          console.error("❌ Erreur Google Strategy CLIENT:", err);
          return done(err, null);
        }
      }
    )
  );
}

export default passportClient;