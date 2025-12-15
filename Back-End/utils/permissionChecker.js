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

      // ✅ 1. SUPPORTER LES DEUX TYPES D'AUTHENTIFICATION
      let userEntity = null;
      let userPermissions = [];
      let userRoles = [];
      let isClient = false;

      // 🔹 CAS 1 : Client (via clientauthMiddleware)
      if (req.client && req.client._id) {
        isClient = true;
        console.log('👥 Type: Client');
        console.log('👤 Client ID:', req.client._id);
        console.log('📧 Email:', req.client.email);
        
        // Pour les clients, utiliser directement les permissions du token
        userPermissions = req.client.permissions || [];
        userRoles = req.client.roles || [];
        
        console.log('🎭 Rôles du client:', userRoles);
        console.log('🔑 Permissions du client:', userPermissions);
      }
      // 🔹 CAS 2 : User/Garagiste (via authMiddleware classique)
      else if (req.user && req.user._id) {
        console.log('👤 Type: User/Garagiste');
        const userId = req.user._id;
        console.log('👤 User ID:', userId);

        // ✅ 2. Déterminer le type d'utilisateur (User ou Garagiste)
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
        userRoles = [roleName];
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
      }
      // 🔹 CAS 3 : Aucune authentification
      else {
        console.log('❌ Utilisateur non authentifié (ni req.user ni req.client)');
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
      }

      // ✅ 7. Fonction de normalisation pour comparaison robuste
      const normalize = (str) => str.trim().toLowerCase();

      // ✅ 8. Vérifier qu'il y a au moins une exigence (rôle ou permission)
      if (roles.length === 0 && permissions.length === 0) {
        console.log('⚠️ Aucune restriction définie - accès accordé par défaut');
        return next();
      }

      // ✅ 9. Vérifier l'accès : RÔLE OU PERMISSION
      let hasRequiredRole = false;
      let hasRequiredPermission = false;
      let accessGrantedBy = [];

      // 🔹 Vérifier les RÔLES (si des rôles sont requis)
      if (roles.length > 0) {
        const normalizedUserRoles = userRoles.map(normalize);
        const normalizedRequiredRoles = roles.map(normalize);
        
        hasRequiredRole = normalizedRequiredRoles.some(reqRole =>
          normalizedUserRoles.includes(reqRole)
        );
        
        if (hasRequiredRole) {
          const matchedRole = roles.find(r => 
            normalizedUserRoles.includes(normalize(r))
          );
          console.log('✅ Rôle correspondant:', matchedRole);
          accessGrantedBy.push(`role:${matchedRole}`);
        }
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
      }

      // ✅ 10. Décision finale : accès accordé si RÔLE OU PERMISSION
      const hasAccess = hasRequiredRole || hasRequiredPermission;

      if (!hasAccess) {
        console.log('❌ Accès refusé');
        console.log('📊 Détails:');
        console.log('   - Rôles attendus:', roles);
        console.log('   - Rôles utilisateur:', userRoles);
        console.log('   - Permissions attendues:', permissions);
        console.log('   - Permissions utilisateur:', userPermissions);
        
        return res.status(403).json({
          success: false,
          message: 'Accès refusé : rôle ou permission requis',
          required: {
            roles,
            permissions
          },
          userRoles: userRoles,
          userPermissions: userPermissions
        });
      }

      // ✅ 11. Accès accordé - Enrichir req pour les prochains middlewares
      console.log('✅ Accès accordé via:', accessGrantedBy.join(', '));
      
      if (isClient) {
        req.userRole = userRoles[0] || 'Client';
        req.permissions = userPermissions;
      } else {
        req.userRole = userRoles[0];
        req.isSuperAdmin = false;
        req.permissions = userPermissions;
      }
      
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