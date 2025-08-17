// controllers/vehiculeController.js
import Vehicule from '../models/Vehicule.js';
import FicheClient from '../models/FicheClient.js'; // Votre modèle client existant

// GET /api/vehicules - Récupérer tous les véhicules
export const getAllVehicules = async (req, res) => {
  try {
    const vehicules = await Vehicule.find({ statut: 'actif' })
      .populate('proprietaireId', 'nom type telephone email')
      .sort({ createdAt: -1 });
    
    res.json(vehicules);
  } catch (error) {
    console.error("❌ Erreur getAllVehicules:", error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/vehicules/:id - Récupérer un véhicule spécifique
export const getVehiculeById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const vehicule = await Vehicule.findById(id)
      .populate('proprietaireId', 'nom type telephone email');
    
    if (!vehicule) {
      return res.status(404).json({ error: 'Véhicule non trouvé' });
    }
    
    res.json(vehicule);
  } catch (error) {
    console.error("❌ Erreur getVehiculeById:", error);
    res.status(500).json({ error: error.message });
  }
};

// POST /api/vehicules - Créer un nouveau véhicule
export const createVehicule = async (req, res) => {
  try {
    const {
      proprietaireId,
      marque,
      modele,
      immatriculation,
      annee,
      couleur,
      typeCarburant,
      kilometrage
    } = req.body;

    console.log("📝 Création véhicule:", req.body);

    // Vérifier que le propriétaire existe
    const proprietaire = await FicheClient.findById(proprietaireId);
    if (!proprietaire) {
      return res.status(400).json({ error: 'Propriétaire non trouvé' });
    }

    // Vérifier l'unicité de l'immatriculation
    const existingVehicule = await Vehicule.findOne({ 
      immatriculation: immatriculation.toUpperCase() 
    });
    if (existingVehicule) {
      return res.status(400).json({ error: 'Cette immatriculation existe déjà' });
    }

    // Créer le véhicule
    const nouveauVehicule = new Vehicule({
      proprietaireId,
      marque: marque.trim(),
      modele: modele.trim(),
      immatriculation: immatriculation.toUpperCase().trim(),
      annee: annee ? parseInt(annee) : undefined,
      couleur: couleur?.trim(),
      typeCarburant,
      kilometrage: kilometrage ? parseInt(kilometrage) : undefined
    });

    const vehiculeSauve = await nouveauVehicule.save();
    
    // Peupler les données du propriétaire pour la réponse
    const vehiculeAvecProprietaire = await Vehicule.findById(vehiculeSauve._id)
      .populate('proprietaireId', 'nom type telephone email');

    console.log("✅ Véhicule créé:", vehiculeAvecProprietaire);
    res.status(201).json(vehiculeAvecProprietaire);

  } catch (error) {
    console.error("❌ Erreur createVehicule:", error);
    
    // Gestion des erreurs de validation MongoDB
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Cette immatriculation existe déjà' });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/vehicules/:id - Modifier un véhicule
export const updateVehicule = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      proprietaireId,
      marque,
      modele,
      immatriculation,
      annee,
      couleur,
      typeCarburant,
      kilometrage
    } = req.body;

    console.log("🔄 Modification véhicule ID:", id);
    console.log("🔄 Données reçues:", req.body);

    // Vérifier que le véhicule existe
    const vehiculeExistant = await Vehicule.findById(id);
    if (!vehiculeExistant) {
      return res.status(404).json({ error: 'Véhicule non trouvé' });
    }

    // Vérifier que le propriétaire existe
    if (proprietaireId) {
      const proprietaire = await FicheClient.findById(proprietaireId);
      if (!proprietaire) {
        return res.status(400).json({ error: 'Propriétaire non trouvé' });
      }
    }

    // Vérifier l'unicité de l'immatriculation (exclure le véhicule actuel)
    if (immatriculation) {
      const existingVehicule = await Vehicule.findOne({ 
        immatriculation: immatriculation.toUpperCase(),
        _id: { $ne: id }
      });
      if (existingVehicule) {
        return res.status(400).json({ error: 'Cette immatriculation existe déjà' });
      }
    }

    // Préparer les données de mise à jour
    const updateData = {};
    if (proprietaireId) updateData.proprietaireId = proprietaireId;
    if (marque) updateData.marque = marque.trim();
    if (modele) updateData.modele = modele.trim();
    if (immatriculation) updateData.immatriculation = immatriculation.toUpperCase().trim();
    if (annee) updateData.annee = parseInt(annee);
    if (couleur !== undefined) updateData.couleur = couleur.trim();
    if (typeCarburant) updateData.typeCarburant = typeCarburant;
    if (kilometrage !== undefined) updateData.kilometrage = kilometrage ? parseInt(kilometrage) : null;

    // Mettre à jour le véhicule
    const vehiculeModifie = await Vehicule.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('proprietaireId', 'nom type telephone email');

    console.log("✅ Véhicule modifié:", vehiculeModifie);
    res.json(vehiculeModifie);

  } catch (error) {
    console.error("❌ Erreur updateVehicule:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Cette immatriculation existe déjà' });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/vehicules/:id - Supprimer un véhicule
export const deleteVehicule = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("🗑️ Suppression véhicule ID:", id);

    // Soft delete : marquer comme inactif au lieu de supprimer
    const vehicule = await Vehicule.findByIdAndUpdate(
      id,
      { statut: 'inactif' },
      { new: true }
    );

    if (!vehicule) {
      return res.status(404).json({ error: 'Véhicule non trouvé' });
    }

    // Ou suppression complète si préféré :
    // await Vehicule.findByIdAndDelete(id);

    console.log("✅ Véhicule supprimé:", vehicule);
    res.json({ message: 'Véhicule supprimé avec succès' });

  } catch (error) {
    console.error("❌ Erreur deleteVehicule:", error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/vehicules/proprietaire/:clientId - Véhicules d'un client
export const getVehiculesByProprietaire = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    const vehicules = await Vehicule.find({ 
      proprietaireId: clientId,
      statut: 'actif'
    }).sort({ createdAt: -1 });
    
    res.json(vehicules);
  } catch (error) {
    console.error("❌ Erreur getVehiculesByProprietaire:", error);
    res.status(500).json({ error: error.message });
  }
};