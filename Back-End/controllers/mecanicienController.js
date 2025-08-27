import Mecanicien from '../models/Mecanicien.js';
import { validateTunisianPhone, validatePhoneMiddleware } from '../utils/phoneValidator.js';

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
    
    const mecanicien = new Mecanicien(req.body);
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
    const mecanicien = await Mecanicien.findByIdAndUpdate(id, req.body, { new: true });
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
    const mecanicien = await Mecanicien.findByIdAndDelete(id);
    if (!mecanicien) return res.status(404).json({ error: "Mécanicien non trouvé" });
    res.json({ message: "Mécanicien supprimé avec succès" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 📌 Récupérer tous les mécaniciens
export const getAllMecaniciens = async (req, res) => {
  try {
    const mecaniciens = await Mecanicien.find();
    res.json(mecaniciens);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 📌 Récupérer un mécanicien par ID
export const getMecanicienById = async (req, res) => {
  try {
    const { id } = req.params;
    const mecanicien = await Mecanicien.findById(id);
    if (!mecanicien) return res.status(404).json({ error: "Mécanicien non trouvé" });
    res.json(mecanicien);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
