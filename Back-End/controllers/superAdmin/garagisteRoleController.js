import { GaragisteRole } from "../../models/GaragisteRole.js";

/** Créer une association rôle-permission */
export const createGaragisteRole = async (req, res) => {
  try {
    const { garagisteId, roleId } = req.body;
    const existing = await GaragisteRole .findOne({ roleId, garagisteId });
    if (existing) return res.status(400).json({ message: "Association déjà existante" });

    const gr = await GaragisteRole .create({ roleId, garagisteId });
    res.status(201).json(gr);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllGaragisteRoles = async (req, res) => {
  try {
    const grs = await GaragisteRole.find()
      .populate("roleId", "name")
      .populate("garagisteId", "name");
    res.status(200).json(grs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getGaragisteRoleById = async (req, res) => {
  try {
    const gr = await GaragisteRole.findById(req.params.id)
      .populate("roleId", "name")
      .populate("garagisteId", "name");
    if (!gr) return res.status(404).json({ message: "Non trouvé" });
    res.status(200).json(gr);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Supprimer une association */
export const deleteGaragisteRole = async (req, res) => {
  try {
    const gr = await GaragisteRole.findByIdAndDelete(req.params.id);
    if (!gr) return res.status(404).json({ message: "Non trouvé" });
    res.status(200).json({ message: "Association supprimée" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

