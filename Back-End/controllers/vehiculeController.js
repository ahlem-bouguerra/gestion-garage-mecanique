// controllers/vehiculeController.js
import Vehicule from '../models/Vehicule.js';
import FicheClient from '../models/FicheClient.js';

// GET /api/vehicules - Récupérer tous les véhicules
export const getAllVehicules = async (req, res) => {
  try {
    const vehicules = await Vehicule.find({ statut: 'actif' })
      .populate('proprietaireId', 'nom type telephone email')
      .sort({ createdAt: -1 });
    
    console.log("✅ Véhicules récupérés:", vehicules.length);
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

    console.log("📝 Création véhicule - Données reçues:", req.body);

    // CORRECTION 1: Validation des champs requis
    if (!proprietaireId || !marque || !modele || !immatriculation) {
      return res.status(400).json({ 
        error: 'Les champs propriétaire, marque, modèle et immatriculation sont obligatoires' 
      });
    }

        // Vérifier l'unicité de l'immatriculation
    const immatriculationFormatee = immatriculation.toUpperCase().trim();
    const existingVehicule = await Vehicule.findOne({ 
      immatriculation: immatriculationFormatee 
    });
    
    if (existingVehicule) {
      return res.status(400).json({ 
        error: `Cette immatriculation (${immatriculationFormatee}) existe déjà` 
      });
    }

    // CORRECTION 2: Vérifier que le propriétaire existe avec meilleure gestion d'erreur
    const proprietaire = await FicheClient.findById(proprietaireId);
    if (!proprietaire) {
      console.log("❌ Propriétaire non trouvé:", proprietaireId);
      return res.status(400).json({ 
        error: `Propriétaire avec l'ID ${proprietaireId} non trouvé` 
      });
    }

    console.log("✅ Propriétaire trouvé:", proprietaire.nom);



    // CORRECTION 3: Validation et conversion des types
    const vehiculeData = {
      proprietaireId,
      marque: marque.trim(),
      modele: modele.trim(),
      immatriculation: immatriculationFormatee,
      statut: 'actif'
    };

    // Ajouter les champs optionnels seulement s'ils sont fournis
    if (annee && !isNaN(parseInt(annee))) {
      const anneeInt = parseInt(annee);
      if (anneeInt >= 1900 && anneeInt <= 2025) {
        vehiculeData.annee = anneeInt;
      } else {
        return res.status(400).json({ error: 'L\'année doit être entre 1900 et 2025' });
      }
    }

    if (couleur && couleur.trim()) {
      vehiculeData.couleur = couleur.trim();
    }

    if (typeCarburant && typeCarburant.trim()) {
      const carburantsValides = ['essence', 'diesel', 'hybride', 'electrique', 'gpl'];
      if (carburantsValides.includes(typeCarburant.toLowerCase())) {
        vehiculeData.typeCarburant = typeCarburant.toLowerCase();
      } else {
        return res.status(400).json({ 
          error: `Type de carburant invalide. Valeurs acceptées: ${carburantsValides.join(', ')}` 
        });
      }
    }

    if (kilometrage && !isNaN(parseInt(kilometrage))) {
      const kmInt = parseInt(kilometrage);
      if (kmInt >= 0) {
        vehiculeData.kilometrage = kmInt;
      } else {
        return res.status(400).json({ error: 'Le kilométrage doit être positif' });
      }
    }

    console.log("📝 Données véhicule à sauvegarder:", vehiculeData);

    // Créer le véhicule
    const nouveauVehicule = new Vehicule(vehiculeData);
    const vehiculeSauve = await nouveauVehicule.save();
    
    // Peupler les données du propriétaire pour la réponse
    const vehiculeAvecProprietaire = await Vehicule.findById(vehiculeSauve._id)
      .populate('proprietaireId', 'nom type telephone email');

    console.log("✅ Véhicule créé avec succès:", vehiculeAvecProprietaire);
    res.status(201).json(vehiculeAvecProprietaire);

  } catch (error) {
    console.error("❌ Erreur createVehicule:", error);
    
    // CORRECTION 4: Meilleure gestion des erreurs
    if (error.code === 11000) {
      // Erreur de duplication
      const field = Object.keys(error.keyValue)[0];
      const value = error.keyValue[field];
      return res.status(400).json({ 
        error: `${field === 'immatriculation' ? 'Cette immatriculation' : 'Cette valeur'} (${value}) existe déjà` 
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: errors.join(', ') });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Format de données incorrect' });
    }
    
    res.status(500).json({ error: `Erreur serveur: ${error.message}` });
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

    // Vérifier que le propriétaire existe si fourni
    if (proprietaireId) {
      const proprietaire = await FicheClient.findById(proprietaireId);
      if (!proprietaire) {
        return res.status(400).json({ 
          error: `Propriétaire avec l'ID ${proprietaireId} non trouvé` 
        });
      }
    }

    // Vérifier l'unicité de l'immatriculation (exclure le véhicule actuel)
    if (immatriculation) {
      const immatriculationFormatee = immatriculation.toUpperCase().trim();
      const existingVehicule = await Vehicule.findOne({ 
        immatriculation: immatriculationFormatee,
        _id: { $ne: id }
      });
      if (existingVehicule) {
        return res.status(400).json({ 
          error: `Cette immatriculation (${immatriculationFormatee}) existe déjà` 
        });
      }
    }

    // Préparer les données de mise à jour avec validation
    const updateData = {};
    
    if (proprietaireId) updateData.proprietaireId = proprietaireId;
    if (marque && marque.trim()) updateData.marque = marque.trim();
    if (modele && modele.trim()) updateData.modele = modele.trim();
    if (immatriculation && immatriculation.trim()) {
      updateData.immatriculation = immatriculation.toUpperCase().trim();
    }
    
    if (annee !== undefined) {
      if (annee === '' || annee === null) {
        updateData.annee = undefined;
      } else {
        const anneeInt = parseInt(annee);
        if (!isNaN(anneeInt) && anneeInt >= 1900 && anneeInt <= 2025) {
          updateData.annee = anneeInt;
        } else {
          return res.status(400).json({ error: 'L\'année doit être entre 1900 et 2025' });
        }
      }
    }
    
    if (couleur !== undefined) {
      updateData.couleur = couleur ? couleur.trim() : '';
    }
    
    if (typeCarburant && typeCarburant.trim()) {
      const carburantsValides = ['essence', 'diesel', 'hybride', 'electrique', 'gpl'];
      if (carburantsValides.includes(typeCarburant.toLowerCase())) {
        updateData.typeCarburant = typeCarburant.toLowerCase();
      } else {
        return res.status(400).json({ 
          error: `Type de carburant invalide. Valeurs acceptées: ${carburantsValides.join(', ')}` 
        });
      }
    }
    
    if (kilometrage !== undefined) {
      if (kilometrage === '' || kilometrage === null) {
        updateData.kilometrage = undefined;
      } else {
        const kmInt = parseInt(kilometrage);
        if (!isNaN(kmInt) && kmInt >= 0) {
          updateData.kilometrage = kmInt;
        } else {
          return res.status(400).json({ error: 'Le kilométrage doit être un nombre positif' });
        }
      }
    }

    console.log("🔄 Données de mise à jour:", updateData);

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
      const field = Object.keys(error.keyValue)[0];
      const value = error.keyValue[field];
      return res.status(400).json({ 
        error: `${field === 'immatriculation' ? 'Cette immatriculation' : 'Cette valeur'} (${value}) existe déjà` 
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: errors.join(', ') });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Format de données incorrect' });
    }
    
    res.status(500).json({ error: `Erreur serveur: ${error.message}` });
  }
};

