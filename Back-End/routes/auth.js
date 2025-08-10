import express from "express";
import { register } from "../controllers/authController.js";
import {login} from "../controllers/loginController.js";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import passport from "../config/passport.js";
import { forgotPassword } from "../controllers/ForgotPassword.js";
import { resetPassword } from "../controllers/ResetPassword.js";


const router = express.Router();

router.post("/signup", register);
router.get("/verify-email/:token", async (req, res) => {
  const token = req.params.token;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });

    user.isVerified = true;
    user.token = undefined; // ou delete user.token;
    await user.save();

    // ✅ Retourne un succès (pas de redirection)
    return res.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la vérification de l'email :", error);
    return res.status(400).json({ success: false, message: "Vérification échouée" });
  }
});

router.post("/login", login);

// Démarrer auth Google
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));



router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "http://localhost:3000/login" }),
  (req, res) => {
    // Ici, l'authentification est réussie
    // Tu peux rediriger vers ton frontend avec un token JWT par ex.
    res.redirect("http://localhost:3000/dashboard");
  }
);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);



export default router;


