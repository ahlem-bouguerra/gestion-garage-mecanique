import { Role } from "../../models/Role.js";

/**
 * ✅ Créer un rôle
 */
export const createRole = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Vérifie si le rôle existe déjà
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({ message: "Ce rôle existe déjà." });
    }

    const newRole = new Role({ name, description });
    await newRole.save();

    res.status(201).json({ message: "Rôle créé avec succès.", role: newRole });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur lors de la création du rôle.", error: error.message });
  }
};

/**
 * ✅ Lire tous les rôles
 */
// ========== OBTENIR TOUS LES RÔLES DISPONIBLES ==========
export const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find({ 
      name: { $ne: "Super Admin" } 
    }).select('_id name description');
    res.json(roles );
  } catch (error) {
    console.error("❌ Erreur getAllRoles:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * ✅ Lire un rôle par ID
 */
export const getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: "Rôle non trouvé." });
    }
    res.status(200).json(role);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération du rôle.", error: error.message });
  }
};

/**
 * ✅ Mettre à jour un rôle
 */
export const updateRole = async (req, res) => {
  try {
    const { name, description } = req.body;

    const updatedRole = await Role.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true, runValidators: true }
    );

    if (!updatedRole) {
      return res.status(404).json({ message: "Rôle non trouvé." });
    }

    res.status(200).json({ message: "Rôle mis à jour avec succès.", role: updatedRole });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour du rôle.", error: error.message });
  }
};

/**
 * ✅ Supprimer un rôle
 */
export const deleteRole = async (req, res) => {
  try {
    const deletedRole = await Role.findByIdAndDelete(req.params.id);
    if (!deletedRole) {
      return res.status(404).json({ message: "Rôle non trouvé." });
    }

    res.status(200).json({ message: "Rôle supprimé avec succès." });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression du rôle.", error: error.message });
  }
};
