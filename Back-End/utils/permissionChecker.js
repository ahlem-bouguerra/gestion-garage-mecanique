import { GaragisteRole } from "../models/GaragisteRole.js";
import { RolePermission } from "../models/RolePermission.js";
import { GaragistePermission } from "../models/GaragistePermission.js";
import { Users } from '../models/Users.js'; // Ajustez selon votre modèle
import { Garagiste } from '../models/Garagiste.js';
import { UserRole } from "../models/UserRole.js";
import { Role } from '../models/Role.js';
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
 * Middleware pour vérifier si l'utilisateur a un rôle spécifique
 * @param {...string} allowedRoles - Liste des rôles autorisés
 */
export const hasRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Vérifier si l'utilisateur est authentifié
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
      }

      const userId = req.user.id;

      // Vérifier d'abord si c'est un Super Admin dans Users
      const user = await Users.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Si l'utilisateur est Super Admin via le champ isSuperAdmin
      if (user.isSuperAdmin) {
        req.userRole = 'Super Admin';
        req.isSuperAdmin = true;
        return next();
      }

      // Sinon, vérifier le rôle via UserRole
      const userRole = await UserRole.findOne({ userId }).populate('roleId');

      if (!userRole || !userRole.roleId) {
        return res.status(403).json({
          success: false,
          message: 'Aucun rôle assigné à cet utilisateur'
        });
      }

      const roleName = userRole.roleId.name;

      // Super Admin via Role a aussi accès à tout
      if (roleName === 'Super Admin') {
        req.userRole = roleName;
        req.isSuperAdmin = true;
        return next();
      }

      // Vérifier si le rôle de l'utilisateur est dans la liste des rôles autorisés
      if (!allowedRoles.includes(roleName)) {
        return res.status(403).json({
          success: false,
          message: `Accès refusé. Rôle requis: ${allowedRoles.join(' ou ')}`,
          userRole: roleName
        });
      }

      // L'utilisateur a le bon rôle
      req.userRole = roleName;
      req.isSuperAdmin = false;
      next();

    } catch (error) {
      console.error('Erreur hasRole middleware:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification du rôle'
      });
    }
  };
};

