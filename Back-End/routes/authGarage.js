import express from "express";
import passportGarage from "../config/passportGarage.js";
import { register } from "../controllers/garagiste/authController.js";
import { login, logout } from "../controllers/garagiste/loginController.js";
import jwt from "jsonwebtoken";
import { Garagiste } from "../models/Garagiste.js";
import { forgotPassword } from "../controllers/garagiste/ForgotPassword.js";
import { resetPassword } from "../controllers/garagiste/ResetPassword.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { completeProfile, getProfile ,updateProfile,updateGarageInfo} from "../controllers/garagiste/ProfileContoller.js";
import { enhancedLocationRoutes } from "../apiDataFetcher.js";
import { createFicheClient, getFicheClients, getFicheClientById, updateFicheClient, deleteFicheClient, getFicheClientNoms, getHistoriqueVisiteByIdClient, getHistoryVisite } from "../controllers/garagiste/FicheClient.js";
import { getAllVehicules, getVehiculeById, createVehicule, updateVehicule, dissocierVehicule, getVehiculesByProprietaire } from '../controllers/garagiste/vehiculeController.js';
import { createDevis, getAllDevis, getDevisById, getDevisByNum, updateDevisStatus, updateDevis, deleteDevis, acceptDevis, refuseDevis, updateFactureId } from '../controllers/garagiste/devisController.js';
import { sendDevisByEmail } from '../utils/sendDevis.js';
import { createMecanicien, updateMecanicien, deleteMecanicien, getAllMecaniciens, getMecanicienById, getMecaniciensByService } from "../controllers/garagiste/mecanicienController.js";
import { getAllAteliers, getAtelierById, createAtelier, updateAtelier, deleteAtelier } from '../controllers/garagiste/atelierController.js';
import { getAllServices, getServiceById, createService, updateService, deleteService } from '../controllers/garagiste/serviceController.js';
import { createOrdreTravail, getOrdresTravail, getOrdreTravailById, updateStatusOrdreTravail, demarrerOrdre, terminerOrdre, getStatistiques, supprimerOrdreTravail, getOrdresParDevisId, getOrdresByStatus, getOrdresSupprimes, getOrdresByAtelier, updateOrdreTravail } from '../controllers/garagiste/ordreController.js';
import { CreateFacture, CreateFactureWithCredit, GetAllFactures, GetFactureById, getFactureByDevis, MarquerFacturePayed, UpdateFacture, DeleteFacture, StaticFacture, getCreditNoteById ,GetPaymentsOverviewData,GetWeeksProfitData,GetDevicesUsedData} from '../controllers/garagiste/facturesController.js';
import { getCarnetByVehiculeId, creerCarnetManuel } from '../controllers/garagiste/carnetController.js';
import { getDashboardData ,getChargeMensuelle} from '../controllers/garagiste/ChargeAtelier.js';
import { search } from '../controllers/clients/ChercherGarage.js';
import { getReservations, updateReservation } from '../controllers/garagiste/gererReservation.js';
import { isGarageAdmin } from "../middlewares/authMiddleware.js";
import { createEmploye } from "../controllers/garagiste/EmployeController.js";

const router = express.Router();

