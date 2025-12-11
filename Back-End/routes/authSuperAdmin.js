import express from "express";
import { verifEmailSuperAdmin } from "../controllers/superAdmin/VerifEmailSuperAdminController.js";
import {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
} from "../controllers/superAdmin/roleController.js";
import {
  createPermission,
  getAllPermissions,
  getPermissionById,
  updatePermission,
  deletePermission,
} from "../controllers/superAdmin/permissionController.js";
import {
  createRolePermission,
  getAllRolePermissions,
  getRolePermissionById,
  deleteRolePermission,
} from "../controllers/superAdmin/rolePermissionController.js";
import {
  addPermissionToGaragiste,
  deleteGaragistePermission,
  getGaragistePermissions,
} from "../controllers/superAdmin/garagistePermission.js";
import {
  createGaragisteRole,
  getAllGaragisteRoles,
  getGaragisteRoleById,
  deleteGaragisteRole,
} from "../controllers/superAdmin/garagisteRoleController.js";
import {
  createGarage,
  createGaragisteForGarage,
  getAllGarages,
  getGarageById,
  updateGarage,
  toggleGarageStatus,
  deleteGarage,
  getGaragisteById,
} from "../controllers/superAdmin/garageController.js";
import { superAdminMiddleware } from "../middlewares/superAdminAuthMiddleware.js";
import { hasAny } from "../utils/permissionChecker.js";
import {
  registerUser,
  loginUser,
  logoutUser,
  promoteToSuperAdmin,
  demoteSuperAdmin,
  getAllUsers,
} from "../controllers/superAdmin/AuthControllerSuperAdmin.js";
import { resetPasswordSuperAdmin } from "../controllers/superAdmin/ResetPasswordSuperAdmin.js";
import { forgotPasswordSuperAdmin } from "../controllers/superAdmin/ForgotPasswordClient.js";
import {
  ActiveGarageAccount,
  DésactiveGarageAccount,
  getGaragistesByGarage,
  activateGaragiste,
  deactivateGaragiste,
} from "../controllers/superAdmin/garageController.js";

import {
  createGlobalService, 
  getAllGlobalServices,
  updateGlobalService,
  deleteGlobalService
} from "../controllers/superAdmin/serviceController.js"

import { getProfile ,updateProfile ,changePassword} from "../controllers/superAdmin/profileContoller.js";
import { authGaragisteOuSuperAdmin } from "../middlewares/combinedAuth.js"
const router = express.Router();

// ========== ROUTE /ME (PROTÉGÉE) ==========
router.get("/me", superAdminMiddleware, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error("Erreur route /me:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ========== ROUTES PUBLIQUES ==========
router.get("/admin/verify-token/:token", verifEmailSuperAdmin);
router.post("/auth/register", registerUser);
router.post("/auth/login", loginUser);
router.post("/SuperAdmin/reset-password", resetPasswordSuperAdmin);
router.post("/SuperAdmin/forgot-password", forgotPasswordSuperAdmin);
router.get("/get-profile-super-admin", superAdminMiddleware, getProfile);
router.put("/profile/personal/superAdmin", superAdminMiddleware, updateProfile);
router.put("/profile/password/superAdmin", superAdminMiddleware, changePassword);

// ========== ROUTES PROTÉGÉES - AUTH ==========
router.post("/auth/logout", superAdminMiddleware, logoutUser);
router.get("/getAllUsers", superAdminMiddleware,hasAny({
    roles: ['Super Admin'],
    permissions: ['Gérer_SuperAdmin']
  }), getAllUsers);

// ========== GESTION DES SUPER ADMINS ==========
router.patch("/users/:id/promote", superAdminMiddleware,hasAny({
    roles: ['Super Admin'],
    permissions: ['Gérer_SuperAdmin']
  }), promoteToSuperAdmin);
router.patch("/users/:id/demote", superAdminMiddleware,hasAny({
    roles: ['Super Admin'],
    permissions: ['Gérer_SuperAdmin']
  }), demoteSuperAdmin);

// ========== GESTION DES GARAGES ==========
router.patch("/garage/:id/activate", superAdminMiddleware,hasAny({
    roles: ['Super Admin'],
    permissions: ['Gérer_Garage']
  }), ActiveGarageAccount);

router.patch("/garage/:id/deactivate", superAdminMiddleware,hasAny({
    roles: ['Super Admin'],
    permissions: ['Gérer_Garage']
  }), DésactiveGarageAccount);

// ✅ CORRECTION: Ajouter superAdminMiddleware à toutes les routes garages
router.post("/garages", superAdminMiddleware,hasAny({
    roles: ['Super Admin'],
    permissions: ['Gérer_Garage']
  }), createGarage);

router.post("/garages/:garageId/garagiste", superAdminMiddleware,hasAny({
    roles: ['Super Admin'],
     permissions: ['Gérer_Garage']
  }), createGaragisteForGarage);

router.get("/garages", superAdminMiddleware,hasAny({
    roles: ['Super Admin'],
     permissions: ['Gérer_Garage']
  }), getAllGarages);

router.get("/garages/:id", superAdminMiddleware,hasAny({
    roles: ['Super Admin'],
     permissions: ['Gérer_Garage']
  }), getGarageById);

router.put("/garages/:id", superAdminMiddleware,hasAny({
    roles: ['Super Admin'],
     permissions: ['Gérer_Garage']
  }), updateGarage);

router.patch("/garages/:id/toggle-status", superAdminMiddleware,hasAny({
    roles: ['Super Admin'],
     permissions: ['Gérer_Garage']
  }), toggleGarageStatus);

router.delete("/garages/:id", superAdminMiddleware,hasAny({
    roles: ['Super Admin'],
     permissions: ['Gérer_Garage']
  }),deleteGarage);

// ========== GESTION DES GARAGISTES ==========
router.get("/garage/:id/garagistes", superAdminMiddleware,hasAny({
    roles: ['Super Admin'],
    permissions: ['Gérer_Garage']
  }), getGaragistesByGarage);

router.patch("/garagiste/:id/activate", superAdminMiddleware,hasAny({
    roles: ['Super Admin'],
    permissions: ['Gérer_Garage']
  }), activateGaragiste);

router.patch("/garagiste/:id/deactivate", superAdminMiddleware,hasAny({
    roles: ['Super Admin'],
    permissions: ['Gérer_Garage']
  }), deactivateGaragiste);

router.get("/garagistes/:garagisteId", superAdminMiddleware,hasAny({
    roles: ['Super Admin'],
    permissions: ['Gérer_Garage']
  }), getGaragisteById);

  ////////////////////////////////////////////////////////////////////////////////
// Permissions des garagistes
router.get("/garagiste/:garagisteId/permissions", superAdminMiddleware,hasAny({
    roles: ['Super Admin'],
    permissions: ['Gérer_permission']
  }), getGaragistePermissions);
router.post("/garagiste/permission", superAdminMiddleware,hasAny({
    roles: ['Super Admin'],
    permissions: ['Gérer_permission']
  }), addPermissionToGaragiste);
router.delete("/garagiste/permission/:id", superAdminMiddleware,hasAny({
    roles: ['Super Admin'],
    permissions: ['Gérer_permission']
  }),deleteGaragistePermission);

// ========== GESTION DES RÔLES ==========
router.post("/creeRole", superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }), createRole);
router.get("/getAllRoles", authGaragisteOuSuperAdmin, getAllRoles);
router.get("/getOneRole/:id", superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }),getRoleById);
router.put("/updateRole/:id", superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }), updateRole);
router.delete("/deleteRole/:id", superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }), deleteRole);

