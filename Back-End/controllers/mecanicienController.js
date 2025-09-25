import Mecanicien from '../models/Mecanicien.js';
import { validateTunisianPhone, validatePhoneMiddleware } from '../utils/phoneValidator.js';
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
      garagisteId: req.user._id   // ✅ lien avec le garagiste
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
      { _id: id, garagisteId: req.user._id },  // ✅ filtrage par garagisteId
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
    const mecanicien = await Mecanicien.findOneAndDelete({_id: id, garagisteId: req.user._id });
    if (!mecanicien) return res.status(404).json({ error: "Mécanicien non trouvé" });
    res.json({ message: "Mécanicien supprimé avec succès" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 📌 Récupérer tous les mécaniciens
export const getAllMecaniciens = async (req, res) => {
  try {
    const mecaniciens = await Mecanicien.find({ garagisteId: req.user._id });
    res.json(mecaniciens);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 📌 Récupérer un mécanicien par ID
export const getMecanicienById = async (req, res) => {
  try {
    const { id } = req.params;
    const mecanicien = await Mecanicien.findOne({ id, garagisteId: req.user._id });
    if (!mecanicien) return res.status(404).json({ error: "Mécanicien non trouvé" });
    res.json(mecanicien);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


// GET /api/mecaniciens/by-service/:serviceId
export const getMecaniciensByService = async (req, res) => {
  try {
    const { serviceId } = req.params;

    // ⚠️ convertir en ObjectId
    const serviceObjectId = new mongoose.Types.ObjectId(serviceId);

    // recherche dans le tableau "services"
    const mecaniciens = await Mecanicien.find({
      "services.serviceId": serviceObjectId,
      garagisteId: req.user._id 
    });

    if (!mecaniciens || mecaniciens.length === 0) {
      return res.status(404).json({ error: `Aucun mécanicien trouvé pour le service ${serviceId}` });
    }

    res.json(mecaniciens);
  } catch (error) {
    console.error("❌ Erreur getMecaniciensByService:", error);
    res.status(500).json({ error: error.message });
  }
};