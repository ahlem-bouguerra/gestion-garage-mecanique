import jwt from 'jsonwebtoken';
import {Garagiste} from '../models/Garagiste.js';
import { Users } from '../models/Users.js';
import { GaragisteRole } from '../models/GaragisteRole.js';

export const authGaragisteOuSuperAdmin = async (req, res, next) => {
  try {
    console.log("🔍 Headers reçus:", req.headers.authorization);
    
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.log('❌ Token manquant dans la requête');
      return res.status(401).json({ error: 'Token manquant' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("✅ Token décodé:", decoded);
    } catch (jwtError) {
      console.log('❌ Erreur JWT:', jwtError.message);
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }
    
    // ⭐ FIX : Utiliser userId au lieu de id
    const userId = decoded.userId || decoded.id;
    
    if (!userId) {
      console.log('❌ userId manquant dans le token');
      return res.status(401).json({ error: 'Token invalide : userId manquant' });
    }
    
    // ⭐ Cas 1 : SuperAdmin (Users)
    if (decoded.isSuperAdmin) {
      const user = await Users.findById(userId);  // ⭐ FIX ICI
      
      if (!user) {
        console.log('❌ SuperAdmin non trouvé:', userId);
        return res.status(401).json({ error: 'Utilisateur non trouvé' });
      }
      
      req.user = {
        id: user._id,
        email: user.email,
        role: 'superadmin',
        isSuperAdmin: true,
        garage: null
      };
      
      console.log('✅ SuperAdmin authentifié:', req.user.email);
      return next();
    }
    
    // ⭐ Cas 2 : Garagiste
    const garagiste = await Garagiste.findById(userId);  // ⭐ FIX ICI
    
    if (!garagiste) {
      console.log('❌ Garagiste non trouvé:', userId);
      return res.status(401).json({ error: 'Garagiste non trouvé' });
    }
    
    if (!garagiste.isActive) {
      console.log('❌ Compte désactivé');
      return res.status(403).json({ error: 'Compte désactivé' });
    }
    
    // ⭐ Récupérer les rôles du garagiste
    let roles = [];
    try {
      const garagisteRoles = await GaragisteRole.find({ garagisteId: garagiste._id }).populate('roleId');
      roles = garagisteRoles.map(gr => gr.roleId?.name).filter(Boolean);
    } catch (roleError) {
      console.error('⚠️ Erreur récupération rôles:', roleError);
    }
    
    req.user = {
      id: garagiste._id,
      email: garagiste.email,
      role: 'garagiste',
      roles: roles,
      isSuperAdmin: false,
      garage: garagiste.garage
    };
    
    console.log('✅ Garagiste authentifié:', req.user.email, 'Rôles:', req.user.roles);
    next();
    
  } catch (error) {
    console.error('❌ Erreur serveur auth:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};