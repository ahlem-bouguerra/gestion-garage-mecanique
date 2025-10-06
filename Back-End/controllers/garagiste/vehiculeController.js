import Vehicule from '../../models/Vehicule.js';
import FicheClient from '../../models/FicheClient.js';
import FicheClientVehicule from '../../models/FicheClientVehicule.js';

export const getAllVehicules = async (req, res) => {
  try {
    // Récupérer les IDs des ficheClients du garage
    const mesClients = await FicheClient.find({ 
      garagisteId: req.user._id 
    }).select('_id');
    
    const clientIds = mesClients.map(c => c._id);
    
    // Récupérer les véhicules liés via la table de liaison
    const liaisons = await FicheClientVehicule.find({
      ficheClientId: { $in: clientIds },
      garageId: req.user._id
    }).select('vehiculeId');
    
    const vehiculeIds = liaisons.map(l => l.vehiculeId);
    
    // Récupérer les véhicules
    const vehicules = await Vehicule.find({
      _id: { $in: vehiculeIds },
      statut: 'actif'
    })
    .populate('proprietaireId')
    .sort({ createdAt: -1 });

    console.log("✅ Véhicules récupérés:", vehicules.length);
    res.json(vehicules);
  } catch (error) {
    console.error("❌ Erreur getAllVehicules:", error);
    res.status(500).json({ error: error.message });
  }
};


export const getVehiculeById = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que le garage a accès à ce véhicule
    const liaison = await FicheClientVehicule.findOne({
      vehiculeId: id,
      garageId: req.user._id
    });
    
    if (!liaison) {
      return res.status(403).json({ error: 'Vous n\'avez pas accès à ce véhicule' });
    }

    const vehicule = await Vehicule.findById(id)
      .populate('proprietaireId');

    if (!vehicule) {
      return res.status(404).json({ error: 'Véhicule non trouvé' });
    }

    res.json(vehicule);
  } catch (error) {
    console.error("❌ Erreur getVehiculeById:", error);
    res.status(500).json({ error: error.message });
  }
};

