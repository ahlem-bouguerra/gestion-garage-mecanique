import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Garagiste } from "../../models/Garagiste.js";
import { sendVerificationEmail } from "../../utils/mailer.js";


export const register = async (req, res) => {
  const { username,garagenom,matriculefiscal, email, password, phone } = req.body;

  console.log("📥 Données reçues pour inscription :", req.body);

  if (!username ||!garagenom || !matriculefiscal || !email || !password || !phone) {
    console.warn("⚠️ Champs manquants !");
    return res.status(400).json({ message: "Tous les champs sont requis." });
  }

  try {
    const existing = await Garagiste.findOne({ email });
    if (existing) {
      console.warn("⚠️ Email déjà utilisé :", email);
      return res.status(400).json({ message: "Email déjà utilisé." });
    }

    const hashed = await bcrypt.hash(password, 10);

    // ✅ CRÉER UTILISATEUR - SANS AUCUNE MENTION DE LOCATION
    const userData = {
      username,
      garagenom,
      matriculefiscal,
      email,
      password: hashed,
      phone,
      isVerified: false
      // ❌ ABSOLUMENT RIEN sur location
    };

    console.log("📦 Données utilisateur à créer:", userData);

    const user = await Garagiste.create(userData);

    console.log("✅ Utilisateur créé:", {
      id: user._id,
      email: user.email,
      hasLocation: !!user.location
    });

    // Token pour vérification email
    const verificationToken = jwt.sign(
      { userId: user._id, purpose: 'email_verification' }, 
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    await sendVerificationEmail(email, verificationToken);
    console.log("📧 Email de vérification envoyé à :", email);

    res.status(201).json({ 
      message: "Inscription réussie. Vérifie ton email.",
      userId: user._id 
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