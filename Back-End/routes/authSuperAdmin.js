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
import { hasAccess } from "../utils/permissionChecker.js";
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

// ========== ROUTES PROTÉGÉES - AUTH ==========
router.post("/auth/logout", superAdminMiddleware, logoutUser);
router.get("/getAllUsers", superAdminMiddleware, hasAccess("Super Admin"), getAllUsers);

// ========== GESTION DES SUPER ADMINS ==========
router.patch("/users/:id/promote", superAdminMiddleware, hasAccess("Super Admin"), promoteToSuperAdmin);
router.patch("/users/:id/demote", superAdminMiddleware, hasAccess("Super Admin"), demoteSuperAdmin);

// ========== GESTION DES GARAGES ==========
router.patch("/garage/:id/activate", superAdminMiddleware, hasAccess("Super Admin"), ActiveGarageAccount);
router.patch("/garage/:id/deactivate", superAdminMiddleware, hasAccess("Super Admin"), DésactiveGarageAccount);

// ✅ CORRECTION: Ajouter superAdminMiddleware à toutes les routes garages
router.post("/garages", superAdminMiddleware, hasAccess("Super Admin"), createGarage);
router.post("/garages/:garageId/garagiste", superAdminMiddleware, hasAccess("Super Admin"), createGaragisteForGarage);
router.get("/garages", superAdminMiddleware, hasAccess("Super Admin"), getAllGarages);
router.get("/garages/:id", superAdminMiddleware, hasAccess("Super Admin"), getGarageById);
router.put("/garages/:id", superAdminMiddleware, hasAccess("Super Admin"), updateGarage);
router.patch("/garages/:id/toggle-status", superAdminMiddleware, hasAccess("Super Admin"), toggleGarageStatus);
router.delete("/garages/:id", superAdminMiddleware, hasAccess("Super Admin"), deleteGarage);

// ========== GESTION DES GARAGISTES ==========
router.get("/garage/:id/garagistes", superAdminMiddleware, hasAccess("Super Admin"), getGaragistesByGarage);
router.patch("/garagiste/:id/activate", superAdminMiddleware, hasAccess("Super Admin"), activateGaragiste);
router.patch("/garagiste/:id/deactivate", superAdminMiddleware, hasAccess("Super Admin"), deactivateGaragiste);
router.get("/garagistes/:garagisteId", superAdminMiddleware, hasAccess("Super Admin"), getGaragisteById);

// Permissions des garagistes
router.get("/garagiste/:garagisteId/permissions", superAdminMiddleware, hasAccess("Super Admin"), getGaragistePermissions);
router.post("/garagiste/permission", superAdminMiddleware, hasAccess("Super Admin"), addPermissionToGaragiste);
router.delete("/garagiste/permission/:id", superAdminMiddleware, hasAccess("Super Admin"), deleteGaragistePermission);

// ========== GESTION DES RÔLES ==========
router.post("/creeRole", superAdminMiddleware, hasAccess("Super Admin"), createRole);
router.get("/getAllRoles", superAdminMiddleware, hasAccess("Super Admin"), getAllRoles);
router.get("/getOneRole/:id", superAdminMiddleware, hasAccess("Super Admin"), getRoleById);
router.put("/updateRole/:id", superAdminMiddleware, hasAccess("Super Admin"), updateRole);
router.delete("/deleteRole/:id", superAdminMiddleware, hasAccess("Super Admin"), deleteRole);

// ========== GESTION DES PERMISSIONS ==========
router.post("/creePermission", superAdminMiddleware, hasAccess("Super Admin"), createPermission);
router.get("/getAllPermissions", superAdminMiddleware, hasAccess("Super Admin"), getAllPermissions);
router.get("/getOnePermission/:id", superAdminMiddleware, hasAccess("Super Admin"), getPermissionById);
router.put("/updatePermission/:id", superAdminMiddleware, hasAccess("Super Admin"), updatePermission);
router.delete("/deletePermission/:id", superAdminMiddleware, hasAccess("Super Admin"), deletePermission);

// ========== GESTION DES ROLE-PERMISSIONS ==========
router.post("/creeRolePermission", superAdminMiddleware, hasAccess("Super Admin"), createRolePermission);
router.get("/getAllRolePermissions", superAdminMiddleware, hasAccess("Super Admin"), getAllRolePermissions);
router.get("/getOneRolePermission/:id", superAdminMiddleware, hasAccess("Super Admin"), getRolePermissionById);
router.delete("/deleteRolePermission/:id", superAdminMiddleware, hasAccess("Super Admin"), deleteRolePermission);

// ========== GESTION DES RÔLES GARAGISTES ==========
router.post("/createGaragisteRole", superAdminMiddleware, hasAccess("Super Admin"), createGaragisteRole);
router.get("/getAllGaragisteRoles", superAdminMiddleware, hasAccess("Super Admin"), getAllGaragisteRoles);
router.get("/getGaragisteRoleById/:id", superAdminMiddleware, hasAccess("Super Admin"), getGaragisteRoleById);
router.delete("/deleteGaragisteRole/:id", superAdminMiddleware, hasAccess("Super Admin"), deleteGaragisteRole);


router.post('/services', superAdminMiddleware, hasAccess("Super Admin"), createGlobalService);
router.get('/services', superAdminMiddleware, hasAccess("Super Admin"), getAllGlobalServices);
router.put('/services/:id', superAdminMiddleware, hasAccess("Super Admin"), updateGlobalService);
router.delete('/services/:id', superAdminMiddleware, hasAccess("Super Admin"), deleteGlobalService);

export default router;