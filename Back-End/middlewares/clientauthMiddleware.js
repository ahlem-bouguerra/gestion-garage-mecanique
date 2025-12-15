import jwt from "jsonwebtoken";
import { Client } from "../models/Client.js";

export const clientauthMiddleware = async (req, res, next) => {
  try {
    console.log('🔐 AuthMiddleware - Headers:', req.headers.authorization);
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ Token manquant');
      return res.status(401).json({ message: "Token manquant" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔓 Token décodé:', {
      clientId: decoded.clientId,
      email: decoded.email,
      roles: decoded.roles,
      permissions: decoded.permissions  // ✅ Log les permissions
    });

    const user = await Client.findById(decoded.clientId);
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé pour ID:', decoded.clientId);
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // ✅ Ajouter l'utilisateur ET ses permissions dans req.client
    req.client = {
      ...user.toObject(),
      roles: decoded.roles || [],
      permissions: decoded.permissions || []  // ✅ Ajouter les permissions
    };
    
    console.log('✅ Utilisateur authentifié:', user.email);
    console.log('🔑 Permissions actives:', req.client.permissions);
    
    next();

  } catch (error) {
    console.error('❌ Erreur authMiddleware:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Token invalide" });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expiré" });
    }
    
    return res.status(500).json({ message: "Erreur serveur" });
  }
};