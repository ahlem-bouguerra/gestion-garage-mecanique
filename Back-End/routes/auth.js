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
import {getAllPieces,getPieceById,createPiece,updatePiece,deletePiece}from '../controllers/piecesController.js'
import {createDevis,getAllDevis,updateDevisStatus,deleteDevis}from '../controllers/devisController.js'


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
    failureRedirect: "http://localhost:3000/auth/google-callback?error=google_auth_failed",
    session: false
  }),
  async (req, res) => {
    try {
      console.log('📥 Google Callback - Début traitement');
      const user = req.user;

      if (!user) {
        console.error('❌ Pas d\'utilisateur dans req.user');
        return res.redirect("http://localhost:3000/auth/google-callback?error=no_user");
      }

      console.log('👤 Utilisateur Google authentifié:', {
        id: user._id,
        email: user.email,
        username: user.username
      });

      // Vérifier JWT_SECRET
      if (!process.env.JWT_SECRET) {
        console.error('❌ JWT_SECRET non défini');
        return res.redirect("http://localhost:3000/auth/google-callback?error=server_config_error");
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

      // Redirection vers la page de callback dédiée
      const redirectUrl = `http://localhost:3000/auth/google-callback?token=${token}&google_success=true`;
      
      console.log('🔗 Redirection vers callback page');
      return res.redirect(redirectUrl);

    } catch (error) {
      console.error("❌ Erreur dans callback Google:", error);
      
      // Log détaillé selon le type d'erreur
      if (error.name === 'JsonWebTokenError') {
        console.error('🔐 Erreur JWT:', error.message);
        return res.redirect("http://localhost:3000/auth/google-callback?error=token_error");
      }
      
      return res.redirect("http://localhost:3000/auth/google-callback?error=callback_error");
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
router.put('/Devis/:id/status',updateDevisStatus);
router.delete('/Devis/:id',deleteDevis);


export default router;