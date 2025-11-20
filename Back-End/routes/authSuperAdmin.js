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
import { hasRole } from "../utils/permissionChecker.js";
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
router.get("/getAllUsers", superAdminMiddleware, hasRole("Super Admin"), getAllUsers);

// ========== GESTION DES SUPER ADMINS ==========
router.patch("/users/:id/promote", superAdminMiddleware, hasRole("Super Admin"), promoteToSuperAdmin);
router.patch("/users/:id/demote", superAdminMiddleware, hasRole("Super Admin"), demoteSuperAdmin);

// ========== GESTION DES GARAGES ==========
router.patch("/garage/:id/activate", superAdminMiddleware, hasRole("Super Admin"), ActiveGarageAccount);
router.patch("/garage/:id/deactivate", superAdminMiddleware, hasRole("Super Admin"), DésactiveGarageAccount);

// ✅ CORRECTION: Ajouter superAdminMiddleware à toutes les routes garages
router.post("/garages", superAdminMiddleware, hasRole("Super Admin"), createGarage);
router.post("/garages/:garageId/garagiste", superAdminMiddleware, hasRole("Super Admin"), createGaragisteForGarage);
router.get("/garages", superAdminMiddleware, hasRole("Super Admin"), getAllGarages);
router.get("/garages/:id", superAdminMiddleware, hasRole("Super Admin"), getGarageById);
router.put("/garages/:id", superAdminMiddleware, hasRole("Super Admin"), updateGarage);
router.patch("/garages/:id/toggle-status", superAdminMiddleware, hasRole("Super Admin"), toggleGarageStatus);
router.delete("/garages/:id", superAdminMiddleware, hasRole("Super Admin"), deleteGarage);

// ========== GESTION DES GARAGISTES ==========
router.get("/garage/:id/garagistes", superAdminMiddleware, hasRole("Super Admin"), getGaragistesByGarage);
router.patch("/garagiste/:id/activate", superAdminMiddleware, hasRole("Super Admin"), activateGaragiste);
router.patch("/garagiste/:id/deactivate", superAdminMiddleware, hasRole("Super Admin"), deactivateGaragiste);
router.get("/garagistes/:garagisteId", superAdminMiddleware, hasRole("Super Admin"), getGaragisteById);

// Permissions des garagistes
router.get("/garagiste/:garagisteId/permissions", superAdminMiddleware, hasRole("Super Admin"), getGaragistePermissions);
router.post("/garagiste/permission", superAdminMiddleware, hasRole("Super Admin"), addPermissionToGaragiste);
router.delete("/garagiste/permission/:id", superAdminMiddleware, hasRole("Super Admin"), deleteGaragistePermission);

// ========== GESTION DES RÔLES ==========
router.post("/creeRole", superAdminMiddleware, hasRole("Super Admin"), createRole);
router.get("/getAllRoles", superAdminMiddleware, hasRole("Super Admin"), getAllRoles);
router.get("/getOneRole/:id", superAdminMiddleware, hasRole("Super Admin"), getRoleById);
router.put("/updateRole/:id", superAdminMiddleware, hasRole("Super Admin"), updateRole);
router.delete("/deleteRole/:id", superAdminMiddleware, hasRole("Super Admin"), deleteRole);

// ========== GESTION DES PERMISSIONS ==========
router.post("/creePermission", superAdminMiddleware, hasRole("Super Admin"), createPermission);
router.get("/getAllPermissions", superAdminMiddleware, hasRole("Super Admin"), getAllPermissions);
router.get("/getOnePermission/:id", superAdminMiddleware, hasRole("Super Admin"), getPermissionById);
router.put("/updatePermission/:id", superAdminMiddleware, hasRole("Super Admin"), updatePermission);
router.delete("/deletePermission/:id", superAdminMiddleware, hasRole("Super Admin"), deletePermission);

// ========== GESTION DES ROLE-PERMISSIONS ==========
router.post("/creeRolePermission", superAdminMiddleware, hasRole("Super Admin"), createRolePermission);
router.get("/getAllRolePermissions", superAdminMiddleware, hasRole("Super Admin"), getAllRolePermissions);
router.get("/getOneRolePermission/:id", superAdminMiddleware, hasRole("Super Admin"), getRolePermissionById);
router.delete("/deleteRolePermission/:id", superAdminMiddleware, hasRole("Super Admin"), deleteRolePermission);

// ========== GESTION DES RÔLES GARAGISTES ==========
router.post("/createGaragisteRole", superAdminMiddleware, hasRole("Super Admin"), createGaragisteRole);
router.get("/getAllGaragisteRoles", superAdminMiddleware, hasRole("Super Admin"), getAllGaragisteRoles);
router.get("/getGaragisteRoleById/:id", superAdminMiddleware, hasRole("Super Admin"), getGaragisteRoleById);
router.delete("/deleteGaragisteRole/:id", superAdminMiddleware, hasRole("Super Admin"), deleteGaragisteRole);

export default router;