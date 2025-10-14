import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Client } from "../../models/Client.js";
import { sendVerificationEmailForCient } from "../../utils/mailerCLient.js";


export const registerClient = async (req, res) => {
  const { username,email, password, phone } = req.body;

  console.log("📥 Données reçues pour inscription :", req.body);

  if (!username ||!email || !password || !phone) {
    console.warn("⚠️ Champs manquants !");
    return res.status(400).json({ message: "Tous les champs sont requis." });
  }

  try {
    const existing = await Client.findOne({ email });
    if (existing) {
      console.warn("⚠️ Email déjà utilisé :", email);
      return res.status(400).json({ message: "Email déjà utilisé." });
    }

    const hashed = await bcrypt.hash(password, 10);

    // ✅ CRÉER UTILISATEUR - SANS AUCUNE MENTION DE LOCATION
    const clientData = {
      username,
      email,
      password: hashed,
      phone,
      isVerified: false
    };

    console.log("📦 Données utilisateur à créer:", clientData);

    const client = await Client.create(clientData);

    console.log("✅ Utilisateur créé:", {
      id: client._id,
      email: client.email,
    });

    // Token pour vérification email
    const verificationToken = jwt.sign(
      { clientId: client._id, purpose: 'email_verification' }, 
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    await sendVerificationEmailForCient(email, verificationToken);
    console.log("📧 Email de vérification envoyé à :", email);

    res.status(201).json({ 
      message: "Inscription réussie. Vérifie ton email.",
      clientId: client._id 
    });

  } catch (err) {
    console.error("❌ Erreur lors de l'inscription :", err.message);
    console.error("❌ Stack trace:", err.stack);
    res.status(500).json({ 
      message: "Erreur serveur.", 
      error: err.message
    });
  }
};