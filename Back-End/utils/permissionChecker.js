import { GaragisteRole } from "../models/GaragisteRole.js";
import { RolePermission } from "../models/RolePermission.js";
import { GaragistePermission } from "../models/GaragistePermission.js";
import { Users } from '../models/Users.js';
import { Garagiste } from '../models/Garagiste.js';
import { UserRole } from "../models/UserRole.js";

/**
 * Récupère toutes les permissions d'un garagiste
 */
export const getUserPermissions = async (garagisteId) => {
  const permissions = new Set();
  try {
    // Permissions individuelles
    const individualPerms = await GaragistePermission.find({ GaragisteId: garagisteId })
      .populate('permissionId');
    individualPerms.forEach(ip => ip.permissionId?.name && permissions.add(ip.permissionId.name));

    // Permissions via rôles
    const garagisteRoles = await GaragisteRole.find({ garagisteId }).populate('roleId');
    const roleIds = garagisteRoles.map(gr => gr.roleId._id);
    const rolePermissions = await RolePermission.find({ roleId: { $in: roleIds } })
      .populate('permissionId');
    rolePermissions.forEach(rp => rp.permissionId?.name && permissions.add(rp.permissionId.name));

    return Array.from(permissions);
  } catch (error) {
    console.error('❌ Erreur getUserPermissions:', error);
    return [];
  }
};

/**
 * Middleware pour vérifier si un utilisateur a un rôle OU une permission
 */
export const hasAny = ({ roles = [], permissions = [] }) => {
  return async (req, res, next) => {
    try {
      // Bypass pour développement
      if (process.env.BYPASS_AUTH === 'true') return next();

      let userRoles = [];
      let userPermissions = [];
      let isSuperAdmin = false;
      let userId = null;

      // --- Cas client ---
      if (req.client && req.client._id) {
        userId = req.client._id;
        userRoles = req.client.roles || [];
        userPermissions = req.client.permissions || [];
        console.log('👥 Client:', userId, userRoles, userPermissions);
      }
      // --- Cas garagiste / user ---
      else if (req.user && req.user._id) {
        userId = req.user._id;

        // Vérifier si garagiste
        const garagiste = await Garagiste.findById(userId);
        let userEntity = garagiste || await Users.findById(userId);

        if (!userEntity) {
          return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
        }

        // Super Admin (user)
        if (!garagiste && userEntity.isSuperAdmin) {
          req.userRole = 'Super Admin';
          req.permissions = ['*'];
          req.isSuperAdmin = true;
          return next();
        }

        // Récupérer rôles et permissions
        if (garagiste) {
          const garagisteRoles = await GaragisteRole.find({ garagisteId: userId }).populate('roleId');
          if (!garagisteRoles.length) {
            return res.status(403).json({ success: false, message: 'Aucun rôle assigné' });
          }

          userRoles = garagisteRoles.map(gr => gr.roleId.name).filter(Boolean);
          userPermissions = await getUserPermissions(userId);
        } else {
          const userRolesData = await UserRole.find({ userId }).populate('roleId');
          if (!userRolesData.length) {
            return res.status(403).json({ success: false, message: 'Aucun rôle assigné' });
          }

          userRoles = userRolesData.map(ur => ur.roleId.name).filter(Boolean);

          // Permissions via rôles
          const roleIds = userRolesData.map(ur => ur.roleId._id);
          const rolePermissions = await RolePermission.find({ roleId: { $in: roleIds } }).populate('permissionId');
          userPermissions = rolePermissions.map(rp => rp.permissionId?.name).filter(Boolean);
        }
      }
      // --- Non authentifié ---
      else {
        return res.status(401).json({ success: false, message: 'Utilisateur non authentifié' });
      }

      // Normalisation
      const normalize = str => str.trim().toLowerCase();
      const normalizedUserRoles = userRoles.map(normalize);
      const normalizedUserPerms = userPermissions.map(normalize);
      const normalizedRoles = roles.map(normalize);
      const normalizedPerms = permissions.map(normalize);

      // Vérification RÔLE OU PERMISSION
      const hasRole = normalizedRoles.some(r => normalizedUserRoles.includes(r));
      const hasPerm = normalizedPerms.some(p => normalizedUserPerms.includes(p));
      const hasAccess = hasRole || hasPerm;

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé : rôle ou permission requis',
          required: { roles, permissions },
          userRoles,
          userPermissions
        });
      }

      // Ajouter info dans req
      req.userRole = userRoles[0];
      req.permissions = userPermissions;
      req.isSuperAdmin = isSuperAdmin || false;

      next();

    } catch (error) {
      console.error('❌ Erreur hasAny:', error);
      return res.status(500).json({ success: false, message: 'Erreur lors de la vérification des accès' });
    }
  };
};

export default { hasAny };
