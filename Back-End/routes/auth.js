import express from "express";
import { register } from "../controllers/authController.js";
import {login, logout} from "../controllers/loginController.js";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { forgotPassword } from "../controllers/ForgotPassword.js";
import { resetPassword } from "../controllers/ResetPassword.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { completeProfile, getProfile } from "../controllers/ProfileContoller.js";
import { enhancedLocationRoutes } from "../apiDataFetcher.js"; 
import {createFicheClient,getFicheClients,getFicheClientById,updateFicheClient,deleteFicheClient,getFicheClientNoms, getHistoriqueVisiteByIdClient, getHistoryVisite} from "../controllers/FicheClient.js";
import {getAllVehicules,getVehiculeById,createVehicule,updateVehicule,deleteVehicule,getVehiculesByProprietaire} from '../controllers/vehiculeController.js';
import {createDevis,getAllDevis,getDevisById,getDevisByNum,updateDevisStatus,updateDevis,deleteDevis, acceptDevis,refuseDevis,updateFactureId}from '../controllers/devisController.js';
import { sendDevisByEmail } from '../utils/sendDevis.js';
import {createMecanicien,updateMecanicien,deleteMecanicien,getAllMecaniciens,getMecanicienById,getMecaniciensByService} from "../controllers/mecanicienController.js";
import {getAllAteliers,getAtelierById,createAtelier,updateAtelier,deleteAtelier}from '../controllers/atelierController.js';
import {getAllServices,getServiceById,createService,updateService,deleteService}from '../controllers/serviceController.js';
import {createOrdreTravail,getOrdresTravail,getOrdreTravailById,updateStatusOrdreTravail,demarrerOrdre,terminerOrdre,getStatistiques,supprimerOrdreTravail,getOrdresParDevisId,getOrdresByStatus,getOrdresSupprimes,getOrdresByAtelier,updateOrdreTravail} from '../controllers/ordreController.js';
import { CreateFacture,CreateFactureWithCredit, GetAllFactures, GetFactureById, getFactureByDevis, MarquerFacturePayed, UpdateFacture, DeleteFacture, StaticFacture ,getCreditNoteById} from '../controllers/facturesController.js';
import { getCarnetByVehiculeId ,creerCarnetManuel} from '../controllers/carnetController.js';
import {getDashboardData} from '../controllers/ChargeAtelier.js';
import { search } from '../controllers/ChercherGarage.js';
import { createReservation , getReservations ,updateReservation} from '../controllers/gererReservation.js'


import {registerClient} from "../controllers/RegisterClient.js";
import { loginClient } from "../controllers/loginCLientController.js";
import { verifEmailCLient } from "../controllers/VerifEmailClientController.js";
import { resetPasswordClient } from "../controllers/ResetPasswordClient.js";
import { forgotPasswordClient } from "../controllers/ForgotPasswordClient.js";

const router = express.Router();
router.get('/dashboard/charge-atelier', getDashboardData);
router.post("/signup", register);
router.get("/verify-email/:token", async (req, res) => {
  const token = req.params.token;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      console.log("❌ Utilisateur non trouvé pour la vérification");
      return res.redirect(`${process.env.FRONTEND_URL}/auth/sign-in?error=user_not_found`);
    }

    // Vérifier si déjà vérifié
    if (user.isVerified) {
      console.log("ℹ️ Compte déjà vérifié pour:", user.email);
      return res.redirect(`${process.env.FRONTEND_URL}/auth/sign-in?verified=already`);
    }

    // ✅ MARQUER COMME VÉRIFIÉ
    user.isVerified = true;
    user.token = undefined;
    await user.save();

    console.log("✅ Email vérifié avec succès pour:", user.email);
    
    // ✅ REDIRECTION VERS LE FRONTEND AVEC PARAMÈTRE DE SUCCÈS
    return res.redirect(`${process.env.FRONTEND_URL}/auth/sign-in?verified=true`);

  } catch (error) {
    console.error("❌ Erreur lors de la vérification de l'email :", error);
    return res.redirect(`${process.env.FRONTEND_URL}/auth/sign-in?error=verification_failed`);
  }
});
router.post("/login", login);
router.post("/logout",logout);

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
router.post("/Creation",authMiddleware,createFicheClient);      
router.get("/GetAll", authMiddleware, getFicheClients); 
router.get("/GetOne/:_id", authMiddleware, getFicheClientById);         
router.put("/updateOne/:_id", authMiddleware, updateFicheClient);    
router.delete("/deleteOne/:_id", authMiddleware, deleteFicheClient); 
router.get("/clients/noms", authMiddleware, getFicheClientNoms);
router.get('/clients/:clientId/historique', authMiddleware, getHistoriqueVisiteByIdClient);
router.get('/clients/:clientId/visites-resume', authMiddleware,getHistoryVisite);