export const createVehicule = async (req, res) => {
  try {
    const {
      proprietaireId, // ID de la ficheClient
      marque,
      modele,
      immatriculation,
      annee,
      couleur,
      typeCarburant,
      kilometrage
    } = req.body;

    console.log("📝 Création véhicule - Données reçues:", req.body);

    // Validation
    if (!proprietaireId || !marque || !modele || !immatriculation) {
      return res.status(400).json({
        error: 'Les champs propriétaire, marque, modèle et immatriculation sont obligatoires'
      });
    }

    const immatriculationFormatee = immatriculation.toUpperCase().trim();

    // ✅ MODIFIÉ : Vérifier l'immatriculation GLOBALEMENT (pas par garage)
    const vehiculeExistant = await Vehicule.findOne({
      immatriculation: immatriculationFormatee
    });

    if (vehiculeExistant) {
      // ✅ Le véhicule existe déjà - Juste créer la liaison
      console.log("ℹ️ Véhicule existe déjà, création liaison uniquement");
      
      // Vérifier que la ficheClient appartient au garage
      const ficheClient = await FicheClient.findOne({
        _id: proprietaireId,
        garagisteId: req.user._id
      });
      
      if (!ficheClient) {
        return res.status(400).json({ error: 'Client non trouvé dans votre garage' });
      }
      
      // Vérifier si la liaison existe déjà
      const liaisonExistante = await FicheClientVehicule.findOne({
        ficheClientId: proprietaireId,
        vehiculeId: vehiculeExistant._id,
        garageId: req.user._id
      });
      
      if (liaisonExistante) {
        return res.status(400).json({ error: 'Ce véhicule est déjà associé à ce client' });
      }
      
      // Créer la liaison
      await FicheClientVehicule.create({
        ficheClientId: proprietaireId,
        vehiculeId: vehiculeExistant._id,
        garageId: req.user._id
      });
      
      // Ajouter le garage à l'historique si pas déjà présent
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
      
      const vehiculeAvecProprietaire = await Vehicule.findById(vehiculeExistant._id)
        .populate('proprietaireId');
      
      return res.status(200).json({
        message: 'Véhicule existant associé au client',
        vehicule: vehiculeAvecProprietaire
      });
    }

    // ✅ Nouveau véhicule - Créer
    const ficheClient = await FicheClient.findOne({
      _id: proprietaireId,
      garagisteId: req.user._id
    });
    
    if (!ficheClient) {
      return res.status(400).json({ error: 'Client non trouvé' });
    }

    const vehiculeData = {
      proprietaireId: ficheClient.clientId || proprietaireId, // Si ficheClient a un lien vers Client, utiliser celui-là
      proprietaireModel: ficheClient.clientId ? 'Client' : 'FicheClient',
      marque: marque.trim(),
      modele: modele.trim(),
      immatriculation: immatriculationFormatee,
      statut: 'actif',
      creePar: 'garagiste',
      garagisteCreateurId: req.user._id,
      historique_garages: [{
        garageId: req.user._id,
        datePremiereVisite: new Date()
      }]
    };

    // Champs optionnels
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

    console.log("📝 Données véhicule à sauvegarder:", vehiculeData);

    const nouveauVehicule = new Vehicule(vehiculeData);
    const vehiculeSauve = await nouveauVehicule.save();

    // Créer la liaison
    await FicheClientVehicule.create({
      ficheClientId: proprietaireId,
      vehiculeId: vehiculeSauve._id,
      garageId: req.user._id
    });

    const vehiculeAvecProprietaire = await Vehicule.findById(vehiculeSauve._id)
      .populate('proprietaireId');

    console.log("✅ Véhicule créé avec succès:", vehiculeAvecProprietaire);
    res.status(201).json(vehiculeAvecProprietaire);

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

    // ✅ NOUVEAU : Vérifier accès via liaison
    const liaison = await FicheClientVehicule.findOne({
      vehiculeId: id,
      garageId: req.user._id
    });

    if (!liaison) {
      return res.status(403).json({
        error: 'Vous n\'avez pas accès à ce véhicule'
      });
    }

    // Vérifier que le véhicule existe
    const vehiculeExistant = await Vehicule.findById(id);
    if (!vehiculeExistant) {
      return res.status(404).json({ error: 'Véhicule non trouvé' });
    }

    // ⚠️ INTERDIRE modification de l'immatriculation (car partagée entre garages)
    if (immatriculation && immatriculation !== vehiculeExistant.immatriculation) {
      return res.status(403).json({
        error: 'Impossible de modifier l\'immatriculation d\'un véhicule existant'
      });
    }

    // ⚠️ INTERDIRE changement de propriétaire (car impact autres garages)
    if (proprietaireId && proprietaireId !== vehiculeExistant.proprietaireId.toString()) {
      return res.status(403).json({
        error: 'Impossible de modifier le propriétaire d\'un véhicule partagé'
      });
    }

    // Préparer les données de mise à jour (champs non-critiques uniquement)
    const updateData = {};

    // ✅ Autorisé : infos techniques du véhicule
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

// ✅ Supprimer liaison (pas le véhicule lui-même)
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

export const getVehiculesByProprietaire = async (req, res) => {
  try {
    const { clientId } = req.params;

    console.log("🔍 Recherche véhicules pour ficheClient:", clientId);

    // Vérifier que le client appartient au garage
    const ficheClient = await FicheClient.findOne({
      _id: clientId,
      garagisteId: req.user._id
    });
    
    if (!ficheClient) {
      return res.status(404).json({ error: 'Client non trouvé dans votre garage' });
    }

    // Récupérer les véhicules via la liaison
    const liaisons = await FicheClientVehicule.find({
      ficheClientId: clientId,
      garageId: req.user._id
    }).select('vehiculeId');
    
    const vehiculeIds = liaisons.map(l => l.vehiculeId);
    
    const vehicules = await Vehicule.find({
      _id: { $in: vehiculeIds },
      statut: 'actif'
    })
    .populate('proprietaireId')
    .sort({ createdAt: -1 });

    console.log("✅ Véhicules trouvés pour", ficheClient.nom, ":", vehicules.length);
    res.json(vehicules);
  } catch (error) {
    console.error("❌ Erreur getVehiculesByProprietaire:", error);
    res.status(500).json({ error: `Erreur serveur: ${error.message}` });
  }
};
