import { GaragisteRole } from "../models/GaragisteRole.js";
import { RolePermission } from "../models/RolePermission.js";
import { GaragistePermission } from "../models/GaragistePermission.js";

/**
 * Récupère toutes les permissions d'un garagiste
 * @param {string} garagisteId 
 * @returns {Promise<string[]>} Liste des noms de permissions
 */
export const getUserPermissions = async (garagisteId) => {
  const permissions = new Set();

  try {
    // 1️⃣ Permissions individuelles (exceptions)
    const individualPerms = await GaragistePermission.find({
      GaragisteId: garagisteId
    }).populate('permissionId');

    individualPerms.forEach(ip => {
      if (ip.permissionId?.name) {
        permissions.add(ip.permissionId.name);
      }
    });

    // 2️⃣ Permissions via rôles
    const garagisteRoles = await GaragisteRole.find({ garagisteId })
      .populate('roleId');

    const roleIds = garagisteRoles.map(gr => gr.roleId._id);
    
    const rolePermissions = await RolePermission.find({
      roleId: { $in: roleIds }
    }).populate('permissionId');

    rolePermissions.forEach(rp => {
      if (rp.permissionId?.name) {
        permissions.add(rp.permissionId.name);
      }
    });

    return Array.from(permissions);
  } catch (error) {
    console.error('❌ Erreur getUserPermissions:', error);
    return [];
  }
};

/**
 * Vérifie si l'utilisateur a UNE permission spécifique
 * @param {Object} user - req.user (avec permissions chargées)
 * @param {string} permissionName 
 * @returns {boolean}
 */
export const hasPermission = (user, permissionName) => {
  if (!user || !user.permissions) {
    console.log('❌ Aucune permission chargée');
    return false;
  }

  // ⭐ Super Admin bypass
  if (user.permissions.includes('super_admin')) {
    console.log('✅ Super Admin - Accès total');
    return true;
  }

  const hasAccess = user.permissions.includes(permissionName);
  console.log(`🔐 Permission "${permissionName}":`, hasAccess ? '✅' : '❌');
  
  return hasAccess;
};

/**
 * Vérifie si l'utilisateur a AU MOINS UNE des permissions (OR)
 */
export const hasAnyPermission = (user, permissions = []) => {
  if (!user || !user.permissions) return false;
  
  if (user.permissions.includes('super_admin')) return true;
  
  return permissions.some(perm => user.permissions.includes(perm));
};

/**
 * Vérifie si l'utilisateur a TOUTES les permissions (AND)
 */
export const hasAllPermissions = (user, permissions = []) => {
  if (!user || !user.permissions) return false;
  
  if (user.permissions.includes('super_admin')) return true;
  
  return permissions.every(perm => user.permissions.includes(perm));
};