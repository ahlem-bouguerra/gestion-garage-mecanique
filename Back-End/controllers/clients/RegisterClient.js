import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Client } from "../../models/Client.js";
import { Role } from "../../models/Role.js";
import { ClientRole } from "../../models/ClientRole.js";
import { sendVerificationEmailForCient } from "../../utils/mailerCLient.js";
<<<<<<< HEAD
=======
import crypto from "crypto"; 
>>>>>>> 19f15ce9 (ajouter la partie avantartie avant login)

export const registerClient = async (req, res) => {
  const { username, email, password, phone } = req.body;

  console.log("📥 Données reçues pour inscription :", req.body);

  if (!username || !email || !password || !phone) {
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

    // ✅ CRÉER UTILISATEUR
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

    // ✅ ATTRIBUER LE RÔLE "CLIENT" AUTOMATIQUEMENT
    try {
      // Recherche flexible du rôle contenant "client" (insensible à la casse)
<<<<<<< HEAD
      const clientRole = await Role.findOne({ 
=======
      const clientRole = await Role.findOne({
>>>>>>> 19f15ce9 (ajouter la partie avantartie avant login)
        name: { $regex: /client/i } // Cherche "client", "Client", "CLIENT", etc.
      });

      if (clientRole) {
        await ClientRole.create({
          clientId: client._id,
          roleId: clientRole._id
        });
        console.log("✅ Rôle 'Client' attribué à l'utilisateur");
      } else {
        console.warn("⚠️ Aucun rôle contenant 'client' trouvé dans la base de données");
      }
    } catch (roleError) {
      console.error("❌ Erreur lors de l'attribution du rôle:", roleError.message);
      // On continue l'inscription même si l'attribution du rôle échoue
    }

<<<<<<< HEAD
    // Token pour vérification email
    const verificationToken = jwt.sign(
      { clientId: client._id, purpose: 'email_verification' }, 
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
=======
    const verificationToken = crypto.randomBytes(32).toString("hex");
    // Sauvegarder le token dans l'utilisateur
    client.verificationToken = verificationToken;
    client.verificationTokenExpiry = Date.now() + 3600000; // 1 heure
    await client.save();
>>>>>>> 19f15ce9 (ajouter la partie avantartie avant login)

    await sendVerificationEmailForCient(email, verificationToken);
    console.log("📧 Email de vérification envoyé à :", email);

<<<<<<< HEAD
    res.status(201).json({ 
      message: "Inscription réussie. Vérifie ton email.",
      clientId: client._id 
=======
    res.status(201).json({
      message: "Inscription réussie. Vérifie ton email.",
      clientId: client._id
>>>>>>> 19f15ce9 (ajouter la partie avantartie avant login)
    });

  } catch (err) {
    console.error("❌ Erreur lors de l'inscription :", err.message);
    console.error("❌ Stack trace:", err.stack);
<<<<<<< HEAD
    res.status(500).json({ 
      message: "Erreur serveur.", 
=======
    res.status(500).json({
      message: "Erreur serveur.",
>>>>>>> 19f15ce9 (ajouter la partie avantartie avant login)
      error: err.message
    });
  }
};