// controllers/ProfileController.js - Version corrigée
import { User } from "../models/User.js";

export const getProfile = async (req, res) => {
  try {
    console.log('👤 GetProfile appelé pour:', req.user.email);
    
    // L'utilisateur est déjà disponible via le middleware
    const user = req.user;
    
    // Retourner les données dans le format attendu par le frontend
    const userProfile = {
      _id: user._id,
      username: user.username || "",
      email: user.email || "",
      phone: user.phone || "",
      governorateId: user.governorateId || "", // ✅ Corrigé: governorateId
      cityId: user.cityId || "",               // ✅ Corrigé: cityId
      streetId: user.streetId || "",           // ✅ Corrigé: streetId
      location: user.location,                 // ✅ Coordonnées de la ville
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    console.log('📤 Profil retourné:', {
      email: userProfile.email,
      hasUsername: !!userProfile.username,
      hasPhone: !!userProfile.phone,
      governorateId: userProfile.governorateId,
      cityId: userProfile.cityId,
      streetId: userProfile.streetId,
      hasLocation: !!userProfile.location
    });

    res.json(userProfile);
  } catch (error) {
    console.error('❌ Erreur getProfile:', error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const completeProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { username, email, phone, governorateId, cityId, streetId, location } = req.body; // ✅ IDs corrects

    console.log('📥 Données reçues pour completeProfile:', {
      username,
      email,
      phone,
      governorateId,
      cityId,
      streetId,
      location
    });

    // Construction correcte de l'objet de mise à jour
    const updateData = {
      username: username?.trim(),
      email,
      phone: phone?.trim(),
      governorateId, // ✅ ObjectId du gouvernorat
      cityId,        // ✅ ObjectId de la ville
    };

    // ✅ Ajouter streetId seulement s'il n'est pas vide
    if (streetId && streetId.trim() !== '') {
      updateData.streetId = streetId;
    }

    // Ajouter location seulement si elle est fournie (coordonnées de la ville)
    if (location && location.type === 'Point' && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
      updateData.location = {
        type: "Point",
        coordinates: location.coordinates // ✅ Déjà au format [lng, lat] depuis la ville
      };
      
      console.log('📍 Location de la ville sauvegardée:', {
        coordinates: updateData.location.coordinates
      });
    }

    // Validation des champs obligatoires
    if (!updateData.username || !updateData.phone || !governorateId || !cityId) {
      return res.status(400).json({ 
        message: "Champs obligatoires manquants: nom d'utilisateur, téléphone, gouvernorat et ville" 
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    console.log('✅ Profil mis à jour avec succès pour:', updatedUser.email);

    res.json({ 
      message: "Profil mis à jour avec succès",
      user: {
        username: updatedUser.username,
        email: updatedUser.email,
        phone: updatedUser.phone,
        governorateId: updatedUser.governorateId,
        cityId: updatedUser.cityId,
        streetId: updatedUser.streetId,
        location: updatedUser.location
      }
    });

  } catch (err) {
    console.error("❌ Erreur completeProfile:", err);
    
    // Gestion d'erreurs spécifiques
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        message: "Erreur de validation",
        errors: Object.keys(err.errors).map(key => ({
          field: key,
          message: err.errors[key].message
        }))
      });
    }

    if (err.code === 11000) {
      return res.status(400).json({
        message: "Ce nom d'utilisateur ou email est déjà utilisé"
      });
    }

    res.status(500).json({
      message: "Erreur serveur",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
    });
  }
};