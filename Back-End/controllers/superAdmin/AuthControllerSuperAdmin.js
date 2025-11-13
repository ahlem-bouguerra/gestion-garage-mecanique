import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Users } from "../../models/Users.js";
import { sendVerificationEmailForCient } from "../../utils/mailerSuperAdmin.js";

// ========== INSCRIPTION UTILISATEUR PUBLIC (NON SUPER ADMIN) ==========
export const registerUser = async (req, res) => {
  const { username, email, password, phone } = req.body;
  
  console.log("📥 Inscription utilisateur:", { username, email });
  
  // ✅ SÉCURITÉ : Bloquer toute tentative de se créer en tant que SuperAdmin
  if (req.body.isSuperAdmin || req.body.isSuperAdmin === true) {
    console.warn("⚠️ Tentative de création SuperAdmin bloquée:", email);
    return res.status(403).json({ 
      message: "Impossible de se créer en tant que SuperAdmin" 
    });
  }
  
  if (!username || !email || !password || !phone) {
    return res.status(400).json({ 
      message: "Tous les champs sont requis." 
    });
  }
  
  try {
    // Vérifier si l'email existe déjà
    const existing = await Users.findOne({ email });
    if (existing) {
      console.warn("⚠️ Email déjà utilisé:", email);
      return res.status(400).json({ 
        message: "Cet email est déjà utilisé." 
      });
    }
    
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // ✅ Créer l'utilisateur NORMAL (isSuperAdmin: false forcé)
    const newUser = await Users.create({
      username,
      email,
      password: hashedPassword,
      phone,
      isVerified: false,
      isSuperAdmin: false // ✅ FORCÉ À FALSE
    });
    
    console.log("✅ Utilisateur créé:", {
      id: newUser._id,
      email: newUser.email,
      isSuperAdmin: newUser.isSuperAdmin // devrait être false
    });
    
    // Envoyer l'email de vérification
    const verificationToken = jwt.sign(
      { 
        userId: newUser._id, 
        purpose: 'email_verification' 
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    
    await sendVerificationEmailForCient(email, verificationToken);
    console.log("📧 Email de vérification envoyé à:", email);
    
    res.status(201).json({
      message: "Compte créé avec succès. Vérifiez votre email.",
      userId: newUser._id
    });
    
  } catch (error) {
    console.error("❌ Erreur inscription utilisateur:", error);
    res.status(500).json({ 
      message: "Erreur serveur", 
      error: error.message 
    });
  }
};

// ========== LOGIN (UTILISATEURS ET SUPER ADMINS) ==========
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  
  console.log("🔐 Tentative de connexion:", email);
  
  try {
    // Trouver l'utilisateur
    const user = await Users.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ 
        message: "Email ou mot de passe incorrect" 
      });
    }
    
    if (!user.isVerified) {
      return res.status(403).json({ 
        message: "Compte non vérifié. Vérifiez votre email." 
      });
    }

    if (!user.isSuperAdmin) {
      return res.status(403).json({ 
        message: "Role non autorisé. Accès réservé aux Super Admins." 
      });
    }
    
    // Vérifier le mot de passe
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ 
        message: "Email ou mot de passe incorrect" 
      });
    }
    
    // Générer le token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin // peut être true ou false
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log("✅ Utilisateur connecté:", {
      email: user.email,
      isSuperAdmin: user.isSuperAdmin
    });
    
    res.json({
      message: "Connexion réussie",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        isSuperAdmin: user.isSuperAdmin
      }
    });
    
  } catch (error) {
    console.error("❌ Erreur login:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ========== LOGOUT ==========
export const logoutUser = async (req, res) => {
  try {
    console.log("✅ Utilisateur déconnecté:", req.user?.email);
    
    res.json({
      message: "Déconnexion réussie"
    });
    
  } catch (error) {
    console.error("❌ Erreur logout:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ========== PROMOUVOIR UN UTILISATEUR EN SUPER ADMIN (PROTÉGÉ) ==========
export const promoteToSuperAdmin = async (req, res) => {
  try {
    // ✅ Vérifier que l'utilisateur qui fait la demande est bien SuperAdmin
    if (!req.user?.isSuperAdmin) {
      console.warn("⚠️ Tentative de promotion par non-SuperAdmin:", req.user?.email);
      return res.status(403).json({ 
        message: "Accès refusé. Vous devez être SuperAdmin." 
      });
    }

    const { id } = req.params; // ID de l'utilisateur à promouvoir
    
    const user = await Users.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    // ✅ Vérifier que l'email est vérifié avant promotion
    if (!user.isVerified) {
      return res.status(400).json({ 
        message: "L'utilisateur doit vérifier son email avant d'être promu" 
      });
    }

    // ✅ Vérifier si déjà SuperAdmin
    if (user.isSuperAdmin) {
      return res.status(400).json({ 
        message: "Cet utilisateur est déjà SuperAdmin" 
      });
    }

    // ✅ Promouvoir
    user.isSuperAdmin = true;
    await user.save();

    console.log("✅ Utilisateur promu SuperAdmin:", {
      promotedBy: req.user.email,
      promotedUser: user.email
    });

    res.json({ 
      message: "Utilisateur promu SuperAdmin avec succès",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin
      }
    });
    
  } catch (err) {
    console.error("❌ Erreur promotion:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ========== RÉTROGRADER UN SUPER ADMIN (PROTÉGÉ) ==========
export const demoteSuperAdmin = async (req, res) => {
  try {
    // ✅ Vérifier que l'utilisateur qui fait la demande est bien SuperAdmin
    if (!req.user?.isSuperAdmin) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const { id } = req.params;
    
    const user = await Users.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    // ✅ Empêcher la rétrogradation du dernier SuperAdmin
    const totalSuperAdmins = await Users.countDocuments({ isSuperAdmin: true });
    if (user.isSuperAdmin && totalSuperAdmins <= 1) {
      return res.status(400).json({ 
        message: "Impossible de rétrograder le dernier SuperAdmin" 
      });
    }

    // ✅ Rétrograder
    user.isSuperAdmin = false;
    await user.save();

    console.log("✅ SuperAdmin rétrogradé:", {
      demotedBy: req.user.email,
      demotedUser: user.email
    });

    res.json({ 
      message: "SuperAdmin rétrogradé avec succès",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin
      }
    });
    
  } catch (err) {
    console.error("❌ Erreur rétrogradation:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await Users.find().sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des users.", error: error.message });
  }
};