router.get('/vehicules',authMiddleware, getAllVehicules);
router.get('/vehicules/:id',authMiddleware, getVehiculeById);
router.post('/vehicules',authMiddleware, createVehicule);
router.put('/vehicules/:id',authMiddleware, updateVehicule);
router.delete('/vehicules/:id',authMiddleware, deleteVehicule);
router.get('/vehicules/proprietaire/:clientId',authMiddleware, getVehiculesByProprietaire);


router.post('/createdevis',authMiddleware,createDevis);
router.get('/Devis',authMiddleware,getAllDevis);
router.get('/Devis/:id',authMiddleware,getDevisById);
router.get('/devis/code/:id',authMiddleware, getDevisByNum);
router.put('/Devis/:id/status',authMiddleware,updateDevisStatus);
router.put('/Devis/:id',authMiddleware, updateDevis);
router.put('/updateId/:id',authMiddleware, updateFactureId);
router.delete('/Devis/:id',authMiddleware,deleteDevis);
router.get("/devis/:devisId/accept",authMiddleware, acceptDevis);
router.get("/devis/:devisId/refuse",authMiddleware, refuseDevis);
router.post('/devis/:devisId/send-email',authMiddleware, sendDevisByEmail);


router.post("/createMecanicien",authMiddleware, createMecanicien);     
router.get("/getAllMecaniciens",authMiddleware, getAllMecaniciens);         
router.get("/getMecanicienById/:id",authMiddleware, getMecanicienById);      
router.put("/updateMecanicien/:id",authMiddleware, updateMecanicien);       
router.delete("/deleteMecanicien/:id",authMiddleware, deleteMecanicien);
router.get('/mecaniciens/by-service/:serviceId',authMiddleware, getMecaniciensByService);



router.get('/getAllAteliers',authMiddleware, getAllAteliers);
router.get('/getAtelierById/:id',authMiddleware, getAtelierById);
router.post('/createAtelier',authMiddleware, createAtelier);
router.put('/updateAtelier/:id',authMiddleware, updateAtelier);
router.delete('/deleteAtelier/:id',authMiddleware, deleteAtelier);


router.get('/getAllServices',authMiddleware, getAllServices);
router.get('/getServiceById/:id', authMiddleware,getServiceById);
router.post('/createService',authMiddleware, createService);
router.put('/updateService/:id',authMiddleware, updateService);
router.delete('/deleteService/:id', authMiddleware,deleteService);


router.post('/createOrdre',authMiddleware, createOrdreTravail);
router.get('/',authMiddleware, getOrdresTravail);
router.get('/getOrdreTravailById/:id',authMiddleware, getOrdreTravailById);
// Routes de mise à jour
router.put('/:id/status',authMiddleware, updateStatusOrdreTravail);
router.put('/ordre-travail/:id/demarrer',authMiddleware, demarrerOrdre);
router.put('/ordre-travail/:id/terminer',authMiddleware, terminerOrdre);
router.delete('/:id', authMiddleware,supprimerOrdreTravail);
router.put('/modifier/:id',authMiddleware,updateOrdreTravail);
router.get('/statistiques',authMiddleware, getStatistiques);
router.get('/ordre-travail/by-devis/:devisId',authMiddleware,getOrdresParDevisId);
router.get("/ordres/status/:status",authMiddleware, getOrdresByStatus);
router.get('/ordres/status/supprime', authMiddleware, getOrdresSupprimes);
router.get("/ordres/atelier/:atelierId", authMiddleware,getOrdresByAtelier);


router.post('/create/:devisId',authMiddleware, CreateFacture);
router.post('/create-with-credit/:devisId',authMiddleware, CreateFactureWithCredit);
router.get('/getFactures',authMiddleware,GetAllFactures);
router.get('/getFacture/:id',authMiddleware,GetFactureById);
router.get('/factureByDevis/:devisId',authMiddleware, getFactureByDevis);
router.put('/:id/payment',authMiddleware,MarquerFacturePayed);
router.put('/:id',authMiddleware,UpdateFacture);
router.delete('/:id',authMiddleware,DeleteFacture);
router.get('/stats/summary',authMiddleware,StaticFacture);
router.get('/credit-note/:creditNoteId',authMiddleware, getCreditNoteById);


router.get('/carnet-entretien/vehicule/:vehiculeId',authMiddleware,getCarnetByVehiculeId);
router.post('/creer-manuel',authMiddleware, creerCarnetManuel);


router.get('/search', search);

router.post('/create-reservation',createReservation);
router.get('/reservations',getReservations)
router.put('/update/reservations/:id',updateReservation)

///////////////////////////CLient////////////////////////////////////////////////////

router.post("/client/signup", registerClient);
router.post("/client/login", loginClient);
router.post("/client/logout",logout);
router.get("/client/verify-token/:token",verifEmailCLient);
router.post("/client/reset-password", resetPasswordClient);
router.post("/client/forgot-password", forgotPasswordClient);


export default router;