// ========== GESTION DES PERMISSIONS ==========
router.post("/creePermission", superAdminMiddleware,hasAny({
    roles: ['Super Admin'],
    permissions: ['Gérer_permission']
  }), createPermission);
router.get("/getAllPermissions", superAdminMiddleware,hasAny({
    roles: ['Super Admin'],
    permissions: ['Gérer_permission']
  }), getAllPermissions);
router.get("/getOnePermission/:id", superAdminMiddleware,hasAny({
    roles: ['Super Admin'],
    permissions: ['Gérer_permission']
  }), getPermissionById);
router.put("/updatePermission/:id", superAdminMiddleware,hasAny({
    roles: ['Super Admin'],
    permissions: ['Gérer_permission']
  }), updatePermission);
router.delete("/deletePermission/:id", superAdminMiddleware,hasAny({
    roles: ['Super Admin'],
    permissions: ['Gérer_permission']
  }), deletePermission);

// ========== GESTION DES ROLE-PERMISSIONS ==========
router.post("/creeRolePermission", superAdminMiddleware,hasAny({
    roles: ['Super Admin'],
    permissions: ['Gérer_Associer_role_permissions']
  }), createRolePermission);
router.get("/getAllRolePermissions", superAdminMiddleware,hasAny({
    roles: ['Super Admin'],
    permissions: ['Gérer_Associer_role_permissions']
  }), getAllRolePermissions);
router.get("/getOneRolePermission/:id", superAdminMiddleware,hasAny({
    roles: ['Super Admin'],
    permissions: ['Gérer_Associer_role_permissions']
  }), getRolePermissionById);
router.delete("/deleteRolePermission/:id", superAdminMiddleware,hasAny({
    roles: ['Super Admin'],
    permissions: ['Gérer_Associer_role_permissions']
  }),deleteRolePermission);

// ========== GESTION DES RÔLES GARAGISTES ==========
router.post("/createGaragisteRole", superAdminMiddleware,hasAny({
    roles: ['Super Admin'],
    permissions: ['Gérer_role']
  }), createGaragisteRole);
router.get("/getAllGaragisteRoles", superAdminMiddleware,hasAny({
    roles: ['Super Admin'],
    permissions: ['Gérer_role']
  }), getAllGaragisteRoles);
router.get("/getGaragisteRoleById/:id", superAdminMiddleware,hasAny({
    roles: ['Super Admin'],
    permissions: ['Gérer_role']
  }), getGaragisteRoleById);
router.delete("/deleteGaragisteRole/:id", superAdminMiddleware ,hasAny({
    roles: ['Super Admin'],
    permissions: ['Gérer_role']
  }), deleteGaragisteRole);


router.post('/services', superAdminMiddleware,hasAny({
    permissions: ['create_service']
  }), createGlobalService);
router.get('/services', superAdminMiddleware,hasAny({
    roles: ['Super Admin'],
    permissions: ['view_service']
  }), getAllGlobalServices);
router.put('/services/:id', superAdminMiddleware,hasAny({
    roles: ['Super Admin'],
    permissions: ['update_service']
  }), updateGlobalService);
router.delete('/services/:id', superAdminMiddleware,hasAny({
    roles: ['Super Admin'],
    permissions: ['delete_service']
  }), deleteGlobalService);

export default router;