import { RolePermission } from "../../models/RolePermission.js";

/** Créer une association rôle-permission */
export const createRolePermission = async (req, res) => {
  try {
    const { roleId, permissionId } = req.body;
    const existing = await RolePermission.findOne({ roleId, permissionId });
    if (existing) return res.status(400).json({ message: "Association déjà existante" });

    const rp = await RolePermission.create({ roleId, permissionId });
    res.status(201).json(rp);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Lire toutes les associations */
export const getAllRolePermissions = async (req, res) => {
  try {
    const rps = await RolePermission.find()
      .populate("roleId", "name")
      .populate("permissionId", "name");
    res.status(200).json(rps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Lire une association par ID */
export const getRolePermissionById = async (req, res) => {
  try {
    const rp = await RolePermission.findById(req.params.id)
      .populate("roleId", "name")
      .populate("permissionId", "name");
    if (!rp) return res.status(404).json({ message: "Non trouvé" });
    res.status(200).json(rp);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Supprimer une association */
export const deleteRolePermission = async (req, res) => {
  try {
    const rp = await RolePermission.findByIdAndDelete(req.params.id);
    if (!rp) return res.status(404).json({ message: "Non trouvé" });
    res.status(200).json({ message: "Association supprimée" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
