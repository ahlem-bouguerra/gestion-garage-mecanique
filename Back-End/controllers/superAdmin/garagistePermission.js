// controllers/garagistePermission.controller.js
import { GaragistePermission } from '../../models/GaragistePermission.js';


// Obtenir toutes les permissions d'un garagiste
export const getGaragistePermissions = async (req, res) => {
  try {
    const { garagisteId } = req.params;
    
    const garagistePerms = await GaragistePermission.find({ GaragisteId: garagisteId })
      .populate('permissionId');

    res.json(garagistePerms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Ajouter une permission individuelle
export const addPermissionToGaragiste = async (req, res) => {
  try {
    const { GaragisteId, permissionId } = req.body;

    const newPerm = await GaragistePermission.create({
      GaragisteId,
      permissionId
    });

    await newPerm.populate('permissionId');

    res.status(201).json({
      message: 'Permission ajoutée avec succès',
      data: newPerm
    });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Supprimer une permission individuelle
export const deleteGaragistePermission = async (req, res) => {
  try {
    await GaragistePermission.findByIdAndDelete(req.params.id);
    res.json({ message: 'Permission retirée avec succès' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


