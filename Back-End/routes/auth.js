import express from "express";
import { register } from "../controllers/authController.js";
import {login} from "../controllers/loginController.js";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import passport from "../config/passport.js";
import { forgotPassword } from "../controllers/ForgotPassword.js";
import { resetPassword } from "../controllers/ResetPassword.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { completeProfile, getProfile } from "../controllers/ProfileContoller.js";

const router = express.Router();

router.post("/signup", register);

router.get("/verify-email/:token", async (req, res) => {
  const token = req.params.token;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });

    user.isVerified = true;
    user.token = undefined;
    await user.save();

    return res.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la vérification de l'email :", error);
    return res.status(400).json({ success: false, message: "Vérification échouée" });
  }
});

router.post("/login", login);

// 🔥 SOLUTION 1: Modifier les routes Google pour gérer les tokens

// Code Backend corrigé

// Route Google OAuth initiale
router.get("/google", 
  passport.authenticate("google", { 
    scope: ["profile", "email"],
    prompt: "select_account" // Force la sélection de compte
  })
);

// Callback Google - Version corrigée avec gestion d'erreurs améliorée
router.get(
  "/google/callback",
  passport.authenticate("google", { 
    failureRedirect: "http://localhost:3000/auth/sign-in?error=google_auth_failed",
    session: false // Important : pas de session si vous utilisez JWT
  }),
  async (req, res) => {
    try {
      console.log('📥 Callback Google reçu');
      const user = req.user;

      if (!user) {
        console.error('❌ Utilisateur non trouvé dans req.user');
        return res.redirect("http://localhost:3000/auth/sign-in?error=no_user");
      }

      console.log('👤 Utilisateur authentifié:', {
        id: user._id,
        email: user.email,
        isVerified: user.isVerified
      });

      // Vérifier que JWT_SECRET est défini
      if (!process.env.JWT_SECRET) {
        console.error('❌ JWT_SECRET non défini');
        return res.redirect("http://localhost:3000/auth/sign-in?error=server_config_error");
      }

      // Générer un token JWT pour cet utilisateur
      const token = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          isVerified: user.isVerified || true // Google users are considered verified
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      console.log('🔐 Token JWT généré');

      // Vérifier complétude du profil avec validation stricte des placeholders
      console.log('📋 Vérification complétude profil:', {
        username: user.username,
        phone: user.phone,
        city: user.city,
        location: user.location,
        coordinates: user.location?.coordinates
      });

      // Validation stricte : rejeter les valeurs vides, nulles ou de placeholder
      const hasUsername = user.username && 
                         user.username.trim() !== "" && 
                         user.username.trim() !== "undefined";

      const hasPhone = user.phone && 
                      user.phone.trim() !== "" && 
                      user.phone.trim() !== "undefined" &&
                      user.phone.length >= 8; // Au minimum 8 chiffres pour un numéro valide

      const hasCity = user.city && 
                     user.city.trim() !== "" && 
                     user.city.trim() !== "undefined" &&
                     user.city.length >= 2; // Au minimum 2 caractères pour une ville

      // Validation géolocalisation : rejeter les coordonnées [0,0] qui sont des placeholders
      const hasValidLocation = user.location && 
                              Array.isArray(user.location.coordinates) &&
                              user.location.coordinates.length === 2 &&
                              // Rejeter explicitement les coordonnées [0,0] (placeholder)
                              !(user.location.coordinates[0] === 0 && user.location.coordinates[1] === 0) &&
                              // Vérifier que les coordonnées sont dans des plages valides
                              user.location.coordinates[0] !== null &&
                              user.location.coordinates[1] !== null &&
                              user.location.coordinates[0] >= -180 && user.location.coordinates[0] <= 180 &&
                              user.location.coordinates[1] >= -90 && user.location.coordinates[1] <= 90;

      const isComplete = hasUsername && hasPhone && hasCity && hasValidLocation;

      console.log('✅ État du profil:', {
        hasUsername,
        hasPhone,
        hasCity,
        hasValidLocation,
        isComplete
      });

      // Construire l'URL de redirection
      let redirectUrl;
      if (isComplete) {
        // Profil complet, redirection vers la page d'accueil
        redirectUrl = `http://localhost:3000/?token=${token}&google_success=true`;
        console.log('🏠 Redirection vers accueil - profil complet');
      } else {
        // Profil incomplet, redirection vers compléter profil
        redirectUrl = `http://localhost:3000/auth/complete-profile?token=${token}&google_success=true`;
        console.log('📝 Redirection vers compléter profil - profil incomplet');
      }

      console.log('🔗 URL de redirection:', redirectUrl);
      return res.redirect(redirectUrl);

    } catch (error) {
      console.error("❌ Erreur callback Google:", error);
      
      // Log détaillé de l'erreur
      if (error.name === 'JsonWebTokenError') {
        console.error('🔐 Erreur JWT:', error.message);
        return res.redirect("http://localhost:3000/auth/sign-in?error=token_generation_failed");
      }
      
      if (error.name === 'ValidationError') {
        console.error('📝 Erreur validation:', error.message);
        return res.redirect("http://localhost:3000/auth/sign-in?error=validation_error");
      }

      return res.redirect("http://localhost:3000/auth/sign-in?error=callback_error");
    }
  }
);

// Route pour vérifier le token (optionnelle mais utile pour débugger)
router.get("/verify-token", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({
      valid: true,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Erreur vérification token:', error);
    res.status(401).json({ error: 'Token invalide' });
  }
});
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/complete-profile", authMiddleware, completeProfile);
router.get("/get-profile", authMiddleware, getProfile);

export default router;