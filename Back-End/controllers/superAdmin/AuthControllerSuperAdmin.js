import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Users } from "../../models/Users.js";
import { sendVerificationEmailForCient } from "../../utils/mailerSuperAdmin.js";

// ========== INSCRIPTION SUPER ADMIN ==========
export const registerSuperAdmin = async (req, res) => {
  const { username, email, password, phone } = req.body;
  
  console.log("📥 Inscription Super Admin:", { username, email });
  
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
    
    // Créer le super admin
    const newAdmin = await Users.create({
      username,
      email,
      password: hashedPassword,
      phone,
      isVerified: false,
      isSuperAdmin: true
    });
    
    console.log("✅ Super admin créé:", {
      id: newAdmin._id,
      email: newAdmin.email
    });
    
    // Envoyer l'email de vérification
    const verificationToken = jwt.sign(
      { 
        userId: newAdmin._id, 
        purpose: 'email_verification' 
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    
    await sendVerificationEmailForCient(email, verificationToken);
    console.log("📧 Email de vérification envoyé à:", email);
    
    res.status(201).json({
      message: "Super admin créé avec succès. Vérifiez votre email.",
      userId: newAdmin._id
    });
    
  } catch (error) {
    console.error("❌ Erreur inscription super admin:", error);
    res.status(500).json({ 
      message: "Erreur serveur", 
      error: error.message 
    });
  }
};

// ========== LOGIN SUPER ADMIN ==========
export const loginSuperAdmin = async (req, res) => {
  const { email, password } = req.body;
  
  console.log("🔐 Tentative de connexion Super Admin:", email);
  
  try {
    // Trouver le super admin
    const admin = await Users.findOne({ email });
    
    if (!admin) {
      return res.status(401).json({ 
        message: "Email ou mot de passe incorrect" 
      });
    }
    
    if (!admin.isSuperAdmin) {
      return res.status(403).json({ 
        message: "Vous n'êtes pas autorisé à accéder à cette interface." 
      });
    }
    
    if (!admin.isVerified) {
      return res.status(403).json({ 
        message: "Compte non vérifié. Vérifiez votre email." 
      });
    }
    
    // Vérifier le mot de passe
    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      return res.status(401).json({ 
        message: "Email ou mot de passe incorrect" 
      });
    }
    
    // Générer le token
    const token = jwt.sign(
      {
        userId: admin._id,
        email: admin.email,
        isSuperAdmin: admin.isSuperAdmin
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log("✅ Super admin connecté:", admin.email);
    
    res.json({
      message: "Connexion réussie",
      token,
      user: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        phone: admin.phone,
        isSuperAdmin: admin.isSuperAdmin
      }
    });
    
  } catch (error) {
    console.error("❌ Erreur login super admin:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ========== LOGOUT SUPER ADMIN ==========
export const logoutSuperAdmin = async (req, res) => {
  try {
    // Le logout se fait côté client en supprimant le token
    console.log("✅ Super admin déconnecté:", req.user?.email);
    
    res.json({
      message: "Déconnexion réussie"
    });
    
  } catch (error) {
    console.error("❌ Erreur logout super admin:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

