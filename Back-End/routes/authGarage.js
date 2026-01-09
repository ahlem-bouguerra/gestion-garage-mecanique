import express from "express";
import passportGarage from "../config/passportGarage.js";
import { register } from "../controllers/garagiste/authController.js";
import { login, logout } from "../controllers/garagiste/loginController.js";
import jwt from "jsonwebtoken";
import { Garagiste } from "../models/Garagiste.js";
import { forgotPassword } from "../controllers/garagiste/ForgotPassword.js";
import { resetPassword } from "../controllers/garagiste/ResetPassword.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { changePassword, getProfile ,updateProfile} from "../controllers/garagiste/ProfileContoller.js";
import { enhancedLocationRoutes } from "../apiDataFetcher.js";
import { createFicheClient, getFicheClients, getFicheClientById, updateFicheClient, deleteFicheClient, getFicheClientNoms, getHistoriqueVisiteByIdClient, getHistoryVisite } from "../controllers/garagiste/FicheClient.js";
import { getAllVehicules, getVehiculeById, createVehicule, updateVehicule, dissocierVehicule, getVehiculesByProprietaire } from '../controllers/garagiste/vehiculeController.js';
import { createDevis, getAllDevis, getDevisById, getDevisByNum, updateDevisStatus, updateDevis, deleteDevis,getAllDevisByGarage, acceptDevis, refuseDevis, updateFactureId ,deleteDevisForSuperAdmin } from '../controllers/garagiste/devisController.js';
import { sendDevisByEmail } from '../utils/sendDevis.js';
import { createMecanicien, updateMecanicien, deleteMecanicien, getAllMecaniciens, getMecanicienById, getMecaniciensByService ,getAllRoles} from "../controllers/garagiste/mecanicienController.js";
import { getAllAteliers, getAtelierById, createAtelier, updateAtelier, deleteAtelier } from '../controllers/garagiste/atelierController.js';
import {getAvailableServices,getMyGarageServices,addServiceToGarage,removeServiceFromGarage,getServicesForMechanics} from '../controllers/garagiste/serviceController.js';
import { createOrdreTravail, getOrdresTravail, getOrdreTravailById, /*updateStatusOrdreTravail,*/ demarrerOrdre, terminerOrdre, getStatistiques, supprimerOrdreTravail, getOrdresParDevisId, getOrdresByStatus, getOrdresSupprimes, getOrdresByAtelier, updateOrdreTravail,deleteOrdreTravailDefinitif } from '../controllers/garagiste/ordreController.js';
import { CreateFacture, CreateFactureWithCredit, GetAllFactures, GetFactureById, getFactureByDevis, MarquerFacturePayed, UpdateFacture, DeleteFacture, StaticFacture, getCreditNoteById ,GetPaymentsOverviewData,GetWeeksProfitData,GetDevicesUsedData} from '../controllers/garagiste/facturesController.js';
import { getCarnetByVehiculeId, creerCarnetManuel } from '../controllers/garagiste/carnetController.js';
import { getDashboardData ,getChargeMensuelle} from '../controllers/garagiste/ChargeAtelier.js';
import { getReservations, updateReservation } from '../controllers/garagiste/gererReservation.js';
import { createEmploye } from "../controllers/garagiste/EmployeController.js";
import { hasAny } from "../utils/permissionChecker.js";
import { authGaragisteOuSuperAdmin } from "../middlewares/combinedAuth.js";
import {superAdminMiddleware} from "../middlewares/superAdminAuthMiddleware.js";
import { getGarageRatings } from "../controllers/clients/RatingController.js";


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
    // ✅ REMPLACER jwt.verify par une recherche en base
    const user = await Garagiste.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      console.log("❌ Token invalide ou expiré");
      return res.redirect(`${process.env.FRONTEND_URL}/auth/sign-in?error=invalid_token`);
    }

    if (user.isVerified) {
      console.log("ℹ️ Compte déjà vérifié pour:", user.email);
      return res.redirect(`${process.env.FRONTEND_URL}/auth/sign-in?verified=already`);
    }

    // ✅ Marquer comme vérifié et supprimer le token
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
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


//router.post("/complete-profile", authMiddleware, completeProfile);
router.get("/get-profile", authMiddleware, getProfile);
// Mettre à jour les infos personnelles du garagiste (nom, téléphone, photo)
router.put("/profile/personal", authMiddleware, updateProfile);
router.put("/profile/password", authMiddleware, changePassword);
// Mettre à jour les infos du garage (localisation, description, etc.)
//router.put("/profile/garage", authMiddleware,hasAccess('Admin Garage'), updateGarageInfo);



