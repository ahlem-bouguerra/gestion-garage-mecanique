import express from "express";
import { verifEmailSuperAdmin } from "../controllers/superAdmin/VerifEmailSuperAdminController.js";
import { adminAuthMiddleware } from "../middlewares/superAdminAuthMiddleware.js";
import {createRole,getAllRoles,getRoleById,updateRole,deleteRole,} from "../controllers/superAdmin/roleController.js";
import { createPermission , getAllPermissions, getPermissionById , updatePermission , deletePermission } from "../controllers/superAdmin/permissionController.js";
import {createRolePermission,getAllRolePermissions,getRolePermissionById,deleteRolePermission } from "../controllers/superAdmin/rolePermissionController.js";
import { createGaragisteRole,getAllGaragisteRoles,getGaragisteRoleById,deleteGaragisteRole} from "../controllers/superAdmin/garagisteRoleController.js";
import {createGarageWithGaragiste,getAllGarages,getGarageById,updateGarage,toggleGarageStatus,deleteGarage} from "../controllers/superAdmin/garageController.js";
import {registerSuperAdmin,loginSuperAdmin,logoutSuperAdmin} from "../controllers/superAdmin/AuthControllerSuperAdmin.js";
import { superAdminMiddleware } from "../middlewares/authMiddleware.js";
const router = express.Router();

router.get("/me", adminAuthMiddleware, async (req, res) => {
  try {
    // L'utilisateur est déjà injecté dans req.user par ton middleware
    res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error("Erreur route /me:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});
router.get("/admin/verify-token/:token", verifEmailSuperAdmin);
router.post("/auth/register", registerSuperAdmin);
router.post("/auth/login", loginSuperAdmin);
router.post("/auth/logout", logoutSuperAdmin);


// CRUD des rôles
router.post("/creeRole", createRole);     
router.get("/getAllRoles", getAllRoles);      
router.get("/getOneRole/:id", getRoleById);  
router.put("/updateRole/:id", updateRole);  
router.delete("/deleteRole/:id", deleteRole); 

// CRUD des permissions
router.post("/creePermission", createPermission);     
router.get("/getAllPermissions", getAllPermissions);      
router.get("/getOnePermission/:id", getPermissionById);  
router.put("/updatePermission/:id", updatePermission);  
router.delete("/deletePermission/:id", deletePermission);

router.post("/creeRolePermission", createRolePermission);     
router.get("/getAllRolePermissions", getAllRolePermissions);      
router.get("/getOneRolePermission/:id", getRolePermissionById);  
router.delete("/deleteRolePermission/:id", deleteRolePermission);

router.post("/createGaragisteRole",createGaragisteRole);     
router.get("/getAllGaragisteRoles", getAllGaragisteRoles);      
router.get("/getGaragisteRoleById/:id", getGaragisteRoleById);  
router.delete("/deleteGaragisteRole/:id", deleteGaragisteRole);


router.post("/garages/create", superAdminMiddleware,createGarageWithGaragiste);
router.get("/garages", getAllGarages);
router.get("/garages/:id", getGarageById);
router.put("/garages/:id", updateGarage);
router.patch("/garages/:id/toggle-status", toggleGarageStatus);
router.delete("/garages/:id", deleteGarage);


export default router;
