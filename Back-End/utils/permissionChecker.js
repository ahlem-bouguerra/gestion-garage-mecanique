import { GaragisteRole } from "../models/GaragisteRole.js";
import { RolePermission } from "../models/RolePermission.js";
import { GaragistePermission } from "../models/GaragistePermission.js";
import { Users } from '../models/Users.js'; // Ajustez selon votre modèle
import { Garagiste } from '../models/Garagiste.js';
import { UserRole } from "../models/UserRole.js";
import { Role } from '../models/Role.js';
import { Permission } from '../models/Permission.js';
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
 * Middleware pour vérifier si un utilisateur a un rôle OU une permission
 * @param {Object} options - { roles: [], permissions: [] }
 * @returns {Function} Middleware Express
 */
export const hasAny = ({ roles = [], permissions = [] }) => {
  return async (req, res, next) => {
    // Bypass pour développement
    if (process.env.BYPASS_AUTH === 'true') {
      return next();
    }

    try {
      console.log('🔐 hasAny - Vérification des accès...');
      console.log('🎯 Rôles acceptés:', roles);
      console.log('🎯 Permissions acceptées:', permissions);

      // ✅ 1. Vérifier l'authentification
      if (!req.user || !req.user._id) {
        console.log('❌ Utilisateur non authentifié');
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
      }

      const userId = req.user._id;
      console.log('👤 User ID:', userId);

      // ✅ 2. Déterminer le type d'utilisateur (User ou Garagiste)
      let userEntity = null;
      let isGaragiste = false;

      userEntity = await Garagiste.findById(userId);
      
      if (userEntity) {
        isGaragiste = true;
        console.log('👨‍🔧 Type: Garagiste');
      } else {
        userEntity = await Users.findById(userId);
        console.log('👤 Type: User');
      }

      if (!userEntity) {
        console.log('❌ Utilisateur introuvable');
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // ✅ 3. Vérifier si c'est un Super Admin (accès total)
      if (!isGaragiste && userEntity.isSuperAdmin) {
        console.log('✅ Super Admin détecté - Accès total');
        req.userRole = 'Super Admin';
        req.isSuperAdmin = true;
        req.permissions = ['*'];
        return next();
      }

      // ✅ 4. Récupérer le rôle
      let userRole, roleId, roleName;

      if (isGaragiste) {
        userRole = await GaragisteRole.findOne({ garagisteId: userId })
          .populate('roleId');
      } else {
        userRole = await UserRole.findOne({ userId })
          .populate('roleId');
      }

      if (!userRole || !userRole.roleId) {
        console.log('❌ Aucun rôle assigné');
        return res.status(403).json({
          success: false,
          message: 'Aucun rôle assigné à cet utilisateur'
        });
      }

      roleId = userRole.roleId._id;
      roleName = userRole.roleId.name;
      console.log('🎭 Rôle trouvé:', roleName);

      // ✅ 5. Super Admin via Role a aussi accès total
      const normalizedRoleName = roleName.trim().toLowerCase();
      if (normalizedRoleName === 'super admin') {
        console.log('✅ Super Admin via rôle - Accès total');
        req.userRole = roleName;
        req.isSuperAdmin = true;
        req.permissions = ['*'];
        return next();
      }

      // ✅ 6. Récupérer les permissions (rôle + individuelles pour garagistes)
      let userPermissions = [];

      if (isGaragiste) {
        // 🔧 Pour les garagistes : utiliser getUserPermissions (rôle + individuelles)
        userPermissions = await getUserPermissions(userId);
        console.log('🔑 Permissions du garagiste (rôle + individuelles):', userPermissions);
      } else {
        // 👤 Pour les users : seulement les permissions du rôle
        const rolePermissions = await RolePermission.find({ roleId })
          .populate('permissionId');

        userPermissions = rolePermissions
          .map(rp => rp.permissionId?.name)
          .filter(Boolean);
        
        console.log('🔑 Permissions de l\'utilisateur (rôle):', userPermissions);
      }

      // ✅ 7. Fonction de normalisation pour comparaison robuste
      const normalize = (str) => str.trim().toLowerCase();

      // ✅ 8. Vérifier l'accès : RÔLE OU PERMISSION (vérification séparée)
      let hasRequiredRole = false;
      let hasRequiredPermission = false;
      let accessGrantedBy = [];

      // 🔹 Vérifier les RÔLES (si des rôles sont requis)
      if (roles.length > 0) {
        const normalizedUserRole = normalize(roleName);
        hasRequiredRole = roles.some(r => normalize(r) === normalizedUserRole);
        
        if (hasRequiredRole) {
          const matchedRole = roles.find(r => normalize(r) === normalizedUserRole);
          console.log('✅ Rôle correspondant:', roleName);
          accessGrantedBy.push(`role:${matchedRole}`);
        }
      } else {
        // Si aucun rôle n'est requis, on considère cette condition comme satisfaite
        hasRequiredRole = true;
      }

      // 🔹 Vérifier les PERMISSIONS (si des permissions sont requises)
      if (permissions.length > 0) {
        const normalizedUserPerms = userPermissions.map(normalize);
        const normalizedRequiredPerms = permissions.map(normalize);
        
        hasRequiredPermission = normalizedRequiredPerms.some(reqPerm =>
          normalizedUserPerms.includes(reqPerm)
        );
        
        if (hasRequiredPermission) {
          const grantedPermission = permissions.find(perm =>
            normalizedUserPerms.includes(normalize(perm))
          );
          console.log('✅ Permission correspondante:', grantedPermission);
          accessGrantedBy.push(`permission:${grantedPermission}`);
        }
      } else {
        // Si aucune permission n'est requise, on considère cette condition comme satisfaite
        hasRequiredPermission = true;
      }

      // ✅ 9. Décision finale : accès accordé si RÔLE OU PERMISSION
      const hasAccess = hasRequiredRole || hasRequiredPermission;

      if (!hasAccess) {
        console.log('❌ Accès refusé');
        console.log('📊 Détails:');
        console.log('   - Rôles attendus:', roles);
        console.log('   - Rôle utilisateur:', roleName);
        console.log('   - Permissions attendues:', permissions);
        console.log('   - Permissions utilisateur:', userPermissions);
        
        return res.status(403).json({
          success: false,
          message: 'Accès refusé : rôle ou permission requis',
          required: {
            roles,
            permissions
          },
          userRole: roleName,
          userPermissions: userPermissions
        });
      }

      // ✅ 10. Accès accordé - Enrichir req pour les prochains middlewares
      console.log('✅ Accès accordé via:', accessGrantedBy.join(', '));
      req.userRole = roleName;
      req.isSuperAdmin = false;
      req.permissions = userPermissions;
      next();

    } catch (error) {
      console.error('❌ Erreur hasAny:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification des accès',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};


export default {hasAny};