// ========== LOCATIONS ==========
router.get('/governorates', enhancedLocationRoutes.getAllGovernoratesWithCount);
router.get('/cities/:governorateId', enhancedLocationRoutes.getCitiesWithCoordinates);
router.get('/locations/search/:query', enhancedLocationRoutes.searchLocations);
router.get('/locations/autocomplete', enhancedLocationRoutes.autocomplete);

// ========== CLIENTS ==========
router.post("/Creation", authMiddleware,  hasAny({
    roles: ['Admin Garage'],
    permissions: ['create_client'],
  }), createFicheClient);

router.get("/GetAll", authGaragisteOuSuperAdmin,hasAny({
  permissions: ['view_client']
}), getFicheClients);

router.get("/GetOne/:_id", authMiddleware,hasAny({
  permissions: ['view_client']
}),  getFicheClientById);

router.put("/updateOne/:_id", authMiddleware,hasAny({
    roles: ['Admin Garage'],
    permissions: [' update_client']
  }),updateFicheClient);

router.delete("/deleteOne/:_id", authMiddleware,hasAny({
    roles: ['Admin Garage'],
    permissions: ['delete_client'],
  }), deleteFicheClient);

router.get("/clients/noms", authMiddleware,hasAny({
  permissions: ['view_client']
}),getFicheClientNoms);

router.get('/clients/:clientId/historique', authMiddleware,hasAny({
  permissions: [' view_client_historique']
}), getHistoriqueVisiteByIdClient);

router.get('/clients/:clientId/visites-resume', authMiddleware,hasAny({
  permissions: [' view_client_historique']
}), getHistoryVisite);

// ========== VEHICULES ==========
router.get('/vehicules', authMiddleware,hasAny({
  permissions: [' view_vehicule']
}), getAllVehicules);

router.get('/vehicules/:id', authMiddleware,hasAny({
  permissions: [' view_vehicule']
}), getVehiculeById);

router.post('/vehicules', authMiddleware,hasAny({
    roles: ['Admin Garage'],
    permissions: [' create_vehicule']
  }),createVehicule);

router.put('/vehicules/:id', authMiddleware,hasAny({
    roles: ['Admin Garage'],
    permissions: [' update_vehicule']
  }), updateVehicule);

router.delete('/vehicules/:id', authMiddleware,hasAny({
    roles: ['Admin Garage'],
    permissions: [' dissocier_vehicule']
  }),dissocierVehicule);

router.get('/vehicules/proprietaire/:clientId', authGaragisteOuSuperAdmin,hasAny({
  permissions: [' view_vehicule']
}), getVehiculesByProprietaire);

// ========== DEVIS ==========
router.post('/createdevis', authGaragisteOuSuperAdmin,hasAny({
    roles: ['Admin Garage','Super Admin'],
    permissions: [' create_devis']
  }),createDevis);

router.get('/Devis', authGaragisteOuSuperAdmin,hasAny({
  permissions: ['view_devis']
}), getAllDevis);

router.get('/devis/:id', authGaragisteOuSuperAdmin,hasAny({
  permissions: ['view_devis']
}), getDevisById);

router.get('/devis/code/:id', authGaragisteOuSuperAdmin,hasAny({
  permissions: ['view_devis']
}), getDevisByNum);

router.put('/Devis/:id/status', authGaragisteOuSuperAdmin,hasAny({
    roles: ['Admin Garage'],
    permissions: [' update_devis']
  }), updateDevisStatus);

router.put('/Devis/:id', authGaragisteOuSuperAdmin,hasAny({
    roles: ['Admin Garage','Super Admin']
  }), updateDevis);
router.put('/updateId/:id', authGaragisteOuSuperAdmin,hasAny({
    roles: ['Admin Garage'],
    permissions: [' update_devis']
  }),updateFactureId);

router.delete('/Devis/:id', authGaragisteOuSuperAdmin,hasAny({
    roles: ['Admin Garage'],
    permissions: ['delete_devis'],
  }),deleteDevis);

router.delete('/deleteDevis/:id',superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }),deleteDevisForSuperAdmin);

router.get("/devis/:devisId/accept", acceptDevis);

router.get("/devis/:devisId/refuse",refuseDevis);

router.post('/devis/:devisId/send-email', authGaragisteOuSuperAdmin,hasAny({
    roles: ['Admin Garage','Super Admin']
  }), sendDevisByEmail);
