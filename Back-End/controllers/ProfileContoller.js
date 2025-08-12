// controllers/userController.js
import { User } from "../models/User.js";

export const getProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // PROBLÈME CORRIGÉ: Vérifier si location existe et a des coordonnées
    let location = null;
    if (user.location && 
        user.location.coordinates && 
        Array.isArray(user.location.coordinates) && 
        user.location.coordinates.length === 2) {
      // MongoDB GeoJSON: coordinates = [lng, lat] → Leaflet: [lat, lng]
      location = [user.location.coordinates[1], user.location.coordinates[0]];
    }

    return res.json({
      username: user.username,
      email: user.email,
      phone: user.phone,
      city: user.city,
      location,  // soit un tableau [lat, lng], soit null
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

export const completeProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { username, email, phone, city, location } = req.body;

    // PROBLÈME CORRIGÉ: Construction correcte de l'objet de mise à jour
    const updateData = {
      username,
      email,
      phone,
      city,
    };

    // Ajouter location seulement si elle est fournie
    if (location && Array.isArray(location) && location.length === 2) {
      // location = [lat, lng] côté client → GeoJSON [lng, lat]
      updateData.location = { 
        type: "Point", 
        coordinates: [location[1], location[0]] 
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.json({ message: "Profil mis à jour avec succès" });
  } catch (err) {
    console.error("Erreur completeProfile:", err);
    res.status(500).json({ 
      message: "Erreur serveur", 
      error: err.message 
    });
  }
};