// DELETE /api/vehicules/:id - Supprimer un véhicule
export const deleteVehicule = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("🗑️ Suppression véhicule ID:", id);

    // Vérifier que le véhicule existe
    const vehiculeExistant = await Vehicule.findById(id);
    if (!vehiculeExistant) {
      return res.status(404).json({ error: 'Véhicule non trouvé' });
    }

    // Soft delete : marquer comme inactif au lieu de supprimer
    const vehicule = await Vehicule.findByIdAndUpdate(
      id,
      { statut: 'inactif' },
      { new: true }
    );

    console.log("✅ Véhicule supprimé (soft delete):", vehicule.immatriculation);
    res.json({ 
      message: 'Véhicule supprimé avec succès',
      vehicule: vehicule
    });

  } catch (error) {
    console.error("❌ Erreur deleteVehicule:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'ID de véhicule invalide' });
    }
    
    res.status(500).json({ error: `Erreur serveur: ${error.message}` });
  }
};

// GET /api/vehicules/proprietaire/:clientId - Véhicules d'un client
export const getVehiculesByProprietaire = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    console.log("🔍 Recherche véhicules pour client:", clientId);
    
    // Vérifier que le client existe
    const client = await FicheClient.findById(clientId);
    if (!client) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }
    
    const vehicules = await Vehicule.find({ 
      proprietaireId: clientId,
      statut: 'actif'
    }).sort({ createdAt: -1 });
    
    console.log("✅ Véhicules trouvés pour", client.nom, ":", vehicules.length);
    res.json(vehicules);
  } catch (error) {
    console.error("❌ Erreur getVehiculesByProprietaire:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'ID de client invalide' });
    }
    
    res.status(500).json({ error: `Erreur serveur: ${error.message}` });
  }
};


