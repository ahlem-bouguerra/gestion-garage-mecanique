import { Permission } from "../../models/Permission.js";


export const createPermission = async (req, res) => {
  try {
    const { name, description } = req.body;

    const existingPermission = await Permission.findOne({ name });
    if (existingPermission) {
      return res.status(400).json({ message: "Ce Permission existe déjà." });
    }

    const newPermission = new Permission({ name, description });
    await newPermission.save();

    res.status(201).json({ message: "Permission créé avec succès.", Permission: newPermission });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur lors de la création du Permission.", error: error.message });
  }
};


export const getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find().sort({ createdAt: -1 });
    res.status(200).json(permissions);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des permissions.", error: error.message });
  }
};


export const getPermissionById = async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);
    if (!permission) {
      return res.status(404).json({ message: "permission non trouvé." });
    }
    res.status(200).json(permission);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération du permission.", error: error.message });
  }
};


export const updatePermission = async (req, res) => {
  try {
    const { name, description } = req.body;

    const updatedPermission = await Permission.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true, runValidators: true }
    );

    if (!updatedPermission) {
      return res.status(404).json({ message: "permission non trouvé." });
    }

    res.status(200).json({ message: "permission mis à jour avec succès.", permission: updatedPermission });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour du permission.", error: error.message });
  }
};

export const deletePermission = async (req, res) => {
  try {
    const deletePermission = await Permission.findByIdAndDelete(req.params.id);
    if (!deletePermission) {
      return res.status(404).json({ message: "permission non trouvé." });
    }

    res.status(200).json({ message: "permission supprimé avec succès." });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression du permission.", error: error.message });
  }
};
