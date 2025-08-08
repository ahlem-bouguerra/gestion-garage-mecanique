import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { sendVerificationEmail } from "../utils/mailer.js";

export const register = async (req, res) => {
  const { username, email, password, phone } = req.body;

  console.log("📥 Données reçues pour inscription :", req.body);

  if (!username || !email || !password || !phone) {
    console.warn("⚠️ Champs manquants !");
    return res.status(400).json({ message: "Tous les champs sont requis." });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      console.warn("⚠️ Email déjà utilisé :", email);
      return res.status(400).json({ message: "Email déjà utilisé." });
    }

    // Hasher le mot de passe
    const hashed = await bcrypt.hash(password, 10);

    // Créer l'utilisateur (sans token)
    const user = await User.create({
      username,
      email,
      password: hashed,
      phone,
      isVerified: false, // optionnel selon ton schéma
    });

    // Générer le token après que l'utilisateur ait été créé
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Ajouter le token à l'utilisateur
    user.token = token;
    await user.save();

    console.log("✅ Utilisateur créé avec succès :", user.email);

    // Envoyer l'e-mail de vérification
    await sendVerificationEmail(email, token);
    console.log("📧 Email de vérification envoyé à :", email);

    res.status(201).json({ message: "Inscription réussie. Vérifie ton email." });
  } catch (err) {
    console.error("❌ Erreur lors de l'inscription :", err.message);
    res.status(500).json({ message: "Erreur serveur.", error: err.message });
  }
};