export const hasAccess = (...rolesOrPermissions) => {
  return async (req, res, next) => {
    try {
      console.log('🔐 hasAccess - Vérification des accès...');
      console.log('🎯 Rôles/Permissions demandés:', rolesOrPermissions);

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

      // Essayer de charger depuis Garagiste d'abord
      userEntity = await Garagiste.findById(userId);
      
      if (userEntity) {
        isGaragiste = true;
        console.log('👨‍🔧 Type: Garagiste');
      } else {
        // Sinon essayer depuis Users
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

      // ✅ 3. Vérifier si c'est un Super Admin (Users seulement)
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
        // Pour un Garagiste
        userRole = await GaragisteRole.findOne({ garagisteId: userId })
          .populate('roleId');
      } else {
        // Pour un User
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
      if (roleName === 'Super Admin') {
        console.log('✅ Super Admin via rôle - Accès total');
        req.userRole = roleName;
        req.isSuperAdmin = true;
        req.permissions = ['*'];
        return next();
      }

      // ✅ 6. Récupérer les permissions du rôle
      const rolePermissions = await RolePermission.find({ roleId })
        .populate('permissionId');

      const userPermissions = rolePermissions
        .map(rp => rp.permissionId?.name)
        .filter(Boolean);

      console.log('🔑 Permissions de l\'utilisateur:', userPermissions);

      // ✅ 7. Vérifier l'accès
      // Déterminer si ce sont des rôles ou des permissions
      const systemRoles = ['Super Admin', 'Admin Garage', 'Mécanicien', 'Réceptionniste', 'Admin', 'Manager'];
      const requestedRoles = rolesOrPermissions.filter(item => systemRoles.includes(item));
      const requestedPermissions = rolesOrPermissions.filter(item => !systemRoles.includes(item));

      let hasRequiredAccess = false;

      // Vérifier les rôles
      if (requestedRoles.length > 0 && requestedRoles.includes(roleName)) {
        console.log('✅ Accès accordé par RÔLE:', roleName);
        hasRequiredAccess = true;
      }

      // Vérifier les permissions (il doit avoir AU MOINS UNE des permissions)
      if (requestedPermissions.length > 0) {
        const hasAnyPermission = requestedPermissions.some(perm =>
          userPermissions.includes(perm)
        );
        if (hasAnyPermission) {
          console.log('✅ Accès accordé par PERMISSION');
          hasRequiredAccess = true;
        }
      }

      // Si aucun accès
      if (!hasRequiredAccess) {
        console.log('❌ Accès refusé');
        return res.status(403).json({
          success: false,
          message: 'Accès refusé',
          required: rolesOrPermissions,
          userRole: roleName,
          userPermissions: userPermissions
        });
      }

      // ✅ Accès accordé
      console.log('✅ Accès accordé');
      req.userRole = roleName;
      req.isSuperAdmin = false;
      req.permissions = userPermissions;
      next();

    } catch (error) {
      console.error('❌ Erreur hasAccess:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification des accès',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};

// ============================================
// MIDDLEWARE requireAllPermissions
// ============================================

/**
 * Vérifie que l'utilisateur a TOUTES les permissions demandées
 */
export const requireAllPermissions = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      console.log('🔐 requireAllPermissions - Vérification...');
      console.log('🎯 Permissions requises:', requiredPermissions);

      if (!req.user || !req.user._id) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
      }

      const userId = req.user._id;

      // Déterminer le type
      let userEntity = await Garagiste.findById(userId);
      let isGaragiste = !!userEntity;

      if (!userEntity) {
        userEntity = await Users.findById(userId);
      }

      if (!userEntity) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Super Admin passe
      if (!isGaragiste && userEntity.isSuperAdmin) {
        console.log('✅ Super Admin - Toutes permissions');
        req.permissions = ['*'];
        return next();
      }

      // Récupérer le rôle
      let userRole;
      if (isGaragiste) {
        userRole = await GaragisteRole.findOne({ garagisteId: userId })
          .populate('roleId');
      } else {
        userRole = await UserRole.findOne({ userId })
          .populate('roleId');
      }

      if (!userRole || !userRole.roleId) {
        return res.status(403).json({
          success: false,
          message: 'Aucun rôle assigné'
        });
      }

      const roleId = userRole.roleId._id;
      const roleName = userRole.roleId.name;

      if (roleName === 'Super Admin') {
        console.log('✅ Super Admin via rôle - Toutes permissions');
        req.permissions = ['*'];
        return next();
      }

      // Récupérer les permissions
      const rolePermissions = await RolePermission.find({ roleId })
        .populate('permissionId');

      const userPermissions = rolePermissions
        .map(rp => rp.permissionId?.name)
        .filter(Boolean);

      console.log('🔑 Permissions:', userPermissions);

      // Vérifier TOUTES les permissions
      const hasAllPermissions = requiredPermissions.every(perm =>
        userPermissions.includes(perm)
      );

      if (!hasAllPermissions) {
        const missingPermissions = requiredPermissions.filter(perm =>
          !userPermissions.includes(perm)
        );

        console.log('❌ Permissions manquantes:', missingPermissions);

        return res.status(403).json({
          success: false,
          message: 'Permissions insuffisantes',
          required: requiredPermissions,
          missing: missingPermissions,
          userPermissions: userPermissions
        });
      }

      console.log('✅ Toutes les permissions présentes');
      req.permissions = userPermissions;
      next();

    } catch (error) {
      console.error('❌ Erreur requireAllPermissions:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification des permissions'
      });
    }
  };
};

// ============================================
// EXPORT
// ============================================

export default { hasAccess, requireAllPermissions };