import { Garagiste } from "../../models/Garagiste.js";
import { Garage } from "../../models/Garage.js";
import { Role } from "../../models/Role.js";
import { GaragisteRole } from "../../models/GaragisteRole.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendVerificationEmail } from "../../utils/mailer.js"; // Ajuste le chemin

export const createEmploye = async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;
    
    // ✅ Récupérer le garagiste connecté (admin)
    const adminGaragiste = req.user; // Vient de authMiddleware
    
    console.log('📥 Création employé par:', {
      admin: adminGaragiste.email,
      garage: adminGaragiste.garage?.nom
    });

    // ✅ Validation des champs
    if (!username || !email || !password || !phone) {
      return res.status(400).json({
        message: "Tous les champs sont obligatoires",
        required: ["username", "email", "password", "phone"]
      });
    }

    // ✅ Vérifier que l'admin a bien un garage
    if (!adminGaragiste.garage) {
      return res.status(400).json({
        message: "Vous n'êtes pas associé à un garage"
      });
    }

    // ✅ Vérifier que c'est bien l'admin du garage
    const garage = await Garage.findById(adminGaragiste.garage._id);
    if (!garage) {
      return res.status(404).json({ message: "Garage non trouvé" });
    }

    if (garage.garagisteAdmin.toString() !== adminGaragiste._id.toString()) {
      return res.status(403).json({
        message: "Seul l'admin du garage peut ajouter des employés"
      });
    }

    // ✅ Vérifier si l'email existe déjà
    const existingGaragiste = await Garagiste.findOne({ email });
    if (existingGaragiste) {
      return res.status(400).json({
        message: "Cet email est déjà utilisé"
      });
    }

    // ✅ Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Créer le nouvel employé
    const newEmploye = await Garagiste.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      phone: phone.trim(),
      garage: garage._id, // ⭐ Associé au même garage que l'admin
      isVerified: false,
      isActive: true,
      createdBy: adminGaragiste._id // Créé par l'admin
    });

    console.log('✅ Employé créé:', {
      id: newEmploye._id,
      email: newEmploye.email,
      garage: garage.nom
    });

    // ✅ Assigner le rôle "Employé Garage"
    const employeRole = await Role.findOne({ name: "Employé Garage" });
    if (!employeRole) {
      console.warn('⚠️ Rôle "Employé Garage" non trouvé, création en cours...');
      
    
    } else {
      await GaragisteRole.create({
        garagisteId: newEmploye._id,
        roleId: employeRole._id
      });
    }

    console.log('✅ Rôle "Employé Garage" assigné');

    // ✅ Envoyer l'email de vérification
    const verificationToken = jwt.sign(
      { 
        userId: newEmploye._id, 
        purpose: 'email_verification' 
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    await sendVerificationEmail(email, verificationToken);
    console.log('📧 Email de vérification envoyé à:', email);

    // ✅ Réponse
    res.status(201).json({
      message: "Employé créé avec succès. Email de vérification envoyé.",
      employe: {
        id: newEmploye._id,
        username: newEmploye.username,
        email: newEmploye.email,
        phone: newEmploye.phone,
        garage: {
          id: garage._id,
          nom: garage.nom
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur createEmploye:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Cet email est déjà utilisé"
      });
    }

    res.status(500).json({
      message: "Erreur serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};