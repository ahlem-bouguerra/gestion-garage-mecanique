import Vehicule from '../../models/Vehicule.js';
import FicheClient from '../../models/FicheClient.js';
import FicheClientVehicule from '../../models/FicheClientVehicule.js';
import {Client} from '../../models/Client.js';

// ==========================================
// 📋 RÉCUPÉRER TOUS LES VÉHICULES DU GARAGE
// ==========================================
export const getAllVehicules = async (req, res) => {
  try {
    const mesClients = await FicheClient.find({ 
      garagisteId: req.user._id 
    }).select('_id');
    
    const clientIds = mesClients.map(c => c._id);
    
    const liaisons = await FicheClientVehicule.find({
      ficheClientId: { $in: clientIds },
      garageId: req.user._id
    }).select('vehiculeId ficheClientId'); // ✅ Inclure ficheClientId
    
    const vehiculeIds = liaisons.map(l => l.vehiculeId);
    
    // ✅ Récupérer les véhicules SANS populate
    const vehicules = await Vehicule.find({
      _id: { $in: vehiculeIds },
      statut: 'actif'
    }).sort({ createdAt: -1 });

    // ✅ Créer un map des liaisons
    const liaisonMap = {};
    liaisons.forEach(l => {
      liaisonMap[l.vehiculeId.toString()] = l.ficheClientId;
    });

    // ✅ Récupérer toutes les fiches clients correspondantes
    const fichesClients = await FicheClient.find({
      _id: { $in: Object.values(liaisonMap) }
    });

    const ficheMap = {};
    fichesClients.forEach(f => {
      ficheMap[f._id.toString()] = f;
    });

    // ✅ Enrichir les véhicules avec les infos de FicheClient
    const vehiculesAvecClient = vehicules.map(vehicule => {
      const vehiculeObj = vehicule.toObject();
      const ficheClientId = liaisonMap[vehicule._id.toString()];
      const ficheClient = ficheMap[ficheClientId?.toString()];
      
      // ✅ Remplacer proprietaireId par les données de la FicheClient
      vehiculeObj.proprietaireId = ficheClient || {
        nom: 'Client inconnu',
        type: 'particulier',
        telephone: 'N/A'
      };
      
      return vehiculeObj;
    });

    console.log("✅ Véhicules récupérés:", vehiculesAvecClient.length);
    res.json(vehiculesAvecClient);
  } catch (error) {
    console.error("❌ Erreur getAllVehicules:", error);
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// 🔍 RÉCUPÉRER UN VÉHICULE PAR ID
// ==========================================
export const getVehiculeById = async (req, res) => {
  try {
    const { id } = req.params;

    const liaison = await FicheClientVehicule.findOne({
      vehiculeId: id,
      garageId: req.user._id
    });
    
    if (!liaison) {
      return res.status(403).json({ error: 'Vous n\'avez pas accès à ce véhicule' });
    }

    const vehicule = await Vehicule.findById(id);

    if (!vehicule) {
      return res.status(404).json({ error: 'Véhicule non trouvé' });
    }

    // ✅ Récupérer la FicheClient du garage
    const ficheClient = await FicheClient.findById(liaison.ficheClientId);

    const vehiculeAvecClient = vehicule.toObject();
    vehiculeAvecClient.proprietaireId = ficheClient || {
      nom: 'Client inconnu',
      type: 'particulier'
    };

    res.json(vehiculeAvecClient);
  } catch (error) {
    console.error("❌ Erreur getVehiculeById:", error);
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// 🚗 VÉHICULES D'UN CLIENT
// ==========================================
export const getVehiculesByProprietaire = async (req, res) => {
  try {
    const { clientId } = req.params;

    console.log("🔍 Recherche véhicules pour ficheClient:", clientId);

    const ficheClient = await FicheClient.findOne({
      _id: clientId,
      garagisteId: req.user._id
    });
    
    if (!ficheClient) {
      return res.status(404).json({ error: 'Client non trouvé dans votre garage' });
    }

    const liaisons = await FicheClientVehicule.find({
      ficheClientId: clientId,
      garageId: req.user._id
    }).select('vehiculeId');
    
    const vehiculeIds = liaisons.map(l => l.vehiculeId);
    
    const vehicules = await Vehicule.find({
      _id: { $in: vehiculeIds },
      statut: 'actif'
    }).sort({ createdAt: -1 });

    // ✅ Enrichir avec les infos de FicheClient
    const vehiculesAvecClient = vehicules.map(v => {
      const vObj = v.toObject();
      vObj.proprietaireId = ficheClient;
      return vObj;
    });

    console.log("✅ Véhicules trouvés pour", ficheClient.nom, ":", vehiculesAvecClient.length);
    res.json(vehiculesAvecClient);
  } catch (error) {
    console.error("❌ Erreur getVehiculesByProprietaire:", error);
    res.status(500).json({ error: `Erreur serveur: ${error.message}` });
  }
};

// ==========================================
// ➕ CRÉER UN VÉHICULE (GARAGE)
// ==========================================
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

    if (!proprietaireId || !marque || !modele || !immatriculation) {
      return res.status(400).json({
        error: 'Les champs propriétaire, marque, modèle et immatriculation sont obligatoires'
      });
    }

    const immatriculationFormatee = immatriculation.toUpperCase().trim();

    const vehiculeExistant = await Vehicule.findOne({
      immatriculation: immatriculationFormatee
    });

    if (vehiculeExistant) {
      console.log("ℹ️ Véhicule existe déjà, création liaison uniquement");
      
      const ficheClient = await FicheClient.findOne({
        _id: proprietaireId,
        garagisteId: req.user._id
      });
      
      if (!ficheClient) {
        return res.status(400).json({ error: 'Client non trouvé dans votre garage' });
      }
      
      const liaisonExistante = await FicheClientVehicule.findOne({
        ficheClientId: proprietaireId,
        vehiculeId: vehiculeExistant._id,
        garageId: req.user._id
      });
      
      if (liaisonExistante) {
        return res.status(400).json({ error: 'Ce véhicule est déjà associé à ce client' });
      }
      
      await FicheClientVehicule.create({
        ficheClientId: proprietaireId,
        vehiculeId: vehiculeExistant._id,
        garageId: req.user._id
      });
      
      const dejaVisiteParGarage = vehiculeExistant.historique_garages.some(
        h => h.garageId.toString() === req.user._id.toString()
      );
      
      if (!dejaVisiteParGarage) {
        vehiculeExistant.historique_garages.push({
          garageId: req.user._id,
          datePremiereVisite: new Date()
        });
        await vehiculeExistant.save();
      }
      
      // ✅ Retourner avec FicheClient
      const vehiculeAvecClient = vehiculeExistant.toObject();
      vehiculeAvecClient.proprietaireId = ficheClient;
      
      return res.status(200).json({
        message: 'Véhicule existant associé au client',
        vehicule: vehiculeAvecClient
      });
    }

    // ✅ NOUVEAU VÉHICULE
    const ficheClient = await FicheClient.findOne({
      _id: proprietaireId,
      garagisteId: req.user._id
    });
    
    if (!ficheClient) {
      return res.status(400).json({ error: 'Client non trouvé' });
    }

    let proprietaireIdFinal;
    let proprietaireModelFinal;
    
    const clientPlateforme = await Client.findOne({ 
      telephone: ficheClient.telephone 
    });
    
    if (clientPlateforme) {
      proprietaireIdFinal = clientPlateforme._id;
      proprietaireModelFinal = 'Client';
      console.log("👤 Propriétaire: Client plateforme", clientPlateforme._id);
    } else {
      proprietaireIdFinal = ficheClient._id;
      proprietaireModelFinal = 'FicheClient';
      console.log("📋 Propriétaire: FicheClient", ficheClient._id);
    }

    const vehiculeData = {
      proprietaireId: proprietaireIdFinal,
      proprietaireModel: proprietaireModelFinal,
      marque: marque.trim(),
      modele: modele.trim(),
      immatriculation: immatriculationFormatee,
      statut: 'actif',
      creePar: 'garagiste',
      garagisteId: req.user._id,
      historique_garages: [{
        garageId: req.user._id,
        datePremiereVisite: new Date()
      }]
    };

    if (annee && !isNaN(parseInt(annee))) {
      const anneeInt = parseInt(annee);
      if (anneeInt >= 1900 && anneeInt <= 2025) {
        vehiculeData.annee = anneeInt;
      }
    }
    if (couleur && couleur.trim()) vehiculeData.couleur = couleur.trim();
    if (typeCarburant && typeCarburant.trim()) {
      const carburantsValides = ['essence', 'diesel', 'hybride', 'electrique', 'gpl'];
      if (carburantsValides.includes(typeCarburant.toLowerCase())) {
        vehiculeData.typeCarburant = typeCarburant.toLowerCase();
      }
    }
    if (kilometrage && !isNaN(parseInt(kilometrage))) {
      const kmInt = parseInt(kilometrage);
      if (kmInt >= 0) vehiculeData.kilometrage = kmInt;
    }

    const nouveauVehicule = new Vehicule(vehiculeData);
    const vehiculeSauve = await nouveauVehicule.save();

    await FicheClientVehicule.create({
      ficheClientId: proprietaireId,
      vehiculeId: vehiculeSauve._id,
      garageId: req.user._id
    });

    // ✅ Retourner avec FicheClient
    const vehiculeAvecClient = vehiculeSauve.toObject();
    vehiculeAvecClient.proprietaireId = ficheClient;

    console.log("✅ Véhicule créé avec succès");
    res.status(201).json(vehiculeAvecClient);

  } catch (error) {
    console.error("❌ Erreur createVehicule:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Cette immatriculation existe déjà dans le système'
      });
    }
    
    res.status(500).json({ error: `Erreur serveur: ${error.message}` });
  }
};

