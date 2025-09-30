import express from "express";
import passportClient from "../config/passportClient.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Route pour initier l'authentification Google (CLIENT)
router.get(
  "/google/client",
  passportClient.authenticate("google-client", {
    scope: ["profile", "email"]
  })
);

// Callback Google pour CLIENT (port 3001)
router.get(
  "/google/callback/client",
  passportClient.authenticate("google-client", {
    failureRedirect: "http://localhost:3001/auth/sign-in?error=google_auth_failed",
    session: false
  }),
  async (req, res) => {
    try {
      console.log('📥 Google Callback CLIENT - Port 3001');
      const client = req.user;

      if (!client) {
        console.error('❌ Pas de client');
        return res.redirect("http://localhost:3001/auth/sign-in?error=no_user");
      }

      console.log('👤 Client Google authentifié:', {
        id: client._id,
        email: client.email
      });

      if (!process.env.JWT_SECRET) {
        return res.redirect("http://localhost:3001/auth/sign-in?error=server_config_error");
      }

      const token = jwt.sign(
        {
          userId: client._id,
          email: client.email,
          isVerified: client.isVerified || true
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      const userData = {
        id: client._id,
        username: client.username,
        email: client.email,
        phone: client.phone || '',
        isVerified: client.isVerified || true
      };

      const userDataEncoded = Buffer.from(JSON.stringify(userData)).toString('base64');

      // Redirection vers port 3001
      const redirectUrl = `http://localhost:3001/auth/sign-in?token=${token}&user=${encodeURIComponent(userDataEncoded)}`;
      
      console.log('➡️ Redirection vers CLIENT port 3001');
      return res.redirect(redirectUrl);

    } catch (error) {
      console.error("❌ Erreur callback Client:", error);
      return res.redirect(`http://localhost:3001/auth/sign-in?error=callback_error`);
    }
  }
);

export default router;