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

// Démarrer auth Google - ajouter state pour la sécurité
router.get("/google", (req, res, next) => {
  // Générer un state random pour la sécurité
  const state = Math.random().toString(36).substring(2, 15);
  req.session.googleState = state;
  
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: state
  })(req, res, next);
});

// Callback Google - générer token JWT et rediriger avec token
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "http://localhost:3000/auth/sign-in?error=google_auth_failed" }),
  async (req, res) => {
    try {
      // L'utilisateur est maintenant dans req.user grâce à Passport
      const user = req.user;
      
      if (!user) {
        return res.redirect("http://localhost:3000/auth/sign-in?error=no_user");
      }

      // Générer un token JWT pour cet utilisateur
      const token = jwt.sign(
        { 
          userId: user._id,
          email: user.email,
          isVerified: user.isVerified 
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Rediriger vers le frontend avec le token dans l'URL
      // Le frontend va récupérer ce token et le sauvegarder
      res.redirect(`http://localhost:3000/auth/sign-in?token=${token}&google_success=true`);
      
    } catch (error) {
      console.error("Erreur callback Google:", error);
      res.redirect("http://localhost:3000/auth/sign-in?error=callback_error");
    }
  }
);

// 🔥 SOLUTION ALTERNATIVE: Route API pour traiter le callback côté frontend
router.post("/auth/google/token", async (req, res) => {
  try {
    const { googleToken } = req.body;
    
    // Ici tu pourrais vérifier le token Google côté serveur
    // et créer/trouver l'utilisateur correspondant
    
    // Pour l'exemple, on suppose que tu as déjà l'utilisateur
    const user = req.user; // Récupéré via une autre méthode
    
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        isVerified: user.isVerified 
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ 
      success: true, 
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username
      }
    });
    
  } catch (error) {
    console.error("Erreur génération token Google:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/complete-profile", authMiddleware, completeProfile);
router.get("/get-profile", authMiddleware, getProfile);

export default router;