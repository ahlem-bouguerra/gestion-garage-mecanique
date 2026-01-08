import {Client} from '../../models/Client.js';


export const verifEmailCLient = async (req, res) => {
  const token = req.params.token;

  try {

    // ✅ REMPLACER jwt.verify par une recherche en base
    const client = await Client.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: Date.now() }
    });

    if (!client) {
      console.log("❌ Token invalide ou expiré");
      return res.redirect(`${process.env.FRONTEND_URL_CLIENT}/auth/sign-in?error=invalid_token`);
    }

    if (client.isVerified) {
      console.log("ℹ️ Compte déjà vérifié pour:", client.email);
      return res.redirect(`${process.env.FRONTEND_URL_CLIENT}/auth/sign-in?verified=already`);
    }

    // ✅ Marquer comme vérifié et supprimer le token
    client.isVerified = true;
    client.verificationToken = null;
    client.verificationTokenExpiry = null;
    await client.save();

    console.log("✅ Email vérifié avec succès pour:", client.email);
    return res.redirect(`${process.env.FRONTEND_URL_CLIENT}/auth/sign-in?verified=true`);

  } catch (error) {
    console.error("❌ Erreur lors de la vérification de l'email :", error);
    return res.redirect(`${process.env.FRONTEND_URL_CLIENT}/auth/sign-in?error=verification_failed`);
  }
};