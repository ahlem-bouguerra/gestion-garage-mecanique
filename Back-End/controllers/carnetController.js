import CarnetEntretien from '../models/CarnetEntretien.js';
import Devis from '../models/Devis.js';
import Vehicule from '../models/Vehicule.js';
import OrdreTravail from '../models/Ordre.js';
import mongoose from 'mongoose';

export const getCarnetByVehiculeId = async (req, res) => {
  try {
    const { vehiculeId } = req.params;
    console.log("🔍 Recherche ordres pour vehiculeId:", vehiculeId);

    // Récupérer les carnets existants
    const carnetsExistants = await CarnetEntretien.find({ vehiculeId, garagisteId: req.user._id })
      .populate({
        path: 'devisId',
        select: 'id inspectionDate services totalTTC status'
      })
      .sort({ dateCommencement: -1 });

    console.log("✅ Carnets existants récupérés:", carnetsExistants.length);

    let historique = [];

    if (carnetsExistants.length > 0) {
      // Traiter les carnets existants
      historique = carnetsExistants.map(carnet => ({
        _id: carnet._id,
        dateCommencement: carnet.dateCommencement,
        totalTTC: carnet.totalTTC,
        typeEntretien: carnet.typeEntretien,
        kilometrageEntretien: carnet.kilometrageEntretien,
        devisInfo: carnet.devisId ? {
          id: carnet.devisId.id,
          status: carnet.devisId.status
        } : null,
        services: carnet.services, // ✅ AJOUTER LES SERVICES
        source: 'carnet'
      }));
      console.log("📋 Historique à partir des carnets:", historique);
    } else {
      // Récupérer les ordres de travail terminés
      let ordresTermines = await OrdreTravail.find({
        'vehiculedetails.vehiculeId': vehiculeId,
        status: 'termine',
        garagisteId: req.user._id
      }).sort({ dateFinReelle: -1 });

      console.log("📋 Ordres trouvés (string):", ordresTermines.length);

      // Si aucun ordre trouvé, essayer avec ObjectId
      if (ordresTermines.length === 0) {
        console.log("🔄 Tentative avec ObjectId...");
        ordresTermines = await OrdreTravail.find({
          'vehiculedetails.vehiculeId': new mongoose.Types.ObjectId(vehiculeId),
          status: 'termine',
          garagisteId: req.user._id
        }).sort({ dateFinReelle: -1 });

        console.log("📋 Ordres avec ObjectId:", ordresTermines.length);
      }

      // ✨ NOUVELLE LOGIQUE : Transformer et SAUVEGARDER les ordres dans CarnetEntretien
      historique = await Promise.all(ordresTermines.map(async (ordre) => {
        let devisInfo = null;
        let totalTTC = 0;
        let services = [];
        let devisId = null;

        try {
          // Récupérer le devis associé
          const devis = await Devis.findOne({id: ordre.devisId })
            .select('_id id inspectionDate services totalTTC status');

          console.log(`📝 Devis récupéré pour ordre ${ordre.numeroOrdre}:`, devis);

          if (devis) {
            devisInfo = {
              id: devis.id,
              inspectionDate: devis.inspectionDate,
            };
            totalTTC = devis.totalTTC;
            services = devis.services;
            devisId = devis._id;
          }
        } catch (error) {
          console.error(`❌ Erreur récupération devis ${ordre.devisId}:`, error.message);
        }

        // ✅ CRÉER UN CARNET D'ENTRETIEN DANS LA BASE DE DONNÉES
        try {
          const nouveauCarnet = new CarnetEntretien({
            vehiculeId: new mongoose.Types.ObjectId(vehiculeId),
            devisId: devisId,
            dateCommencement: ordre.dateCommence,
            dateFinCompletion: ordre.dateFinReelle,
            typeEntretien: 'maintenance', // ou déterminer selon les tâches
            statut: 'termine',
            totalTTC: totalTTC,
            kilometrageEntretien: null, // Peut être ajouté plus tard
            notes: `Créé automatiquement depuis l'ordre ${ordre.numeroOrdre}`,
            // Ajouter les détails des tâches si nécessaire
            services: ordre.taches ? ordre.taches.map(tache => ({
              nom: tache.description,
              description: tache.serviceNom,
              quantite: tache.quantite
            })) : []
          });

          // Sauvegarder dans la base de données
          await nouveauCarnet.save();
          console.log(`💾 Carnet d'entretien créé pour ordre ${ordre.numeroOrdre}`);

          // Retourner les données formatées pour l'affichage
          return {
            _id: nouveauCarnet._id, // Utiliser l'ID du nouveau carnet
            numeroOrdre: ordre.numeroOrdre,
            dateCommencement: ordre.dateCommence,
            totalTTC: totalTTC,
            kilometrageEntretien: null,
            devisInfo: devisInfo,
            taches: ordre.taches,
            source: 'carnet' // ✅ Maintenant c'est un carnet sauvegardé
          };

        } catch (saveError) {
          console.error(`❌ Erreur sauvegarde carnet pour ordre ${ordre.numeroOrdre}:`, saveError);
          
          // En cas d'erreur de sauvegarde, retourner quand même les données
          return {
            _id: ordre._id,
            numeroOrdre: ordre.numeroOrdre,
            dateCommencement: ordre.dateCommence,
            totalTTC: totalTTC,
            statut: 'termine',
            kilometrageEntretien: null,
            devisInfo: devisInfo,
            taches: ordre.taches,
            source: 'ordre'
          };
        }
      }));

      console.log("📋 Historique à partir des ordres (maintenant sauvegardés):", historique);
    }

    // Récupérer le véhicule
    const vehicule = await Vehicule.findOne({ _id: vehiculeId, garagisteId: req.user._id })
      .populate('proprietaireId', 'nom type telephone');

    console.log("🚗 Véhicule récupéré:", vehicule);

    if (!vehicule) {
      return res.status(404).json({ error: 'Véhicule non trouvé' });
    }

    console.log("📋 Historique final:", historique.length, "entrées");

    res.json({
      vehicule: {
        _id: vehicule._id,
        marque: vehicule.marque,
        modele: vehicule.modele,
        immatriculation: vehicule.immatriculation,
        annee: vehicule.annee,
        proprietaire: vehicule.proprietaireId,
        typeCarburant: vehicule.typeCarburant,
        kilometrage: vehicule.kilometrage,
      },
      historique,
    });

  } catch (error) {
    console.error('❌ Erreur récupération carnet:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération du carnet d\'entretien',
      details: error.message
    });
  }
};