// ==========================================
// 🔄 MODIFIER UN VÉHICULE
// ==========================================
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

    const liaison = await FicheClientVehicule.findOne({
      vehiculeId: id,
      garageId: req.user._id
    });

    if (!liaison) {
      return res.status(403).json({
        error: 'Vous n\'avez pas accès à ce véhicule'
      });
    }

    const vehiculeExistant = await Vehicule.findById(id);
    if (!vehiculeExistant) {
      return res.status(404).json({ error: 'Véhicule non trouvé' });
    }

    if (immatriculation && immatriculation !== vehiculeExistant.immatriculation) {
      return res.status(403).json({
        error: 'Impossible de modifier l\'immatriculation'
      });
    }

    if (proprietaireId && proprietaireId !== vehiculeExistant.proprietaireId.toString()) {
      return res.status(403).json({
        error: 'Impossible de modifier le propriétaire'
      });
    }

    const updateData = {};

    if (marque && marque.trim()) updateData.marque = marque.trim();
    if (modele && modele.trim()) updateData.modele = modele.trim();

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

    const vehiculeModifie = await Vehicule.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // ✅ Récupérer la FicheClient
    const ficheClient = await FicheClient.findById(liaison.ficheClientId);
    
    const vehiculeAvecClient = vehiculeModifie.toObject();
    vehiculeAvecClient.proprietaireId = ficheClient;

    res.json(vehiculeAvecClient);

  } catch (error) {
    console.error("❌ Erreur updateVehicule:", error);

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

// ==========================================
// 🗑️ DISSOCIER UN VÉHICULE
// ==========================================
export const dissocierVehicule = async (req, res) => {
  try {
    const { ficheClientId, vehiculeId } = req.params;
    const garageId = req.user._id;

    const liaison = await FicheClientVehicule.findOneAndDelete({
      ficheClientId,
      vehiculeId,
      garageId
    });

    if (!liaison) {
      return res.status(404).json({ error: 'Liaison non trouvée' });
    }

    res.json({ message: 'Véhicule dissocié avec succès' });
  } catch (error) {
    console.error("❌ Erreur dissocierVehicule:", error);
    res.status(500).json({ error: error.message });
  }
};