// ========== GOOGLE OAUTH (GARAGE) ==========
router.get(
  "/garage/google",
  passportGarage.authenticate("google-garage", {
    scope: ["profile", "email"]
  })
);
router.get(
  "/garage/google/callback",
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



      // ✅ Préparer les données utilisateur
      const userData = {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone || '',
        isVerified: user.isVerified || true,

      };

      // ✅ Encoder les données utilisateur en base64
      const userDataEncoded = Buffer.from(JSON.stringify(userData)).toString('base64');
      
      console.log('📦 Données à transmettre:');
      console.log('   - Token (extrait):', token.substring(0, 30) + '...');
      console.log('   - Garagiste encodé (extrait):', userDataEncoded.substring(0, 30) + '...');
 

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
            const userDataEncoded = "${userDataEncoded}";
      
            
            console.log('🔐 Token Garage reçu');
           
            
            try {
              // ✅ CORRECTION : Toujours rediriger vers /auth/sign-in d'abord
              // pour que le composant puisse traiter le token
              setTimeout(() => {
             
                  console.log('➡️ Redirection vers sign-in avec token (profil complet)');
                  window.location.href = \`http://localhost:3000/auth/sign-in?token=\${token}&user=\${encodeURIComponent(userDataEncoded)}&redirect=dashboard\`;
              
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
// ========== AUTH CLASSIQUE (GARAGE) ==========
router.post("/signup", register);
router.post("/login", login);
router.post("/logout", logout);

router.get("/verify-email/:token", async (req, res) => {
  const token = req.params.token;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Garagiste.findById(decoded.userId);

    if (!user) {
      console.log("❌ Utilisateur non trouvé pour la vérification");
      return res.redirect(`${process.env.FRONTEND_URL}/auth/sign-in?error=user_not_found`);
    }

    if (user.isVerified) {
      console.log("ℹ️ Compte déjà vérifié pour:", user.email);
      return res.redirect(`${process.env.FRONTEND_URL}/auth/sign-in?verified=already`);
    }

    user.isVerified = true;
    user.token = undefined;
    await user.save();

    console.log("✅ Email vérifié avec succès pour:", user.email);
    return res.redirect(`${process.env.FRONTEND_URL}/auth/sign-in?verified=true`);

  } catch (error) {
    console.error("❌ Erreur lors de la vérification de l'email :", error);
    return res.redirect(`${process.env.FRONTEND_URL}/auth/sign-in?error=verification_failed`);
  }
});

router.get("/garage/verify-token", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Garagiste.findById(decoded.userId);

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
// Mettre à jour les infos personnelles du garagiste (nom, téléphone, photo)
router.put("/profile/personal", authMiddleware, updateProfile);
// Mettre à jour les infos du garage (localisation, description, etc.)
router.put("/profile/garage", authMiddleware,isGarageAdmin, updateGarageInfo);



// ========== LOCATIONS ==========
router.get('/governorates', enhancedLocationRoutes.getAllGovernoratesWithCount);
router.get('/cities/:governorateId', enhancedLocationRoutes.getCitiesWithCoordinates);
router.get('/locations/search/:query', enhancedLocationRoutes.searchLocations);
router.get('/locations/autocomplete', enhancedLocationRoutes.autocomplete);

// ========== CLIENTS ==========
router.post("/Creation", authMiddleware, createFicheClient);
router.get("/GetAll", authMiddleware, getFicheClients);
router.get("/GetOne/:_id", authMiddleware, getFicheClientById);
router.put("/updateOne/:_id", authMiddleware, updateFicheClient);
router.delete("/deleteOne/:_id", authMiddleware, deleteFicheClient);
router.get("/clients/noms", authMiddleware, getFicheClientNoms);
router.get('/clients/:clientId/historique', authMiddleware, getHistoriqueVisiteByIdClient);
router.get('/clients/:clientId/visites-resume', authMiddleware, getHistoryVisite);

// ========== VEHICULES ==========
router.get('/vehicules', authMiddleware, getAllVehicules);
router.get('/vehicules/:id', authMiddleware, getVehiculeById);
router.post('/vehicules', authMiddleware, createVehicule);
router.put('/vehicules/:id', authMiddleware, updateVehicule);
router.delete('/vehicules/:id', authMiddleware, dissocierVehicule);
router.get('/vehicules/proprietaire/:clientId', authMiddleware, getVehiculesByProprietaire);

// ========== DEVIS ==========
router.post('/createdevis', authMiddleware, createDevis);
router.get('/Devis', authMiddleware, getAllDevis);
router.get('/Devis/:id', authMiddleware, getDevisById);
router.get('/devis/code/:id', authMiddleware, getDevisByNum);
router.put('/Devis/:id/status', authMiddleware, updateDevisStatus);
router.put('/Devis/:id', authMiddleware, updateDevis);
router.put('/updateId/:id', authMiddleware, updateFactureId);
router.delete('/Devis/:id', authMiddleware, deleteDevis);
router.get("/devis/:devisId/accept", acceptDevis);
router.get("/devis/:devisId/refuse", refuseDevis);
router.post('/devis/:devisId/send-email', authMiddleware, sendDevisByEmail);

// ========== MECANICIENS ==========
router.post("/createMecanicien", authMiddleware, createMecanicien);
router.get("/getAllMecaniciens", authMiddleware, getAllMecaniciens);
router.get("/getMecanicienById/:id", authMiddleware, getMecanicienById);
router.put("/updateMecanicien/:id", authMiddleware, updateMecanicien);
router.delete("/deleteMecanicien/:id", authMiddleware, deleteMecanicien);
router.get('/mecaniciens/by-service/:serviceId', authMiddleware, getMecaniciensByService);

// ========== ATELIERS ==========
router.get('/getAllAteliers', authMiddleware, getAllAteliers);
router.get('/getAtelierById/:id', authMiddleware, getAtelierById);
router.post('/createAtelier', authMiddleware, createAtelier);
router.put('/updateAtelier/:id', authMiddleware, updateAtelier);
router.delete('/deleteAtelier/:id', authMiddleware, deleteAtelier);

// ========== SERVICES ==========
router.get('/getAllServices', authMiddleware, getAllServices);
router.get('/getServiceById/:id', authMiddleware, getServiceById);
router.post('/createService', authMiddleware, createService);
router.put('/updateService/:id', authMiddleware, updateService);
router.delete('/deleteService/:id', authMiddleware, deleteService);

// ========== ORDRES DE TRAVAIL ==========
router.post('/createOrdre', authMiddleware, createOrdreTravail);
router.get('/', authMiddleware, getOrdresTravail);
router.get('/getOrdreTravailById/:id', authMiddleware, getOrdreTravailById);
router.put('/:id/status', authMiddleware, updateStatusOrdreTravail);
router.put('/ordre-travail/:id/demarrer', authMiddleware, demarrerOrdre);
router.put('/ordre-travail/:id/terminer', authMiddleware, terminerOrdre);
router.delete('/:id', authMiddleware, supprimerOrdreTravail);
router.put('/modifier/:id', authMiddleware, updateOrdreTravail);
router.get('/statistiques', authMiddleware, getStatistiques);
router.get('/ordre-travail/by-devis/:devisId', authMiddleware, getOrdresParDevisId);
router.get("/ordres/status/:status", authMiddleware, getOrdresByStatus);
router.get('/ordres/status/supprime', authMiddleware, getOrdresSupprimes);
router.get("/ordres/atelier/:atelierId", authMiddleware, getOrdresByAtelier);

// ========== FACTURES ==========
router.post('/create/:devisId', authMiddleware, CreateFacture);
router.post('/create-with-credit/:devisId', authMiddleware, CreateFactureWithCredit);
router.get('/getFactures', authMiddleware, GetAllFactures);
router.get('/getFacture/:id', authMiddleware, GetFactureById);
router.get('/factureByDevis/:devisId',authMiddleware, getFactureByDevis);
router.put('/:id/payment', authMiddleware, MarquerFacturePayed);
router.put('/:id', authMiddleware, UpdateFacture);
router.delete('/:id', authMiddleware, DeleteFacture);
router.get('/stats/summary', authMiddleware, StaticFacture);

router.get('/credit-note/:creditNoteId', authMiddleware, getCreditNoteById);
router.get('/factures/charts/payments-overview', authMiddleware, GetPaymentsOverviewData);
router.get('/factures/charts/weeks-profit', authMiddleware, GetWeeksProfitData);
router.get('/factures/charts/devices-used', authMiddleware, GetDevicesUsedData);


// ========== CARNET ENTRETIEN ==========
router.get('/carnet-entretien/vehicule/:vehiculeId', authMiddleware, getCarnetByVehiculeId);
router.post('/creer-manuel', authMiddleware, creerCarnetManuel);

// ========== DASHBOARD ==========
router.get('/dashboard/charge-atelier',authMiddleware, getDashboardData);
router.get('/dashboard/charge-mensuelle', authMiddleware, getChargeMensuelle);

// ========== SEARCH ==========
router.get('/search', search);

// ========== RESERVATIONS ==========
router.get('/reservations',authMiddleware, getReservations);
router.put('/update/reservations/:id',authMiddleware, updateReservation);



router.post("/create-employe", authMiddleware,isGarageAdmin, createEmploye);

export default router;