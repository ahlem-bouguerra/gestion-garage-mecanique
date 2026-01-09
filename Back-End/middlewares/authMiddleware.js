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

    // ✅ Déterminer le garageId (peut venir du populate ou directement du champ garage)
    let garageId = null;
    if (user.garage) {
      // Si le populate a fonctionné, user.garage est un objet
      garageId = user.garage._id || user.garage;
      // Vérifier si le garage est actif
      if (user.garage.isActive === false) {
        console.log('⚠️ Garage désactivé pour:', user.email);
        return res.status(403).json({
          message: "Votre garage est désactivé. Contactez l'administrateur."
        });
      }
    } else if (user.garage) {
      // Si le populate n'a pas fonctionné mais que le champ garage existe (ObjectId)
      garageId = user.garage;
    }

    console.log('🔍 garageId déterminé:', garageId);

    const permissions = await getUserPermissions(user._id);
    
    // ✅ Attacher l'utilisateur complet à req.user
    req.user = {
      ...user,
      garageId: garageId,  // ← Utilise le garageId déterminé
      permissions
    };
    
    console.log('✅ Garagiste authentifié:', {
      id: user._id,
      email: user.email,
      garage: user.garage?.nom || 'Aucun garage',
      garageId: req.user.garageId,
      garageField: user.garage,  // Debug: voir ce que contient le champ garage
      garageType: typeof user.garage
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

