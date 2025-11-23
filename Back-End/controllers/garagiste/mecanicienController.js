import Mecanicien from '../../models/Mecanicien.js';
import { validateTunisianPhone, validatePhoneMiddleware } from '../../utils/phoneValidator.js';
import mongoose from "mongoose";


// 📌 Créer un mécanicien
export const createMecanicien = async (req, res) => {
  try {
    // Valider le téléphone
    const phoneValidation = validateTunisianPhone(req.body.telephone);
    if (!phoneValidation.isValid) {
      return res.status(400).json({ error: phoneValidation.message });
    }
    
    // Normaliser le numéro
    req.body.telephone = phoneValidation.cleanNumber;
    
    const mecanicien = new Mecanicien({
      ...req.body,
      garageId: req.user.garageId   // ✅ lien avec le garagiste
    });
    await mecanicien.save();
    res.status(201).json(mecanicien);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateMecanicien = async (req, res) => {
  try {
    // Valider le téléphone si il est modifié
    if (req.body.telephone) {
      const phoneValidation = validateTunisianPhone(req.body.telephone);
      if (!phoneValidation.isValid) {
        return res.status(400).json({ error: phoneValidation.message });
      }
      
      // Normaliser le numéro
      req.body.telephone = phoneValidation.cleanNumber;
    }
    
    const { id } = req.params;
    const mecanicien = await Mecanicien.findOneAndUpdate(
      { _id: id, garageId: req.user.garageId },  // ✅ filtrage par garageId
      req.body,                               // champs à mettre à jour
      { new: true }
    );

    if (!mecanicien) {
      return res.status(404).json({ error: 'Mécanicien non trouvé pour ce garagiste' });
    }

    if (!mecanicien) return res.status(404).json({ error: "Mécanicien non trouvé" });
    res.json(mecanicien);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 📌 Supprimer un mécanicien
export const deleteMecanicien = async (req, res) => {
  try {
    const { id } = req.params;
    const mecanicien = await Mecanicien.findOneAndDelete({_id: id, garageId: req.user.garageId});
    if (!mecanicien) return res.status(404).json({ error: "Mécanicien non trouvé" });
    res.json({ message: "Mécanicien supprimé avec succès" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 📌 Récupérer tous les mécaniciens
export const getAllMecaniciens = async (req, res) => {
  try {
    const mecaniciens = await Mecanicien.find({ garageId: req.user.garageId });
    res.json(mecaniciens);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 📌 Récupérer un mécanicien par ID
export const getMecanicienById = async (req, res) => {
  try {
    const { id } = req.params;
    const mecanicien = await Mecanicien.findOne({ id,garageId: req.user.garageId });
    if (!mecanicien) return res.status(404).json({ error: "Mécanicien non trouvé" });
    res.json(mecanicien);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


// GET /api/mecaniciens/by-service/:serviceId
// GET /api/mecaniciens/by-service/:serviceId
export const getMecaniciensByService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { garageId } = req.query; // ⭐ Peut être fourni si SuperAdmin

    // ⭐ Déterminer quel garage utiliser
    let targetGarageId;

    if (req.user.isSuperAdmin && garageId) {
      // SuperAdmin → garage passé dans query params
      targetGarageId = garageId;
    } else if (!req.user.isSuperAdmin) {
      // Garagiste → son propre garage
      targetGarageId = req.user.garageId || req.user.garage;
    }

    if (!targetGarageId) {
      return res.status(400).json({
        success: false,
        error: "Aucun garageId valide fourni."
      });
    }

    // ⚠️ Convertir serviceId en ObjectId
    const serviceObjectId = new mongoose.Types.ObjectId(serviceId);

    console.log("🔍 Recherche mécaniciens pour service:", serviceId, "dans garage:", targetGarageId);

    // 🎯 Recherche des mécaniciens filtrés par service + garage
    const mecaniciens = await Mecanicien.find({
      garageId: targetGarageId,
      "services.serviceId": serviceObjectId
    });

    // ⚠ Aucun mécanicien trouvé
    if (!mecaniciens || mecaniciens.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Aucun mécanicien trouvé pour le service ${serviceId} dans ce garage.`
      });
    }

    // 🎉 Succès
    return res.json({
      success: true,
      mecaniciens
    });

  } catch (error) {
    console.error("❌ Erreur getMecaniciensByService:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
