import Vehicule from '../../models/Vehicule.js';
import immValidator from "../../../shared/immatriculationValidator.mjs";
const { validateImmatriculation } = immValidator;

export const createVehiculeClient = async (req, res) => {
  try {
    const {
      marque,
      modele,
      immatriculation,
      paysImmatriculation,
      annee,
      couleur,
      typeCarburant,
      kilometrage
    } = req.body;

    const clientId = req.client._id;

    if (!marque || !modele || !immatriculation) {
      return res.status(400).json({
        error: 'Marque, modèle et immatriculation obligatoires'
      });
    }

    // Utiliser directement 'tunisie' ou 'autre'
    const countryCode = paysImmatriculation || 'tunisie';

    // Validation
    const validation = validateImmatriculation(immatriculation, countryCode);

    if (!validation.valid) {
      return res.status(400).json({
        error: validation.message
      });
    }

    const immatriculationFormatee = validation.formatted;

    // Vérifier si existe déjà
    const existant = await Vehicule.findOne({
      immatriculation: immatriculationFormatee
    });

    if (existant) {
      if (existant.proprietaireId.toString() === clientId.toString() &&
          existant.proprietaireModel === 'Client') {
        return res.status(400).json({
          error: 'Vous avez déjà enregistré ce véhicule'
        });
      }

      return res.status(400).json({
        error: 'Cette immatriculation existe déjà dans le système'
      });
    }

    // Créer le véhicule
    const vehiculeData = {
      proprietaireId: clientId,
      proprietaireModel: 'Client',
      marque: marque.trim(),
      modele: modele.trim(),
      immatriculation: immatriculationFormatee,
      paysImmatriculation: validation.detectedCountry || countryCode,  // ✅ 'tunisie' ou 'autre'
      creePar: 'client',
      statut: 'actif',
      historique_garages: []
    };

    if (annee) vehiculeData.annee = parseInt(annee);
    if (couleur) vehiculeData.couleur = couleur.trim();
    if (typeCarburant) vehiculeData.typeCarburant = typeCarburant.toLowerCase();
    if (kilometrage) vehiculeData.kilometrage = parseInt(kilometrage);

    const vehicule = await Vehicule.create(vehiculeData);

    res.status(201).json(vehicule);
  } catch (error) {
    console.error("❌ Erreur createVehiculeClient:", error);
    res.status(500).json({ error: error.message });
  }
};
// ✅ Client récupère SES véhicules
export const getMesVehicules = async (req, res) => {
  try {
    const clientId = req.client._id;

    const vehicules = await Vehicule.find({
      proprietaireId: clientId,
      proprietaireModel: 'Client',
      statut: 'actif'
    })
    .populate({
      path: 'historique_garages.garageId',
      select: 'nom telephone adresse'
    })
    .sort({ createdAt: -1 });

    res.json(vehicules);
  } catch (error) {
    console.error("❌ Erreur getMesVehicules:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Client modifie SON véhicule
export const updateMonVehicule = async (req, res) => {
  try {
    const { vehiculeId } = req.params;
    const clientId = req.client._id;
    const updates = req.body;

    const vehicule = await Vehicule.findOne({
      _id: vehiculeId,
      proprietaireId: clientId,
      proprietaireModel: 'Client'
    });

    if (!vehicule) {
      return res.status(404).json({ error: 'Véhicule non trouvé' });
    }

    // Client peut tout modifier sauf immatriculation
    const allowedUpdates = ['marque', 'modele', 'annee', 'couleur', 'typeCarburant', 'kilometrage'];
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        vehicule[key] = updates[key];
      }
    });

    await vehicule.save();

    res.json(vehicule);
  } catch (error) {
    console.error("❌ Erreur updateMonVehicule:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Client supprime SON véhicule (soft delete)
export const deleteMonVehicule = async (req, res) => {
  try {
    const { vehiculeId } = req.params;
    const clientId = req.client._id;

    const vehicule = await Vehicule.findOneAndUpdate(
      {
        _id: vehiculeId,
        proprietaireId: clientId,
        proprietaireModel: 'Client'
      },
      { statut: 'inactif' },
      { new: true }
    );

    if (!vehicule) {
      return res.status(404).json({ error: 'Véhicule non trouvé' });
    }

    res.json({ message: 'Véhicule supprimé avec succès' });
  } catch (error) {
    console.error("❌ Erreur deleteMonVehicule:", error);
    res.status(500).json({ error: error.message });
  }
};