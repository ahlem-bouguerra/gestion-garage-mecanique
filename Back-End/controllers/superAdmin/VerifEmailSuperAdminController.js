import {Users} from '../../models/Users.js';
import jwt from "jsonwebtoken";
import crypto from "crypto";


export const verifEmailSuperAdmin = async (req, res) => {
  const token = req.params.token;

  try {

        const user = await Users.findOne({
          verificationToken: token,
          verificationTokenExpiry: { $gt: Date.now() }
        });
    
    if (!user) {
      console.log("❌ Utilisateur non trouvé pour la vérification");
      return res.redirect(`${process.env.FRONTEND_URL_SUPERADMIN}/auth/sign-in?error=user_not_found`);
    }

    // Vérifier si déjà vérifié
    if (user.isVerified) {
      console.log("ℹ️ Compte déjà vérifié pour:", user.email);
      return res.redirect(`${process.env.FRONTEND_URL_SUPERADMIN}/auth/sign-in?verified=already`);
    }

    // ✅ MARQUER COMME VÉRIFIÉ
    user.isVerified = true;

    user.verificationToken = null;
    user.verificationTokenExpiry = null;

    await user.save();

    console.log("✅ Email vérifié avec succès pour:", user.email);
    
    // ✅ REDIRECTION VERS LE FRONTEND AVEC PARAMÈTRE DE SUCCÈS
    return res.redirect(`${process.env.FRONTEND_URL_SUPERADMIN}/auth/sign-in?verified=true`);

  } catch (error) {
    console.error("❌ Erreur lors de la vérification de l'email :", error);
    return res.redirect(`${process.env.FRONTEND_URL_SUPERADMIN}/auth/sign-in?error=verification_failed`);
  }
};