export const Statistiques = async (req, res) => {
  try {
    const { vehiculeId } = req.params;

    const carnets = await CarnetEntretien.find({ vehiculeId, garagisteId: req.user._id })
      .sort({ dateCommencement: -1 });

    if (carnets.length === 0) {
      return res.json({
        stats: {
          totalEntretiens: 0,
          totalDepense: 0,
          moyenneParEntretien: 0,
          dernierEntretien: null,
          prochainEntretien: null
        }
      });
    }

    const totalDepense = carnets.reduce((sum, carnet) => sum + carnet.totalTTC, 0);
    const moyenneParEntretien = totalDepense / carnets.length;

    // Estimation du prochain entretien (tous les 6 mois ou 10000 km)
    const dernierCarnet = carnets[0];
    const estimationProchainEntretien = new Date(dernierCarnet.dateCommencement);
    estimationProchainEntretien.setMonth(estimationProchainEntretien.getMonth() + 6);

    const stats = {
      totalEntretiens: carnets.length,
      totalDepense,
      moyenneParEntretien,
      dernierEntretien: dernierCarnet.dateCommencement,
      prochainEntretien: estimationProchainEntretien,
      repartitionParType: getRepartitionParType(carnets),
      evolutionDepenses: getEvolutionDepenses(carnets)
    };

    res.json({ stats });

  } catch (error) {
    console.error('Erreur récupération stats:', error);
    res.status(500).json({ 
      error: 'Erreur lors du calcul des statistiques',
      details: error.message 
    });
  }
};

export const creerCarnetManuel = async (req, res) => {
  try {
    const { vehiculeId, date, taches, cout } = req.body;

    // Validation des données
    if (!vehiculeId || !date || !taches || taches.length === 0) {
      return res.status(400).json({ 
        error: 'Données manquantes: vehiculeId, date, taches et cout sont requis' 
      });
    }

    // Vérifier que le véhicule existe
    const vehicule = await Vehicule.findOne({ _id: vehiculeId, garagisteId: req.user._id });
    if (!vehicule) {
      return res.status(404).json({ error: 'Véhicule non trouvé' });
    }

    // Créer le carnet d'entretien manuel
    const nouveauCarnet = new CarnetEntretien({
      vehiculeId: new mongoose.Types.ObjectId(vehiculeId),
      dateCommencement: new Date(date),
      dateFinCompletion: new Date(date), // Même date car c'est un entretien déjà effectué
      typeEntretien: 'maintenance',
      garagisteId: req.user._id,
      statut: 'termine',
      totalTTC: parseFloat(cout),
      services: taches.map(tache => ({
        nom: tache.nom || 'Entretien',
        description: tache.description,
        quantite: tache.quantite || 1,
        prix: tache.prix || 0
      })),
      notes: 'Ajouté manuellement'
    });

    await nouveauCarnet.save();
    console.log(`💾 Carnet d'entretien manuel créé pour véhicule ${vehiculeId}`);

    res.status(201).json({
      message: 'Entrée d\'entretien créée avec succès',
      carnet: nouveauCarnet
    });

  } catch (error) {
    console.error('❌ Erreur création carnet manuel:', error);
    res.status(500).json({
      error: 'Erreur lors de la création de l\'entrée d\'entretien',
      details: error.message
    });
  }
};