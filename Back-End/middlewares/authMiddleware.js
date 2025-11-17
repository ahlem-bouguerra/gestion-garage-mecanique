import jwt from "jsonwebtoken";
import { Garagiste } from "../models/Garagiste.js";
import { Users } from "../models/Users.js";
import { GaragisteRole } from "../models/GaragisteRole.js";
import { Role } from "../models/Role.js";
import { getUserPermissions } from '../utils/permissionChecker.js'; 

// ========== MIDDLEWARE D'AUTHENTIFICATION PRINCIPAL ==========
export const authMiddleware = async (req, res, next) => {
  try {
    console.log('🔐 AuthMiddleware - Headers:', req.headers.authorization);
    
    const token = req.headers.authorization
    ?.replace(/Bearer\s+/gi, '')  // Retire tous les "Bearer" (insensible à la casse)
    .trim();
    
    if (!token) {
      console.log('❌ Token manquant');
      return res.status(401).json({ message: "Token manquant" });
    }

    // ✅ Décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔓 Token décodé:', {
      userId: decoded.userId,
      email: decoded.email,
      garageId: decoded.garageId
    });

    // ✅ Charger l'utilisateur depuis la base de données avec le garage
    const user = await Garagiste.findById(decoded.userId)
      .populate({
        path: 'garage',
        select: 'nom matriculeFiscal isActive governorateName cityName'
      })
      .lean(); // ⭐ Ajoute .lean() pour de meilleures performances

    if (!user) {
      console.log('❌ Garagiste non trouvé pour ID:', decoded.userId);
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    console.log('🔍 Garage chargé:', user.garage); // ⭐ Debug

    // ✅ Vérifier si le garage existe et est actif
    if (user.garage) {
      if (!user.garage.isActive) {
        console.log('⚠️ Garage désactivé pour:', user.email);
        return res.status(403).json({
          message: "Votre garage est désactivé. Contactez l'administrateur."
        });
      }
    } else {
      console.log('⚠️ Aucun garage associé pour:', user.email);
      // ⭐ Décide si c'est une erreur ou non
      // return res.status(400).json({ message: "Aucun garage associé" });
    }
const permissions = await getUserPermissions(user._id);
    // ✅ Attacher l'utilisateur complet à req.user
    // ⭐ APRÈS (ajoute garageId explicitement)
req.user = {
  ...user,
  garageId: user.garage?._id || null,  // ← Ajoute cette ligne
  permissions

};
    
    console.log('✅ Garagiste authentifié:', {
      id: user._id,
      email: user.email,
      garage: user.garage?.nom || 'Aucun garage',
      garageId: req.user.garageId,  // ← Utilise req.user.garageId maintenant
    });
    
    next();
    
  } catch (error) {
    console.error('❌ Erreur authMiddleware:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Token invalide" });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expiré" });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "ID utilisateur invalide" });
    }
    
    return res.status(500).json({ 
      message: "Erreur serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// ========== MIDDLEWARE POUR SUPER ADMIN ==========
export const superAdminMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: "Token manquant" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ✅ Vérifier si c'est un super admin (model Users)
    const superAdmin = await Users.findById(decoded.userId);
    
    if (!superAdmin || !superAdmin.isSuperAdmin) {
      console.log('❌ Accès refusé: pas un super admin');
      return res.status(403).json({ 
        message: "Accès refusé. Droits super administrateur requis." 
      });
    }

    req.user = superAdmin;
    console.log('✅ Super Admin authentifié:', superAdmin.email);
    
    next();
    
  } catch (error) {
    console.error('❌ Erreur superAdminMiddleware:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token invalide ou expiré" });
    }
    
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// ========== MIDDLEWARE POUR ADMIN DE GARAGE ==========
export const isGarageAdmin = async (req, res, next) => {
  try {
    // req.user est déjà chargé par authMiddleware
    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    // 🔍 Récupérer le rôle du garagiste
    const garagisteRole = await GaragisteRole.findOne({ 
      garagisteId: req.user._id 
    }).populate('roleId');

    if (!garagisteRole) {
      console.log('❌ Aucun rôle trouvé pour cet utilisateur');
      return res.status(403).json({ 
        message: "Aucun rôle assigné" 
      });
    }

    // ✅ Vérifier si le rôle est "Admin Garage"
    if (garagisteRole.roleId.name !== 'Admin Garage') {
      console.log('❌ Accès refusé: utilisateur n\'est pas admin du garage');
      return res.status(403).json({ 
        message: "Accès refusé. Seuls les administrateurs du garage peuvent effectuer cette action." 
      });
    }

    console.log('✅ Admin du garage vérifié:', req.user.email);
    
    // 💡 Optionnel : ajouter le rôle dans req pour utilisation ultérieure
    req.userRole = garagisteRole.roleId;
    
    next();
    
  } catch (error) {
    console.error('❌ Erreur isGarageAdmin:', error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// ========== MIDDLEWARE POUR ADMIN OU EMPLOYÉ ==========
export const isGarageStaff = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const allowedRoles = ['admin', 'employee', 'mechanic'];
    
    if (!allowedRoles.includes(req.user.role)) {
      console.log('❌ Accès refusé: rôle non autorisé');
      return res.status(403).json({ 
        message: "Accès refusé. Vous n'avez pas les droits nécessaires." 
      });
    }

    console.log('✅ Personnel du garage vérifié:', req.user.email, '(', req.user.role, ')');
    next();
    
  } catch (error) {
    console.error('❌ Erreur isGarageStaff:', error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// ========== MIDDLEWARE POUR VÉRIFIER LE MÊME GARAGE ==========
export const isSameGarage = (req, res, next) => {
  try {
    if (!req.user || !req.user.garage) {
      return res.status(403).json({ 
        message: "Vous n'êtes associé à aucun garage" 
      });
    }

    // Récupérer l'ID du garage depuis les params ou le body
    const targetGarageId = req.params.garageId || req.body.garageId;
    
    if (!targetGarageId) {
      return res.status(400).json({ 
        message: "ID du garage manquant dans la requête" 
      });
    }

    // Comparer les IDs
    if (req.user.garage._id.toString() !== targetGarageId.toString()) {
      console.log('❌ Accès refusé: garage différent');
      return res.status(403).json({ 
        message: "Vous ne pouvez accéder qu'aux données de votre garage" 
      });
    }

    console.log('✅ Vérification garage OK');
    next();
    
  } catch (error) {
    console.error('❌ Erreur isSameGarage:', error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};