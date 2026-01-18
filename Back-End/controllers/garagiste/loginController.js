import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Garagiste } from '../../models/Garagiste.js';
import { Garage } from '../../models/Garage.js';
import { GaragisteRole } from "../../models/GaragisteRole.js";
import { RolePermission } from "../../models/RolePermission.js";
import { Role } from "../../models/Role.js";
import { Permission } from "../../models/Permission.js";

export const login = async (req, res) => {
  console.log("🔐 Login appelé");
  const { email, password } = req.body;

  try {
    // 1️⃣ Trouver le garagiste et peupler le garage
    const garagiste = await Garagiste.findOne({ email })
      .populate('garage', 'nom matriculeFiscal governorateName cityName streetAddress location horaires services isActive');

    if (!garagiste) return res.status(401).json({ message: "Utilisateur non trouvé" });

    // 2️⃣ Vérifications
    if (!garagiste.isVerified) return res.status(403).json({ message: "Compte non vérifié." });
    if (!garagiste.isActive) return res.status(403).json({ message: "Compte non actif." });
    if (!password) return res.status(401).json({ message: "Mot de passe requis" });

    const passwordMatch = await bcrypt.compare(password, garagiste.password);
    if (!passwordMatch) return res.status(401).json({ message: "Mot de passe incorrect" });

    if (garagiste.garage && !garagiste.garage.isActive) {
      return res.status(403).json({ message: "Votre garage est désactivé." });
    }

    console.log('👤 Garagiste ID:', garagiste._id);
    console.log('👤 Garagiste ID type:', typeof garagiste._id);

    // 3️⃣ Récupérer les rôles du garagiste avec populate
    const garagisteRoles = await GaragisteRole.find({ 
      garagisteId: garagiste._id 
    }).populate('roleId').lean();

    console.log('🔍 GaragisteRoles trouvés:', garagisteRoles.length);
    console.log('🔍 Premier GaragisteRole:', JSON.stringify(garagisteRoles[0], null, 2));

    if (garagisteRoles.length === 0) {
      console.log('⚠️ Aucun rôle trouvé pour ce garagiste');
    }

    // 4️⃣ Extraire les rôles populés
    const roles = garagisteRoles
      .filter(gr => gr.roleId) // Filtrer les rôles null
      .map(gr => ({
        id: gr.roleId._id,
        name: gr.roleId.name,
        description: gr.roleId.description
      }));

    console.log('✅ Rôles extraits:', roles);

    // 5️⃣ Récupérer les IDs des rôles
    const roleIds = garagisteRoles
      .filter(gr => gr.roleId)
      .map(gr => gr.roleId._id);

    console.log('🎭 RoleIds pour permissions:', roleIds);

    // 6️⃣ Récupérer les permissions via RolePermission avec populate
    const rolePermissions = await RolePermission.find({ 
      roleId: { $in: roleIds } 
    }).populate('permissionId').lean();

    console.log('🔑 RolePermissions trouvées:', rolePermissions.length);
    console.log('🔑 Premier RolePermission:', JSON.stringify(rolePermissions[0], null, 2));

    // 7️⃣ Extraire les permissions uniques
    const permissions = [...new Set(
      rolePermissions
        .filter(rp => rp.permissionId)
        .map(rp => rp.permissionId.name)
    )];

    console.log('🎯 Permissions finales:', permissions);

    // 8️⃣ Générer le token JWT
    const token = jwt.sign(
      { 
        userId: garagiste._id,
        email: garagiste.email,
        garageId: garagiste.garage?._id || null,
        roles: roles.map(r => r.name),
        permissions
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // 9️⃣ Réponse
    res.json({
      message: "Connexion réussie",
      token,
      user: {
        id: garagiste._id,
        username: garagiste.username,
        email: garagiste.email,
        phone: garagiste.phone,
        img: garagiste.img || "/images/user/user-03.png",
        garage: garagiste.garage ? {
          id: garagiste.garage._id,
          nom: garagiste.garage.nom,
          matriculeFiscal: garagiste.garage.matriculeFiscal,
          governorateName: garagiste.garage.governorateName,
          cityName: garagiste.garage.cityName,
          streetAddress: garagiste.garage.streetAddress,
          location: garagiste.garage.location,
          horaires: garagiste.garage.horaires,
          services: garagiste.garage.services,
          isActive: garagiste.garage.isActive
        } : null,
        roles,
        permissions
      }
    });

  } catch (error) {
    console.error('❌ Erreur login:', error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Header Authorization manquant",
      });
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token manquant",
      });
    }

    // ✅ Vérification du token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("✅ Token valide pour utilisateur:", decoded.userId);
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: "Token invalide",
      });
    }

    // ✅ Réponse au client
    res.status(200).json({
      success: true,
      message: "Déconnexion réussie. Supprimez le token côté client.",
    });

  } catch (error) {
    console.error("❌ Erreur dans logout:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la déconnexion",
      error: error.message,
    });
  }
};