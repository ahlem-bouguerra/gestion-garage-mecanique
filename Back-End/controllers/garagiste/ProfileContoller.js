// controllers/ProfileController.js - Version corrigée
import { User } from "../../models/User.js";
import Governorate from "../../models/Governorate.js";
import City from "../../models/City.js";

export const getProfile = async (req, res) => {
  try {
    console.log('👤 GetProfile appelé pour:', req.user.email);

    // Récupérer l'utilisateur avec populate pour governorate et city
    const user = await User.findById(req.user._id)
      .populate("governorateId", "name")
      .populate("cityId", "name");

    if (!user) {
      console.log('❌ Utilisateur non trouvé pour ID:', req.user._id);
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const userProfile = {
      _id: user._id,
      username: user.username || "",
      garagenom: user.garagenom || "",
      matriculefiscal: user.matriculefiscal || "",
      email: user.email || "",
      phone: user.phone || "",

      // ✅ CORRECTION: Retourner les ObjectIds ET les noms
      governorateId: user.governorateId?._id || user.governorateId , // ObjectId
      governorateName: user.governorateId?.name || user.governorateName , // Nom

      cityId: user.cityId?._id || user.cityId || "",  // ObjectId  
      cityName: user.cityId?.name || user.cityName || "", // Nom

      streetAddress: user.streetAddress || "",
      location: user.location,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    console.log('📤 Profil retourné:', {
      email: userProfile.email,
      hasUsername: !!userProfile.username,
      hasGaragenom: !!userProfile.garagenom,
      hasMatriculefiscal: !!userProfile.matriculefiscal,
      hasPhone: !!userProfile.phone,
      governorateId: userProfile.governorateId,
      cityId: userProfile.cityId,
      streetAddress: userProfile.streetAddress,
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
    // On destructure directement les données reçues, y compris les noms
    const { username, garagenom, matriculefiscal, email, phone, governorateId, governorateName, cityId, cityName, streetAddress, location } = req.body;

    console.log('📥 Données reçues pour completeProfile:', {
      username,
      garagenom,
      matriculefiscal,
      email,
      phone,
      governorateId,
      cityId,
      governorateName,
      cityName,
      streetAddress,
      location
    });

    const updateData = {
      username: username?.trim(),
      garagenom: garagenom?.trim(),
      matriculefiscal: matriculefiscal?.trim(),
      email,
      phone: phone?.trim(),
      governorateId,
      cityId,
      // ✅ On utilise directement les noms envoyés par le front-end
      governorateName: governorateName || "",
      cityName: cityName || "",
    };

    // Le reste de votre code reste inchangé...
    if (streetAddress && streetAddress.trim() !== '') {
      updateData.streetAddress = streetAddress;
    }

    if (location && location.type === 'Point' && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
      updateData.location = {
        type: "Point",
        coordinates: location.coordinates
      };
    }

    if (!updateData.username || !updateData.matriculefiscal || !updateData.garagenom || !updateData.phone || !governorateId || !cityId) {
      return res.status(400).json({
        message: "Champs obligatoires manquants: nom d'utilisateur, garagenom, téléphone, gouvernorat et ville"
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
        garagenom: updatedUser.garagenom,
        matriculefiscal: updatedUser.matriculefiscal,
        email: updatedUser.email,
        phone: updatedUser.phone,
        governorateId: updatedUser.governorateId,
        cityId: updatedUser.cityId,
        streetAddress: updatedUser.streetAddress,
        location: updatedUser.location
      }
    });

  } catch (err) {
    console.error("❌ Erreur completeProfile:", err);
    // ... (suite de la gestion des erreurs)
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