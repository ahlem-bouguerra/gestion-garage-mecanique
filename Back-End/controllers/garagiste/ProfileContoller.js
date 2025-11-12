// controllers/garagiste/ProfileController.js - Version corrigée
import { Garagiste } from "../../models/Garagiste.js";
import { Garage } from "../../models/Garage.js";

export const getProfile = async (req, res) => {
  try {
    console.log('👤 GetProfile appelé pour:', req.user.email);

    const garagiste = req.user; // Déjà chargé par authMiddleware

    // ⚠️ Cette vérification est redondante car authMiddleware l'a déjà fait
    if (!garagiste) {
      console.log('❌ Garagiste non trouvé');
      return res.status(404).json({ message: "Garagiste non trouvé" });
    }

    // Construire la réponse du profil
    const userProfile = {
      id: garagiste._id,
      username: garagiste.username || "",
      email: garagiste.email || "",
      phone: garagiste.phone || "",
      img: garagiste.img || "/images/user/user-03.png",
      isVerified: garagiste.isVerified,
      isActive: garagiste.isActive,
      
      garage: garagiste.garage ? {
        id: garagiste.garage._id,
        nom: garagiste.garage.nom,
        matriculeFiscal: garagiste.garage.matriculeFiscal,
        governorateName: garagiste.garage.governorateName || "",
        cityName: garagiste.garage.cityName || "",
        isActive: garagiste.garage.isActive
      } : null,
      
      createdAt: garagiste.createdAt,
      updatedAt: garagiste.updatedAt
    };

    console.log('📤 Profil retourné:', {
      email: userProfile.email,
      garage: userProfile.garage?.nom || 'Aucun garage'
    });

    res.json(userProfile);
   
  } catch (error) {
    console.error('❌ Erreur getProfile:', error);
    res.status(500).json({ 
      message: "Erreur serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};



// ========== METTRE À JOUR LE PROFIL GARAGISTE ==========
export const updateProfile = async (req, res) => {
  try {
    const garagisteId = req.user._id
    const { username, phone, img } = req.body;

    console.log('📥 Mise à jour profil garagiste:', { garagisteId, username, phone });

    // Validation
    if (!username || !phone) {
      return res.status(400).json({
        message: "Le nom d'utilisateur et le téléphone sont requis"
      });
    }

    // Mettre à jour le garagiste
    const updatedGaragiste = await Garagiste.findByIdAndUpdate(
      garagisteId,
      {
        username: username.trim(),
        phone: phone.trim(),
        ...(img && { img })
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedGaragiste) {
      return res.status(404).json({ message: "Garagiste non trouvé" });
    }

    console.log('✅ Profil garagiste mis à jour:', updatedGaragiste.email);

    res.json({
      message: "Profil mis à jour avec succès",
      user: {
        id: updatedGaragiste._id,
        username: updatedGaragiste.username,
        email: updatedGaragiste.email,
        phone: updatedGaragiste.phone,
        img: updatedGaragiste.img,
       
      }
    });

  } catch (error) {
    console.error("❌ Erreur updateProfile:", error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: "Erreur de validation",
        errors: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }

    res.status(500).json({
      message: "Erreur serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ========== METTRE À JOUR LES INFOS DU GARAGE ==========
export const updateGarageInfo = async (req, res) => {
  try {
    const garagisteId = req.user._id
    const {
      nom,
      governorateId,
      governorateName,
      cityId,
      cityName,
      streetAddress,
      location,
      description,
      logo,
      horaires,
      services
    } = req.body;

    console.log('📥 Mise à jour infos garage pour garagiste:', garagisteId);

    // Récupérer le garagiste
    const garagiste = await Garagiste.findById(garagisteId);
    if (!garagiste) {
      return res.status(404).json({ message: "Garagiste non trouvé" });
    }

    // Vérifier qu'il a un garage
    if (!garagiste.garage) {
      return res.status(404).json({ 
        message: "Aucun garage associé à ce compte" 
      });
    }

    // Vérifier qu'il est admin du garage
    const garage = await Garage.findById(garagiste.garage);
    if (!garage) {
      return res.status(404).json({ message: "Garage non trouvé" });
    }

    if (garage.garagisteAdmin.toString() !== garagisteId.toString()) {
      return res.status(403).json({ 
        message: "Seul l'admin du garage peut modifier ces informations" 
      });
    }

    // Préparer les données de mise à jour
    const updateData = {};
    
    if (nom) updateData.nom = nom.trim();
    if (governorateId) updateData.governorateId = governorateId;
    if (governorateName) updateData.governorateName = governorateName.trim();
    if (cityId) updateData.cityId = cityId;
    if (cityName) updateData.cityName = cityName.trim();
    if (streetAddress !== undefined) updateData.streetAddress = streetAddress.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (logo !== undefined) updateData.logo = logo.trim();
    if (horaires !== undefined) updateData.horaires = horaires.trim();
    if (services) updateData.services = services;
    
    // Gérer la location
    if (location && location.type === 'Point' && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
      updateData.location = {
        type: "Point",
        coordinates: location.coordinates
      };
    }

    // Mettre à jour le garage
    const updatedGarage = await Garage.findByIdAndUpdate(
      garage._id,
      updateData,
      { new: true, runValidators: true }
    );

    console.log('✅ Garage mis à jour:', updatedGarage.nom);

    res.json({
      message: "Informations du garage mises à jour avec succès",
      garage: {
        id: updatedGarage._id,
        nom: updatedGarage.nom,
        matriculeFiscal: updatedGarage.matriculeFiscal,
        governorateId: updatedGarage.governorateId,
        governorateName: updatedGarage.governorateName,
        cityId: updatedGarage.cityId,
        cityName: updatedGarage.cityName,
        streetAddress: updatedGarage.streetAddress,
        location: updatedGarage.location,
        description: updatedGarage.description,
        logo: updatedGarage.logo,
        horaires: updatedGarage.horaires,
        services: updatedGarage.services
      }
    });

  } catch (error) {
    console.error("❌ Erreur updateGarageInfo:", error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: "Erreur de validation",
        errors: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }

    res.status(500).json({
      message: "Erreur serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ========== COMPLÉTER LE PROFIL (ANCIENNE VERSION - DÉPRÉCIÉ) ==========
// ⚠️ Cette fonction n'est plus nécessaire car le garage est créé par le super admin
// Gardée pour compatibilité temporaire
export const completeProfile = async (req, res) => {
  return res.status(400).json({
    message: "Cette fonctionnalité est dépréciée. Le garage est créé par le super admin.",
    deprecated: true
  });
};