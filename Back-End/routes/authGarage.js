import express from "express";
import passportGarage from "../config/passportGarage.js";

import jwt from "jsonwebtoken";

const router = express.Router();

// Route pour initier l'authentification Google (GARAGE)
router.get(
  "/google",
  passportGarage.authenticate("google-garage", {
    scope: ["profile", "email"]
  })
);

// Callback Google pour GARAGE (port 3000)
router.get(
  "/google/callback",
  passportGarage.authenticate("google-garage", {
    failureRedirect: "http://localhost:3000/auth/sign-in?error=google_auth_failed",
    session: false
  }),
  async (req, res) => {
    try {
      console.log('📥 Google Callback GARAGE - Port 3000');
      const user = req.user;

      if (!user) {
        console.error('❌ Pas d\'utilisateur');
        return res.redirect("http://localhost:3000/auth/sign-in?error=no_user");
      }

      console.log('👤 Utilisateur Garage authentifié:', {
        id: user._id,
        email: user.email,
        username: user.username
      });

      if (!process.env.JWT_SECRET) {
        console.error('❌ JWT_SECRET non défini');
        return res.redirect("http://localhost:3000/auth/sign-in?error=server_config_error");
      }

      const token = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          isVerified: user.isVerified || true
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      console.log('🔐 Token JWT généré pour Garage OAuth');

      const isProfileComplete = !!(
        user.username && 
        user.phone && 
        user.governorateId && 
        user.matriculefiscal && 
        user.garagenom
      );

      console.log('🔍 Profil complet:', isProfileComplete);

      // Page HTML pour port 3000
      const html = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <title>Connexion Google Garage...</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              text-align: center;
              padding: 3rem 2rem;
              max-width: 420px;
              background: rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(10px);
              border-radius: 20px;
              box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            }
            h2 { margin-bottom: 1rem; font-size: 1.5rem; }
            .spinner {
              width: 60px;
              height: 60px;
              border: 4px solid rgba(255, 255, 255, 0.3);
              border-left: 4px solid white;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin: 2rem auto;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            #status { font-size: 1rem; margin-top: 1rem; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>🎉 Connexion Google Garage réussie !</h2>
            <div class="spinner"></div>
            <p id="status">Préparation de votre session...</p>
          </div>

          <script>
            const token = "${token}";
            const isComplete = ${isProfileComplete};
            
            console.log('🔐 Token Garage reçu');
            console.log('📋 Profil complet:', isComplete);
            
            try {
              localStorage.setItem('token', token);
              document.cookie = \`token=\${token}; path=/; max-age=604800\`;
              console.log('💾 Token sauvegardé');
              
              setTimeout(() => {
                if (isComplete) {
                  console.log('➡️ Redirection vers accueil Garage (port 3000)');
                  window.location.href = 'http://localhost:3000/';
                } else {
                  console.log('➡️ Redirection vers completion profil Garage');
                  window.location.href = 'http://localhost:3000/auth/complete-profile';
                }
              }, 1000);
              
            } catch (error) {
              console.error('❌ Erreur:', error);
              setTimeout(() => {
                window.location.href = 'http://localhost:3000/auth/sign-in?error=processing_failed';
              }, 3000);
            }
          </script>
        </body>
        </html>
      `;
      
      return res.send(html);

    } catch (error) {
      console.error("❌ Erreur callback Garage:", error);
      return res.redirect(`http://localhost:3000/auth/sign-in?error=callback_error`);
    }
  }
);

export default router;