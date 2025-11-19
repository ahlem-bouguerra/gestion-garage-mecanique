import jwt from 'jsonwebtoken';
import {Garagiste} from '../models/Garagiste.js';
import { Users } from '../models/Users.js';
import { getUserPermissions } from '../utils/permissionChecker.js';
import {Garage} from '../models/Garage.js'; // Importer le modèle Garage

export const authGaragisteOuSuperAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace(/Bearer\s+/gi, '').trim();

    if (!token) {
      return res.status(401).json({ message: "Token manquant" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // 🔹 Essayer Garagiste
    let user = await Garagiste.findById(userId)
      .populate({
        path: 'garage',
        select: 'nom matriculeFiscal isActive governorateName cityName'
      })
      .lean();

    if (user) {
      const permissions = await getUserPermissions(user._id);

      if (user.garage && !user.garage.isActive) {
        return res.status(403).json({ message: "Votre garage est désactivé" });
      }

      req.user = {
        ...user,
        garage: user.garage?._id || null,  // ⭐ Utiliser "garage" au lieu de "garageId"
        permissions,
        type: 'garagiste'
      };

      console.log('✅ Garagiste authentifié:', user.email, 'Garage:', req.user.garage);
      return next();
    }

    // 🔹 Sinon essayer Super Admin
    const superAdmin = await Users.findById(userId);
    if (superAdmin && superAdmin.isSuperAdmin) {
      
      // ⭐ POUR SUPER ADMIN : récupérer garageId depuis query, body ou params
      const garageId = req.query.garageId || req.body.garageId || req.params.garageId;
      
      if (!garageId) {
        return res.status(400).json({ 
          message: "Super Admin doit spécifier un garageId (dans query, body ou params)" 
        });
      }

      // ✅ Vérifier que le garage existe et est actif
      const garage = await Garage.findById(garageId);
      if (!garage) {
        return res.status(404).json({ message: "Garage non trouvé" });
      }
      
      if (!garage.isActive) {
        return res.status(403).json({ message: "Ce garage est désactivé" });
      }

      req.user = {
        ...superAdmin.toObject(),
        garage: garageId,  // ⭐ Utiliser "garage" comme pour garagiste
        permissions: ['*'],
        type: 'superAdmin'
      };
      
      console.log('✅ Super Admin authentifié:', superAdmin.email, 'Garage cible:', garageId);
      return next();
    }

    // ❌ Aucun accès
    return res.status(403).json({ message: "Accès refusé" });

  } catch (error) {
    console.error('❌ Erreur authGaragisteOuSuperAdmin:', error);

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token invalide ou expiré" });
    }

    return res.status(500).json({ message: "Erreur serveur" });
  }
};