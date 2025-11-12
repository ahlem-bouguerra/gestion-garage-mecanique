import jwt from "jsonwebtoken";
import { Users } from "../models/Users.js";

// Middleware pour vérifier que l'utilisateur est un super admin
export const adminAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: "Token manquant ou invalide" 
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Récupérer le super admin
    const admin = await Users.findById(decoded.userId).select('-password');
    
    if (!admin) {
      return res.status(404).json({ 
        message: "Super admin non trouvé" 
      });
    }
    
    if (!admin.isSuperAdmin) {
      return res.status(403).json({ 
        message: "Accès refusé. Vous n'êtes pas super admin." 
      });
    }
    
    if (!admin.isVerified) {
      return res.status(403).json({ 
        message: "Compte non vérifié" 
      });
    }
    
    // Ajouter les infos à la requête
    req.user = {
      userId: admin._id,
      email: admin.email,
      username: admin.username,
      isSuperAdmin: admin.isSuperAdmin
    };
    
    next();
    
  } catch (error) {
    console.error('❌ Erreur adminAuthMiddleware:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Token invalide" });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expiré" });
    }
    
    return res.status(500).json({ message: "Erreur serveur" });
  }
};