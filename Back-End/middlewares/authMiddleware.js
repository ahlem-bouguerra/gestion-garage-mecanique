import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
export const authMiddleware = async (req, res, next) => {
  try {
    console.log('🔐 AuthMiddleware - Headers:', req.headers.authorization);
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ Token manquant');
      return res.status(401).json({ message: "Token manquant" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔓 Token décodé:', { userId: decoded.userId, email: decoded.email });
    
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé pour ID:', decoded.userId);
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    req.user = user;
    console.log('✅ Utilisateur authentifié:', user.email);
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