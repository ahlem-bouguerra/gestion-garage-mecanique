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
    roles: ['Super Admin']
  }), getAllUsers);

// ========== GESTION DES SUPER ADMINS ==========
router.patch("/users/:id/promote", superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }), promoteToSuperAdmin);
router.patch("/users/:id/demote", superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }), demoteSuperAdmin);

// ========== GESTION DES GARAGES ==========
router.patch("/garage/:id/activate", superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }), ActiveGarageAccount);
router.patch("/garage/:id/deactivate", superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }), DésactiveGarageAccount);

// ✅ CORRECTION: Ajouter superAdminMiddleware à toutes les routes garages
router.post("/garages", superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }), createGarage);
router.post("/garages/:garageId/garagiste", superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }), createGaragisteForGarage);
router.get("/garages", superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }), getAllGarages);
router.get("/garages/:id", superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }), getGarageById);
router.put("/garages/:id", superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }), updateGarage);
router.patch("/garages/:id/toggle-status", superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }), toggleGarageStatus);
router.delete("/garages/:id", superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }),deleteGarage);

// ========== GESTION DES GARAGISTES ==========
router.get("/garage/:id/garagistes", superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }), getGaragistesByGarage);
router.patch("/garagiste/:id/activate", superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }), activateGaragiste);
router.patch("/garagiste/:id/deactivate", superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }), deactivateGaragiste);
router.get("/garagistes/:garagisteId", superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }), getGaragisteById);

// Permissions des garagistes
router.get("/garagiste/:garagisteId/permissions", superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }), getGaragistePermissions);
router.post("/garagiste/permission", superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }), addPermissionToGaragiste);
router.delete("/garagiste/permission/:id", superAdminMiddleware,hasAny({
    roles: ['Super Admin']
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
    roles: ['Super Admin']
  }), createPermission);
router.get("/getAllPermissions", superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }), getAllPermissions);
router.get("/getOnePermission/:id", superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }), getPermissionById);
router.put("/updatePermission/:id", superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }), updatePermission);
router.delete("/deletePermission/:id", superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }), deletePermission);

// ========== GESTION DES ROLE-PERMISSIONS ==========
router.post("/creeRolePermission", superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }), createRolePermission);
router.get("/getAllRolePermissions", superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }), getAllRolePermissions);
router.get("/getOneRolePermission/:id", superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }), getRolePermissionById);
router.delete("/deleteRolePermission/:id", superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }),deleteRolePermission);

// ========== GESTION DES RÔLES GARAGISTES ==========
router.post("/createGaragisteRole", superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }), createGaragisteRole);
router.get("/getAllGaragisteRoles", superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }), getAllGaragisteRoles);
router.get("/getGaragisteRoleById/:id", superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }), getGaragisteRoleById);
router.delete("/deleteGaragisteRole/:id", superAdminMiddleware ,hasAny({
    roles: ['Super Admin']
  }), deleteGaragisteRole);


router.post('/services', superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }), createGlobalService);
router.get('/services', superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }), getAllGlobalServices);
router.put('/services/:id', superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }), updateGlobalService);
router.delete('/services/:id', superAdminMiddleware,hasAny({
    roles: ['Super Admin']
  }), deleteGlobalService);

export default router;