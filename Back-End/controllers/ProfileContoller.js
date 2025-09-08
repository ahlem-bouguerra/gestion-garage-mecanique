// controllers/ProfileController.js - Version corrigée
import { User } from "../models/User.js";

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
      governorateId: user.governorateId || "", // sera un objet { _id, name }
      cityId: user.cityId || "",             // sera un objet { _id, name }
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
      governorateId: userProfile.governorateId?.name,
      cityId: userProfile.cityId?.name,
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
    const { username,garagenom,matriculefiscal, email, phone, governorateId, cityId, streetAddress, location } = req.body; // ✅ IDs corrects

    console.log('📥 Données reçues pour completeProfile:', {
      username,
      garagenom,
      matriculefiscal,
      email,
      phone,
      governorateId,
      cityId,
      streetAddress,
      location
    });

    // Construction correcte de l'objet de mise à jour
    const updateData = {
      username: username?.trim(),
      garagenom: garagenom?.trim(),
      matriculefiscal: matriculefiscal?.trim(),
      email,
      phone: phone?.trim(),
      governorateId, // ✅ ObjectId du gouvernorat
      cityId,        // ✅ ObjectId de la ville
    };

    // ✅ Ajouter streetAddress seulement s'il n'est pas vide
    if (streetAddress && streetAddress.trim() !== '') {
      updateData.streetAddress = streetAddress;
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
    if (!updateData.username ||!updateData.matriculefiscal ||!updateData.garagenom || !updateData.phone || !governorateId || !cityId) {
      return res.status(400).json({ 
        message: "Champs obligatoires manquants: nom d'utilisateur,garagenom, téléphone, gouvernorat et ville" 
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
        matriculefiscal : updatedUser.matriculefiscal,
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