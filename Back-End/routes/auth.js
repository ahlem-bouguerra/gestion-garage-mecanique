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
import { enhancedLocationRoutes } from "../apiDataFetcher.js"; 
import {createFicheClient,getFicheClients,getFicheClientById,updateFicheClient,deleteFicheClient,getFicheClientNoms} from "../controllers/FicheClient.js";
import {getAllVehicules,getVehiculeById,createVehicule,updateVehicule,deleteVehicule,getVehiculesByProprietaire} from '../controllers/vehiculeController.js';
import {getAllPieces,getPieceById,createPiece,updatePiece,deletePiece}from '../controllers/piecesController.js';
import {createDevis,getAllDevis,getDevisById,updateDevisStatus,updateDevis,deleteDevis, acceptDevis,refuseDevis}from '../controllers/devisController.js';
import { sendDevisByEmail } from '../utils/sendDevis.js';
import {createMecanicien,updateMecanicien,deleteMecanicien,getAllMecaniciens,getMecanicienById} from "../controllers/mecanicienController.js";




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
router.get(
  "/google", 
  passport.authenticate("google", {
    scope: ["profile", "email"]
  })
);
router.get(
  "/google/callback", 
  passport.authenticate("google", { 
    failureRedirect: "http://localhost:3000/auth/sign-in?error=google_auth_failed",
    session: false
  }),
  async (req, res) => {
    try {
      console.log('📥 Google API Callback - Début traitement');
      const user = req.user;

      if (!user) {
        console.error('❌ Pas d\'utilisateur dans req.user');
        return res.redirect("http://localhost:3000/auth/sign-in?error=no_user");
      }

      console.log('👤 Utilisateur Google authentifié:', {
        id: user._id,
        email: user.email,
        username: user.username,
        phone: user.phone,
        governorateId: user.governorateId
      });

      // Vérifier JWT_SECRET
      if (!process.env.JWT_SECRET) {
        console.error('❌ JWT_SECRET non défini');
        return res.redirect("http://localhost:3000/auth/sign-in?error=server_config_error");
      }

      // Générer token JWT
      const token = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          isVerified: user.isVerified || true
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      console.log('🔐 Token JWT généré pour Google OAuth');

      // ✅ FIX: Vérifier directement les propriétés de l'utilisateur depuis la DB
      const isProfileComplete = !!(user.username && user.phone && user.governorateId);
      console.log('🔍 Vérification profil complet SERVEUR:', {
        isComplete: isProfileComplete,
        hasUsername: !!user.username,
        hasPhone: !!user.phone,
        hasGovernorateId: !!user.governorateId
      });

      // Page HTML avec traitement automatique côté client
      const html = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Connexion Google...</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
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
              border: 1px solid rgba(255, 255, 255, 0.2);
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
            #status {
              font-size: 1rem;
              margin-top: 1rem;
              min-height: 24px;
            }
            .success { color: #4ade80; }
            .error { color: #f87171; }
            .loading { color: #e5e7eb; }
            .progress {
              width: 100%;
              height: 4px;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 2px;
              margin: 1rem 0;
              overflow: hidden;
            }
            .progress-bar {
              height: 100%;
              background: linear-gradient(90deg, #4ade80, #22d3ee);
              width: 0%;
              animation: progress 2s ease-in-out;
            }
            @keyframes progress {
              0% { width: 0%; }
              100% { width: 100%; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>🎉 Connexion Google réussie !</h2>
            <div class="spinner"></div>
            <div class="progress">
              <div class="progress-bar"></div>
            </div>
            <p id="status" class="loading">Préparation de votre session...</p>
          </div>

          <script>
            const token = "${token}";
            const isComplete = ${isProfileComplete}; // ✅ FIX: Utiliser la valeur du serveur
            const statusEl = document.getElementById('status');
            
            console.log('🔐 Token reçu du serveur Google OAuth');
            console.log('📍 Token preview:', token.substring(0, 30) + '...');
            console.log('📋 Profil complet (serveur):', isComplete);
            
            // Fonction pour mettre à jour le statut
            function updateStatus(message, className = 'loading') {
              statusEl.textContent = message;
              statusEl.className = className;
            }

            // ✅ FIX: Sauvegarde immédiate et redirection basée sur les données serveur
            try {
              updateStatus('Sauvegarde des informations de connexion...');
              
              // Sauvegarde du token
              localStorage.setItem('token', token);
              document.cookie = \`token=\${token}; path=/; max-age=604800; secure=false; samesite=lax\`;
              console.log('💾 Token sauvegardé avec succès');
              
              // ✅ FIX: Redirection immédiate basée sur les données serveur
              setTimeout(() => {
                if (isComplete) {
                  console.log('➡️ Profil complet - Redirection vers la page d\\'accueil');
                  updateStatus('Profil complet ! Redirection vers l\\'accueil...', 'success');
                  setTimeout(() => {
                    window.location.href = 'http://localhost:3000/';
                  }, 1000);
                } else {
                  console.log('➡️ Profil incomplet - Redirection vers completion du profil');
                  updateStatus('Completion du profil requise...', 'loading');
                  setTimeout(() => {
                    window.location.href = 'http://localhost:3000/auth/complete-profile';
                  }, 1000);
                }
              }, 500);
              
            } catch (error) {
              console.error('❌ Erreur lors du traitement:', error);
              updateStatus('Erreur: ' + error.message, 'error');
              
              setTimeout(() => {
                console.log('➡️ Redirection vers sign-in à cause de l\\'erreur');
                window.location.href = 'http://localhost:3000/auth/sign-in?error=processing_failed';
              }, 3000);
            }
          </script>
        </body>
        </html>
      `;
      
      return res.send(html);

    } catch (error) {
      console.error("❌ Erreur dans callback Google API:", error);
      
      const errorHtml = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <title>Erreur de connexion</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 50px;
              background: #f8f9fa;
              color: #343a40;
            }
            .error-container {
              max-width: 400px;
              margin: 0 auto;
              padding: 2rem;
              background: white;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h2 { color: #dc3545; margin-bottom: 1rem; }
            .btn {
              display: inline-block;
              padding: 10px 20px;
              background: #007bff;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="error-container">
            <h2>❌ Erreur de connexion Google</h2>
            <p>Une erreur s'est produite lors de la connexion avec Google.</p>
            <p><strong>Erreur:</strong> ${error.message}</p>
            <a href="http://localhost:3000/auth/sign-in" class="btn">Retour à la connexion</a>
          </div>
          
          <script>
            console.error('❌ Erreur callback Google:', '${error.message}');
            setTimeout(() => {
              window.location.href = 'http://localhost:3000/auth/sign-in?error=callback_error';
            }, 5000);
          </script>
        </body>
        </html>
      `;
      
      return res.send(errorHtml);
    }
  }
);
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

// Gouvernorats
router.get('/governorates',enhancedLocationRoutes.getAllGovernoratesWithCount);

// Villes selon gouvernorat
router.get('/cities/:governorateId', enhancedLocationRoutes.getCitiesWithCoordinates);

// Recherche auto-complétion
router.get('/locations/search/:query', enhancedLocationRoutes.searchLocations);
router.get('/locations/autocomplete', enhancedLocationRoutes.autocomplete);

//creation de client , modif,getbyid, get all , delete 
router.post("/Creation", createFicheClient);      
router.get("/GetAll", getFicheClients); 
router.get("/GetOne/:_id", getFicheClientById);         
router.put("/updateOne/:_id", updateFicheClient);    
router.delete("/deleteOne/:_id", deleteFicheClient); 
router.get("/clients/noms", getFicheClientNoms);


router.get('/vehicules', getAllVehicules);
router.get('/vehicules/:id', getVehiculeById);
router.post('/vehicules', createVehicule);
router.put('/vehicules/:id', updateVehicule);
router.delete('/vehicules/:id', deleteVehicule);
router.get('/vehicules/proprietaire/:clientId', getVehiculesByProprietaire);


router.get('/pieces', getAllPieces);
router.get('/pieces/:id', getPieceById);
router.post('/pieces', createPiece);
router.put('/pieces/:id', updatePiece);
router.delete('/pieces/:id', deletePiece);


router.post('/createdevis',createDevis);
router.get('/Devis',getAllDevis);
router.get('/Devis/:id',getDevisById);
router.put('/Devis/:id/status',updateDevisStatus);
router.put('/Devis/:id', updateDevis);
router.delete('/Devis/:id',deleteDevis);
router.get("/devis/:devisId/accept", acceptDevis);
router.get("/devis/:devisId/refuse", refuseDevis);


router.post('/devis/:devisId/send-email',authMiddleware, sendDevisByEmail);


router.post("/", createMecanicien);     
router.get("/", getAllMecaniciens);         
router.get("/:id", getMecanicienById);      
router.put("/:id", updateMecanicien);       
router.delete("/:id", deleteMecanicien); 


export default router;