// controllers/userController.js
import { User } from "../models/User.js";




export const getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }
    res.json(req.user);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};



// POST /api/complete-profile
export const completeProfile = async (req, res) => {
  try {
    const updates = {};
    const allowedFields = ['username','email', 'phone', 'city', 'location'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined && req.body[field] !== '') {
        updates[field] = req.body[field];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true }
    );

    res.json({ message: 'Profil mis à jour', user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