router.get('/garage-devis/:garageId',superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }),getAllDevisByGarage);

// ========== MECANICIENS ==========
router.post("/createMecanicien", authMiddleware,hasAny({
    roles: ['Admin Garage'],
    permissions: ['create_mecanicien']
  }),createMecanicien);

router.get("/getAllMecaniciens", authMiddleware,hasAny({
    permissions: ['view_mecanicien']
  }), getAllMecaniciens);

router.get("/getMecanicienById/:id", authMiddleware,hasAny({
    permissions: ['view_mecanicien']
  }),getMecanicienById);

router.put("/updateMecanicien/:id", authMiddleware,hasAny({
    roles: ['Admin Garage'],
    permissions: ['update_mecanicien']
  }), updateMecanicien);

router.delete("/deleteMecanicien/:id", authMiddleware,hasAny({
    roles: ['Admin Garage'],
    permissions: ['delete_mecanicien']
  }),deleteMecanicien);

router.get('/mecaniciens/by-service/:serviceId', authGaragisteOuSuperAdmin,hasAny({
    permissions: ['view_mecanicien']
  }), getMecaniciensByService);
  
router.get("/getAllRoles/for/admin", authGaragisteOuSuperAdmin, getAllRoles);

// ========== ATELIERS ==========
router.get('/getAllAteliers', authGaragisteOuSuperAdmin,hasAny({
    permissions: ['view_atelier']
  }), getAllAteliers);

router.get('/getAtelierById/:id', authMiddleware,hasAny({
    permissions: ['view_atelier']
  }), getAtelierById);

router.post('/createAtelier', authMiddleware,hasAny({
    roles: ['Admin Garage'],
    permissions: ['create_atelier']
  }), createAtelier);

router.put('/updateAtelier/:id', authMiddleware,hasAny({
    roles: ['Admin Garage'],
    permissions: ['update_atelier']
  }),updateAtelier);

router.delete('/deleteAtelier/:id', authMiddleware,hasAny({
    roles: ['Admin Garage'],
    permissions: ['delete_atelier']
  }),deleteAtelier);

// ========== SERVICES ==========
router.get('/services/available', authMiddleware,hasAny({
    permissions: ['view_service']
  }),getAvailableServices);

router.get('/services/my-garage', authMiddleware,hasAny({
    permissions: ['view_service']
  }),getMyGarageServices);

router.post('/services/add', authMiddleware,hasAny({
    roles: ['Admin Garage'],
    permissions: [' create_service']
  }),addServiceToGarage);

router.delete('/services/:id/remove', authMiddleware,hasAny({
    roles: ['Admin Garage'],
    permissions: ['delete_service']
  }), removeServiceFromGarage);

router.get('/services/available-for-mechanics',authGaragisteOuSuperAdmin,hasAny({
    permissions: ['view_service']
  }),getServicesForMechanics)

// ========== ORDRES DE TRAVAIL ==========
router.post('/createOrdre', authGaragisteOuSuperAdmin,hasAny({
    roles: ['Admin Garage'],
    permissions: ['create_ordre']
  }), createOrdreTravail);

router.get('/', authGaragisteOuSuperAdmin,hasAny({
    permissions: ['get_ordres']
  }),getOrdresTravail);

router.get('/getOrdreTravailById/:id', authGaragisteOuSuperAdmin,hasAny({
    permissions: ['get_ordres']
  }), getOrdreTravailById);

/*router.put('/:id/status', authMiddleware, updateStatusOrdreTravail);*/
router.put('/ordre-travail/:id/demarrer', authGaragisteOuSuperAdmin,hasAny({
    roles: ['Admin Garage'],
    permissions: ['demarrer_ordre']
  }), demarrerOrdre);

router.put('/ordre-travail/:id/terminer', authGaragisteOuSuperAdmin,hasAny({
    roles: ['Admin Garage'],
     permissions: ['terminer_ordre']
  }),terminerOrdre);

router.delete('/:id', authGaragisteOuSuperAdmin,hasAny({
    roles: ['Admin Garage'],
    permissions: ['delete_ordre']
  }), supprimerOrdreTravail);

router.put('/modifier/:id', authGaragisteOuSuperAdmin,hasAny({
    roles: ['Admin Garage'],
    permissions: ['update_ordre']
  }), updateOrdreTravail);

router.get('/statistiques', authGaragisteOuSuperAdmin,hasAny({
    permissions: ['get_ordres']
  }), getStatistiques);
