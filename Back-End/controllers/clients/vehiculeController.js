import Vehicule from '../../models/Vehicule.js';
import immValidator from "../../shared/immatriculationValidator.mjs";
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

    console.log("📝 Création véhicule client - Données reçues:", req.body);

    // ✅ Validation des champs obligatoires
    if (!marque || !modele || !immatriculation) {
      return res.status(400).json({
        error: 'Les champs marque, modèle et immatriculation sont obligatoires'
      });
    }

    // ✅ Validation du pays
    const countryCode = paysImmatriculation || 'tunisie';
    const validation = validateImmatriculation(immatriculation, countryCode);

    if (!validation.valid) {
      return res.status(400).json({
        error: validation.message
      });
    }

    const immatriculationFormatee = validation.formatted;

    // ✅ Vérifier si le véhicule existe déjà
    const vehiculeExistant = await Vehicule.findOne({
      immatriculation: immatriculationFormatee
    });

    if (vehiculeExistant) {
      console.log("ℹ️ Véhicule existe déjà");

      // Si c'est déjà son véhicule
      if (vehiculeExistant.proprietaireId.toString() === clientId.toString() &&
          vehiculeExistant.proprietaireModel === 'Client') {
        return res.status(400).json({
          error: 'Vous avez déjà enregistré ce véhicule'
        });
      }

      // Si appartient à quelqu'un d'autre
      return res.status(400).json({
        error: 'Cette immatriculation existe déjà dans le système'
      });
    }

    // ✅ CRÉATION D'UN NOUVEAU VÉHICULE
    const vehiculeData = {
      proprietaireId: clientId,
      proprietaireModel: 'Client',
      marque: marque.trim(),
      modele: modele.trim(),
      immatriculation: immatriculationFormatee,
      paysImmatriculation: validation.detectedCountry || countryCode,
      statut: 'actif',
      creePar: 'client',
      historique_garages: [] // Sera rempli quand il ira dans un garage
    };

    // ✅ Validation et ajout de l'année (comme côté garage)
    if (annee && !isNaN(parseInt(annee))) {
      const anneeInt = parseInt(annee);
      if (anneeInt >= 1900 && anneeInt <= 2025) {
        vehiculeData.annee = anneeInt;
      } else {
        return res.status(400).json({ 
          error: 'L\'année doit être entre 1900 et 2025' 
        });
      }
    }

    // ✅ Couleur
    if (couleur && couleur.trim()) {
      vehiculeData.couleur = couleur.trim();
    }

    // ✅ Validation du type de carburant (comme côté garage)
    if (typeCarburant && typeCarburant.trim()) {
      const carburantsValides = ['essence', 'diesel', 'hybride', 'electrique', 'gpl'];
      const carburantLower = typeCarburant.toLowerCase();
      
      if (carburantsValides.includes(carburantLower)) {
        vehiculeData.typeCarburant = carburantLower;
      } else {
        return res.status(400).json({
          error: `Type de carburant invalide. Valeurs acceptées: ${carburantsValides.join(', ')}`
        });
      }
    }

    // ✅ Validation du kilométrage (comme côté garage)
    if (kilometrage && !isNaN(parseInt(kilometrage))) {
      const kmInt = parseInt(kilometrage);
      if (kmInt >= 0) {
        vehiculeData.kilometrage = kmInt;
      } else {
        return res.status(400).json({ 
          error: 'Le kilométrage doit être un nombre positif' 
        });
      }
    }

    // ✅ NOUVEAU : Gestion de la carte grise (comme côté garage)
    if (req.body.carteGrise) {
      const { 
        numeroCG, 
        numeroChassis, 
        dateMiseCirculation, 
        puissanceFiscale, 
        genre, 
        nombrePlaces, 
        dateVisite, 
        dateProchaineVisite 
      } = req.body.carteGrise;
      
      // Champs obligatoires pour la carte grise
      if (numeroCG && numeroChassis && dateMiseCirculation && puissanceFiscale) {
        vehiculeData.carteGrise = {
          numeroCG: numeroCG.trim().toUpperCase(),
          numeroChassis: numeroChassis.trim().toUpperCase(),
          dateMiseCirculation: new Date(dateMiseCirculation),
          puissanceFiscale: parseInt(puissanceFiscale),
          genre: genre || 'VP',
          nombrePlaces: nombrePlaces ? parseInt(nombrePlaces) : 5
        };
        
        if (dateVisite) {
          vehiculeData.carteGrise.dateVisite = new Date(dateVisite);
        }
        if (dateProchaineVisite) {
          vehiculeData.carteGrise.dateProchaineVisite = new Date(dateProchaineVisite);
        }
      }
    }

    // ✅ Créer le véhicule
    const nouveauVehicule = new Vehicule(vehiculeData);
    const vehiculeSauve = await nouveauVehicule.save();

    console.log("✅ Véhicule créé avec succès par le client");
    res.status(201).json(vehiculeSauve);

  } catch (error) {
    console.error("❌ Erreur createVehiculeClient:", error);

    // ✅ Gestion des erreurs de validation (comme côté garage)
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: errors.join(', ') });
    }

    // ✅ Gestion des doublons
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Cette immatriculation existe déjà dans le système'
      });
    }

    // ✅ Gestion des erreurs de cast
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Format de données incorrect' });
    }

    res.status(500).json({ error: `Erreur serveur: ${error.message}` });
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
    const {
      marque,
      modele,
      immatriculation,
      proprietaireId,
      annee,
      couleur,
      typeCarburant,
      kilometrage
    } = req.body;

    console.log("📝 Mise à jour véhicule client - Données reçues:", req.body);

    // ✅ Vérifier que le véhicule appartient au client
    const vehicule = await Vehicule.findOne({
      _id: vehiculeId,
      proprietaireId: clientId,
      proprietaireModel: 'Client'
    });

    if (!vehicule) {
      return res.status(404).json({ error: 'Véhicule non trouvé' });
    }

    // ✅ INTERDICTIONS (comme côté garage)
    if (immatriculation && immatriculation !== vehicule.immatriculation) {
      return res.status(403).json({
        error: 'Impossible de modifier l\'immatriculation'
      });
    }

    if (proprietaireId && proprietaireId !== vehicule.proprietaireId.toString()) {
      return res.status(403).json({
        error: 'Impossible de modifier le propriétaire'
      });
    }

    // ✅ Objet pour les mises à jour validées
    const updateData = {};

    // ✅ Marque
    if (marque && marque.trim()) {
      updateData.marque = marque.trim();
    }

    // ✅ Modèle
    if (modele && modele.trim()) {
      updateData.modele = modele.trim();
    }

    // ✅ Année (avec validation stricte)
    if (annee !== undefined) {
      if (annee === '' || annee === null) {
        updateData.annee = undefined;
      } else {
        const anneeInt = parseInt(annee);
        if (!isNaN(anneeInt) && anneeInt >= 1900 && anneeInt <= 2025) {
          updateData.annee = anneeInt;
        } else {
          return res.status(400).json({ 
            error: 'L\'année doit être entre 1900 et 2025' 
          });
        }
      }
    }

    // ✅ Couleur (permet de vider le champ)
    if (couleur !== undefined) {
      updateData.couleur = couleur ? couleur.trim() : '';
    }

    // ✅ Type de carburant (avec validation)
    if (typeCarburant && typeCarburant.trim()) {
      const carburantsValides = ['essence', 'diesel', 'hybride', 'electrique', 'gpl'];
      const carburantLower = typeCarburant.toLowerCase();
      
      if (carburantsValides.includes(carburantLower)) {
        updateData.typeCarburant = carburantLower;
      } else {
        return res.status(400).json({
          error: `Type de carburant invalide. Valeurs acceptées: ${carburantsValides.join(', ')}`
        });
      }
    }

    // ✅ Kilométrage (avec validation)
    if (kilometrage !== undefined) {
      if (kilometrage === '' || kilometrage === null) {
        updateData.kilometrage = undefined;
      } else {
        const kmInt = parseInt(kilometrage);
        if (!isNaN(kmInt) && kmInt >= 0) {
          updateData.kilometrage = kmInt;
        } else {
          return res.status(400).json({ 
            error: 'Le kilométrage doit être un nombre positif' 
          });
        }
      }
    }

    // ✅ NOUVEAU : Mise à jour carte grise
    if (req.body.carteGrise) {
      const { 
        numeroCG, 
        numeroChassis, 
        dateMiseCirculation, 
        puissanceFiscale, 
        genre, 
        nombrePlaces, 
        dateVisite, 
        dateProchaineVisite 
      } = req.body.carteGrise;
      
      updateData.carteGrise = {};
      
      if (numeroCG) {
        updateData.carteGrise.numeroCG = numeroCG.trim().toUpperCase();
      }
      if (numeroChassis) {
        updateData.carteGrise.numeroChassis = numeroChassis.trim().toUpperCase();
      }
      if (dateMiseCirculation) {
        updateData.carteGrise.dateMiseCirculation = new Date(dateMiseCirculation);
      }
      if (puissanceFiscale) {
        updateData.carteGrise.puissanceFiscale = parseInt(puissanceFiscale);
      }
      if (genre) {
        updateData.carteGrise.genre = genre;
      }
      if (nombrePlaces) {
        updateData.carteGrise.nombrePlaces = parseInt(nombrePlaces);
      }
      if (dateVisite) {
        updateData.carteGrise.dateVisite = new Date(dateVisite);
      }
      if (dateProchaineVisite) {
        updateData.carteGrise.dateProchaineVisite = new Date(dateProchaineVisite);
      }
    }

    // ✅ Appliquer les mises à jour avec validation
    const vehiculeModifie = await Vehicule.findByIdAndUpdate(
      vehiculeId,
      updateData,
      { new: true, runValidators: true }
    );

    console.log("✅ Véhicule mis à jour avec succès");
    res.json(vehiculeModifie);

  } catch (error) {
    console.error("❌ Erreur updateMonVehicule:", error);

    // ✅ Gestion des erreurs de validation
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: errors.join(', ') });
    }

    // ✅ Gestion des erreurs de cast
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Format de données incorrect' });
    }

    res.status(500).json({ error: `Erreur serveur: ${error.message}` });
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