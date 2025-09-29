import {Client} from '../models/Client.js';
import jwt from "jsonwebtoken";

export const verifEmailCLient = async (req, res) => {
  const token = req.params.token;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const client = await Client.findById(decoded.clientId);
    
    if (!client) {
      console.log("❌ Utilisateur non trouvé pour la vérification");
      return res.redirect(`${process.env.FRONTEND_URL}/auth/sign-in?error=user_not_found`);
    }

    // Vérifier si déjà vérifié
    if (client.isVerified) {
      console.log("ℹ️ Compte déjà vérifié pour:", client.email);
      return res.redirect(`${process.env.FRONTEND_URL}/auth/sign-in?verified=already`);
    }

    // ✅ MARQUER COMME VÉRIFIÉ
    client.isVerified = true;
    client.token = undefined;
    await client.save();

    console.log("✅ Email vérifié avec succès pour:", client.email);
    
    // ✅ REDIRECTION VERS LE FRONTEND AVEC PARAMÈTRE DE SUCCÈS
    return res.redirect(`${process.env.FRONTEND_URL}/auth/sign-in?verified=true`);

  } catch (error) {
    console.error("❌ Erreur lors de la vérification de l'email :", error);
    return res.redirect(`${process.env.FRONTEND_URL}/auth/sign-in?error=verification_failed`);
  }
};