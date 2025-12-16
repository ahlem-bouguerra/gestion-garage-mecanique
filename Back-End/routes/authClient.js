import express from "express";
import passportClient from "../config/passportClient.js";
import jwt from "jsonwebtoken";
import { clientauthMiddleware } from "../middlewares/clientauthMiddleware.js";
import { logout } from "../controllers/garagiste/loginController.js";
import { registerClient } from "../controllers/clients/RegisterClient.js";
import { loginClient } from "../controllers/clients/loginCLientController.js";
import { verifEmailCLient } from "../controllers/clients/VerifEmailClientController.js";
import { resetPasswordClient } from "../controllers/clients/ResetPasswordClient.js";
import { forgotPasswordClient } from "../controllers/clients/ForgotPasswordClient.js";
import { getProfile ,updateProfile ,changePassword} from "../controllers/clients/ProfileContoller.js";
import { getMesVehicules, createVehiculeClient, updateMonVehicule, deleteMonVehicule } from "../controllers/clients/vehiculeController.js";
import { getGarageServicesForClient } from "../controllers/clients/serviceController.js";
import { ClientCreateReservation, ClientGetReservations, ClientUpdateReservation,ClientCancelReservation } from '../controllers/clients/revervationController.js';
import {getClientDevis, getClientDevisById, getClientDevisStats } from '../controllers/clients/clientDevisController.js';
import { getClientFactures, GetClientFactureById, GetClientFactureStats,getClientCreditNoteById} from '../controllers/clients/clientFactureController.js';
import { search } from '../controllers/clients/ChercherGarage.js';
import { getCarnetByVehiculeIdClient, creerCarnetManuelClient } from '../controllers/clients/carnetController.js';
import { hasAny } from "../utils/permissionChecker.js";
import { getAllMesOrdres, getOrdreById,getOrdreStats} from '../controllers/clients/clientOrdresController.js';
import { createRating ,getRatingByOrdre,getGarageRatings } from "../controllers/clients/RatingController.js";
const router = express.Router();

// ========== GOOGLE OAUTH (CLIENT) ==========
router.get(
  "/client/google",
  passportClient.authenticate("google-client", {
    scope: ["profile", "email"]
  })
);

router.get(
  "/client/google/callback",
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

      const redirectUrl = `http://localhost:3001/auth/sign-in?token=${token}&user=${encodeURIComponent(userDataEncoded)}`;

      console.log('➡️ Redirection vers CLIENT port 3001');
      return res.redirect(redirectUrl);

    } catch (error) {
      console.error("❌ Erreur callback Client:", error);
      return res.redirect(`http://localhost:3001/auth/sign-in?error=callback_error`);
    }
  }
);

// ========== AUTH CLASSIQUE (CLIENT) ==========
router.post("/client/signup", registerClient);
router.post("/client/login", loginClient);
router.post("/client/logout", logout);
router.get("/client/verify-token/:token", verifEmailCLient);
router.post("/client/reset-password", resetPasswordClient);
router.post("/client/forgot-password", forgotPasswordClient);
router.get("/client/profile",clientauthMiddleware,getProfile);
router.put('/client/update-profile', clientauthMiddleware,updateProfile);
router.put("/profile/password/client", clientauthMiddleware, changePassword);


router.get('/get-all-mes-vehicules',clientauthMiddleware,hasAny({
    permissions: ['view_vehicule']
  }), getMesVehicules);

router.post('/create-mes-vehicules',clientauthMiddleware,hasAny({
    permissions: ['create_vehicule']
  }), createVehiculeClient);

router.put('/update-mes-vehicules/:vehiculeId',clientauthMiddleware,hasAny({
    permissions: ['update_vehicule']
  }), updateMonVehicule);

router.delete('/delete-mes-vehicules/:vehiculeId',clientauthMiddleware,hasAny({
    permissions: ['client_delete_vehicule']
  }), deleteMonVehicule);

router.get('/services/garage/:garageId',clientauthMiddleware,hasAny({
    permissions: ['view_service']
  }),getGarageServicesForClient);


router.post('/create-reservation',clientauthMiddleware,hasAny({
    permissions: ['client_create_reservation']
  }), ClientCreateReservation);

router.get('/client-reservations/',clientauthMiddleware,hasAny({
    permissions: ['client_view_reservation']
  }), ClientGetReservations);

router.put('/client-update/reservations/:id',clientauthMiddleware,hasAny({
    permissions: ['client_update_reservation']
  }), ClientUpdateReservation);

router.put('/cancel-reservation/:reservationId', clientauthMiddleware,hasAny({
    permissions: ['client_cancel_reservation']
  }), ClientCancelReservation);

router.get('/all-mes-devis', clientauthMiddleware,hasAny({
  permissions: ['view_devis']
}), getClientDevis);

router.get('/mes-devis/stats', clientauthMiddleware,hasAny({
  permissions: ['view_devis']
}), getClientDevisStats);

router.get('/mes-devis/:devisId', clientauthMiddleware,hasAny({
  permissions: ['view_devis']
}), getClientDevisById);


router.get('/client/factures', clientauthMiddleware,hasAny({
  permissions: ['view_facture']
}), getClientFactures);

router.get('/client/factures/stats', clientauthMiddleware,hasAny({
  permissions: ['view_facture']
}), GetClientFactureStats);

router.get('/client/factures/:id', clientauthMiddleware,hasAny({
  permissions: ['view_facture']
}), GetClientFactureById);

router.get('/client/credit-note/:creditNoteId', clientauthMiddleware,hasAny({
  permissions: ['view_credit_note']
}), getClientCreditNoteById);


router.get('/carnet-entretien/:vehiculeId', clientauthMiddleware,hasAny({
  permissions: ['view_carnet']
}), getCarnetByVehiculeIdClient);

router.post('/creer-dans-carnet', clientauthMiddleware,hasAny({
  permissions: ['create_carnet']
}), creerCarnetManuelClient);


router.get('/search',clientauthMiddleware,hasAny({
    permissions: ['chercher_garage']
  }), search);




router.get('/mes-ordres',clientauthMiddleware,
  getAllMesOrdres
);

// 🔍 Récupérer un ordre spécifique par ID
router.get('/mes-ordres/:ordreId', clientauthMiddleware,
  getOrdreById
);

// 📊 Statistiques des ordres du client
router.get('/mes-ordres-stats', clientauthMiddleware,
  getOrdreStats
);

router.post('/client/rate-garage', clientauthMiddleware,createRating);
router.get('/client/rating/:ordreId', clientauthMiddleware,getRatingByOrdre);
router.get('/client/garage-ratings/:garageId', clientauthMiddleware,getGarageRatings);

export default router;