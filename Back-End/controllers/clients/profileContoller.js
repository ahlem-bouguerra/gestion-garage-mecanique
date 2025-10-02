// controllers/ProfileController.js
import { Client } from "../../models/Client.js";

// Récupérer le profil (existant)
export const getProfile = async (req, res) => {
  try {
    console.log('👤 GetProfile appelé pour:', req.client.email);

    const client = await Client.findById(req.client._id);
   
    if (!client) {
      console.log('❌ Utilisateur non trouvé pour ID:', req.client._id);
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const clientProfile = {
      _id: client._id,
      username: client.username || "",
      email: client.email || "",
      phone: client.phone || "",
      isVerified: client.isVerified,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt
    };
    
    console.log('📤 Profil retourné:', {
      email: clientProfile.email,
      hasUsername: !!clientProfile.username,
      hasPhone: !!clientProfile.phone,
    });

    res.json(clientProfile);

  } catch (error) {
    console.error('❌ Erreur getProfile:', error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Mettre à jour le profil
export const updateProfile = async (req, res) => {
  try {
    console.log('✏️ UpdateProfile appelé pour:', req.client.email);
    console.log('📥 Données reçues:', req.body);

    const { username, phone } = req.body;

    // Récupérer l'utilisateur
    const client = await Client.findById(req.client._id);
    
    if (!client) {
      console.log('❌ Utilisateur non trouvé pour ID:', req.client._id);
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Validation des données
    const errors = [];

    // Valider le username (optionnel mais avec conditions si fourni)
    if (username !== undefined) {
      if (username.trim() === '') {
        errors.push("Le nom d'utilisateur ne peut pas être vide");
      } else if (username.length < 2) {
        errors.push("Le nom d'utilisateur doit contenir au moins 2 caractères");
      } else if (username.length > 50) {
        errors.push("Le nom d'utilisateur ne peut pas dépasser 50 caractères");
      }
    }

    // Valider le téléphone (optionnel mais avec conditions si fourni)
    if (phone !== undefined && phone.trim() !== '') {
      const phoneRegex = /^[0-9+\s()-]{8,20}$/;
      if (!phoneRegex.test(phone)) {
        errors.push("Le numéro de téléphone n'est pas valide");
      }
    }

    // Si des erreurs de validation
    if (errors.length > 0) {
      console.log('❌ Erreurs de validation:', errors);
      return res.status(400).json({ 
        message: "Erreurs de validation",
        errors: errors 
      });
    }

    // Préparer les champs à mettre à jour
    const updateData = {};
    
    if (username !== undefined && username.trim() !== '') {
      updateData.username = username.trim();
    }
    
    if (phone !== undefined) {
      updateData.phone = phone.trim();
    }

    // Vérifier qu'il y a quelque chose à mettre à jour
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        message: "Aucune donnée à mettre à jour" 
      });
    }

    console.log('🔄 Données à mettre à jour:', updateData);

    // Mettre à jour l'utilisateur
    const updatedClient = await Client.findByIdAndUpdate(
      req.client._id,
      { $set: updateData },
      { 
        new: true, // Retourner le document mis à jour
        runValidators: true // Exécuter les validateurs du modèle
      }
    );

    if (!updatedClient) {
      console.log('❌ Erreur lors de la mise à jour');
      return res.status(500).json({ message: "Erreur lors de la mise à jour" });
    }

    // Préparer la réponse
    const clientProfile = {
      _id: updatedClient._id,
      username: updatedClient.username || "",
      email: updatedClient.email || "",
      phone: updatedClient.phone || "",
      isVerified: updatedClient.isVerified,
      createdAt: updatedClient.createdAt,
      updatedAt: updatedClient.updatedAt
    };

    console.log('✅ Profil mis à jour avec succès:', {
      email: clientProfile.email,
      username: clientProfile.username,
      phone: clientProfile.phone
    });

    res.json(clientProfile);

  } catch (error) {
    console.error('❌ Erreur updateProfile:', error);
    
    // Gérer les erreurs de validation Mongoose
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: "Erreurs de validation",
        errors: errors 
      });
    }

    res.status(500).json({ message: "Erreur serveur" });
  }
};