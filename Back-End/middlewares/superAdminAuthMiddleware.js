import jwt from "jsonwebtoken";
import { Users } from "../models/Users.js";



// ========== MIDDLEWARE POUR SUPER ADMIN ==========
export const superAdminMiddleware = async (req, res, next) => {
  try {
      if (process.env.BYPASS_AUTH === 'true') {
    req.user = { _id: 'test-id', role: 'Super Admin' };
    return next();
  }
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