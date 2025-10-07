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
import { getProfile,updateProfile } from "../controllers/clients/profileContoller.js";
import { getMesVehicules, createVehiculeClient, updateMonVehicule, deleteMonVehicule } from "../controllers/clients/vehiculeController.js";
import { getServicesByGarageId } from "../controllers/clients/serviceController.js";
import {getClientProfile} from "../controllers/clients/profileController.js";
import { ClientCreateReservation, ClientGetReservations, ClientUpdateReservation,ClientCancelReservation } from '../controllers/clients/revervationController.js';
import {getClientDevis, getClientDevisById, getClientDevisStats } from '../controllers/clients/clientDevisController.js';

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


router.get('/get-all-mes-vehicules',clientauthMiddleware, getMesVehicules);
router.post('/create-mes-vehicules',clientauthMiddleware, createVehiculeClient);
router.put('/update-mes-vehicules/:vehiculeId',clientauthMiddleware, updateMonVehicule);
router.delete('/delete-mes-vehicules/:vehiculeId',clientauthMiddleware, deleteMonVehicule);

router.get('/services/garage/:garageId', getServicesByGarageId);

router.get("/get-Client-profile",clientauthMiddleware, getClientProfile);

router.post('/create-reservation',clientauthMiddleware, ClientCreateReservation);
router.get('/client-reservations/',clientauthMiddleware, ClientGetReservations);
router.put('/client-update/reservations/:id',clientauthMiddleware, ClientUpdateReservation);
router.put('/cancel-reservation/:reservationId', clientauthMiddleware, ClientCancelReservation);

router.get('/all-mes-devis', clientauthMiddleware, getClientDevis);
router.get('/mes-devis/stats', clientauthMiddleware, getClientDevisStats);
router.get('/mes-devis/:devisId', clientauthMiddleware, getClientDevisById);

export default router;