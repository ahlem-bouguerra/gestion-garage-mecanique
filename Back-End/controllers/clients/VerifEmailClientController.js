import {Client} from '../../models/Client.js';
<<<<<<< HEAD
import jwt from "jsonwebtoken";
=======

>>>>>>> 19f15ce9 (ajouter la partie avantartie avant login)

export const verifEmailCLient = async (req, res) => {
  const token = req.params.token;

  try {
<<<<<<< HEAD
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const client = await Client.findById(decoded.clientId);
    
    if (!client) {
      console.log("❌ Utilisateur non trouvé pour la vérification");
      return res.redirect(`${process.env.FRONTEND_URL_CLIENT}/auth/sign-in?error=user_not_found`);
    }

    // Vérifier si déjà vérifié
=======
    // ✅ REMPLACER jwt.verify par une recherche en base
    const client = await Client.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: Date.now() }
    });

    if (!client) {
      console.log("❌ Token invalide ou expiré");
      return res.redirect(`${process.env.FRONTEND_URL_CLIENT}/auth/sign-in?error=invalid_token`);
    }

>>>>>>> 19f15ce9 (ajouter la partie avantartie avant login)
    if (client.isVerified) {
      console.log("ℹ️ Compte déjà vérifié pour:", client.email);
      return res.redirect(`${process.env.FRONTEND_URL_CLIENT}/auth/sign-in?verified=already`);
    }

<<<<<<< HEAD
    // ✅ MARQUER COMME VÉRIFIÉ
    client.isVerified = true;
    client.token = undefined;
    await client.save();

    console.log("✅ Email vérifié avec succès pour:", client.email);
    
    // ✅ REDIRECTION VERS LE FRONTEND AVEC PARAMÈTRE DE SUCCÈS
=======
    // ✅ Marquer comme vérifié et supprimer le token
    client.isVerified = true;
    client.verificationToken = null;
    client.verificationTokenExpiry = null;
    await client.save();

    console.log("✅ Email vérifié avec succès pour:", client.email);
>>>>>>> 19f15ce9 (ajouter la partie avantartie avant login)
    return res.redirect(`${process.env.FRONTEND_URL_CLIENT}/auth/sign-in?verified=true`);

  } catch (error) {
    console.error("❌ Erreur lors de la vérification de l'email :", error);
    return res.redirect(`${process.env.FRONTEND_URL_CLIENT}/auth/sign-in?error=verification_failed`);
  }
};