router.get('/ordre-travail/by-devis/:devisId', authGaragisteOuSuperAdmin,hasAny({
    permissions: ['get_ordres']
  }), getOrdresParDevisId);
router.get("/ordres/status/:status", authGaragisteOuSuperAdmin,hasAny({
    permissions: ['get_ordres']
  }), getOrdresByStatus);
router.get('/ordres/status/supprime', authGaragisteOuSuperAdmin,hasAny({
    permissions: ['get_ordres']
  }), getOrdresSupprimes);
router.delete('/Delete-definitif/:id',superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }),deleteOrdreTravailDefinitif);
router.get("/ordres/atelier/:atelierId", authGaragisteOuSuperAdmin,hasAny({
    permissions: ['get_ordres']
  }),getOrdresByAtelier);

// ========== FACTURES ==========
router.post('/create/:devisId', authGaragisteOuSuperAdmin,hasAny({
    roles: ['Admin Garage'],
    permissions: ['create_facture']
  }), CreateFacture);

router.post('/create-with-credit/:devisId', authGaragisteOuSuperAdmin,hasAny({
    roles: ['Admin Garage'],
    permissions: ['create_credit_note']
  }), CreateFactureWithCredit);

router.get('/getFactures', authGaragisteOuSuperAdmin,hasAny({
    permissions: ['view_facture']
  }), GetAllFactures);

router.get('/getFacture/:id', authGaragisteOuSuperAdmin,hasAny({
    permissions: ['view_facture']
  }),GetFactureById);

router.get('/factureByDevis/:devisId',authGaragisteOuSuperAdmin,hasAny({
    permissions: ['view_facture']
  }), getFactureByDevis);

router.put('/:id', authGaragisteOuSuperAdmin,hasAny({
    roles: ['Admin Garage'],
    permissions: ['update_facture']
  }),UpdateFacture);

router.put('/:id/payment', authGaragisteOuSuperAdmin,hasAny({
    roles: ['Admin Garage'],
    permissions: ['mark_facture_paid']
  }),MarquerFacturePayed);

router.delete('/:id', authGaragisteOuSuperAdmin,hasAny({
    roles: ['Admin Garage'],
    permissions: ['delete_facture']
  }), DeleteFacture);

router.get('/stats/summary', authGaragisteOuSuperAdmin,hasAny({
    permissions: ['view_facture']
  }), StaticFacture);

router.get('/credit-note/:creditNoteId', authGaragisteOuSuperAdmin,hasAny({
    roles: ['Admin Garage'],
    permissions: ['view_credit_note']
  }), getCreditNoteById);

router.get('/factures/charts/payments-overview', authGaragisteOuSuperAdmin,hasAny({
    roles: ['Admin Garage'],
    permissions: ['view_facture']
  }), GetPaymentsOverviewData);
router.get('/factures/charts/weeks-profit', authGaragisteOuSuperAdmin,hasAny({
    roles: ['Admin Garage'],
    permissions: ['view_facture']
  }),GetWeeksProfitData);
router.get('/factures/charts/devices-used', authGaragisteOuSuperAdmin,hasAny({
    roles: ['Admin Garage'],
    permissions: ['view_facture']
  }), GetDevicesUsedData);


// ========== CARNET ENTRETIEN ==========
router.get('/carnet-entretien/vehicule/:vehiculeId', authMiddleware,hasAny({
    permissions: ['view_carnet']
  }), getCarnetByVehiculeId);

router.post('/creer-manuel', authMiddleware,hasAny({
    roles: ['Admin Garage'],
    permissions: ['create_carnet']
  }),creerCarnetManuel);

// ========== DASHBOARD ==========
router.get('/dashboard/charge-atelier',authGaragisteOuSuperAdmin,hasAny({
    roles: ['Admin Garage', 'Super Admin']
  }),getDashboardData);
router.get('/dashboard/charge-mensuelle', authGaragisteOuSuperAdmin,hasAny({
    roles: ['Admin Garage', 'Super Admin']
  }),getChargeMensuelle);


// ========== RESERVATIONS ==========
router.get('/reservations',authMiddleware,hasAny({
    permissions: ['view_reservation']
  }), getReservations);
router.put('/update/reservations/:id',authMiddleware,hasAny({
    permissions: ['update_reservation']
  }),updateReservation);

router.get('/garagiste/garage-ratings/:garageId', authMiddleware,getGarageRatings);

//router.post("/create-employe", authMiddleware, createEmploye);

export default router;