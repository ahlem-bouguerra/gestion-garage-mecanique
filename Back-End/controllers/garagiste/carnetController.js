import CarnetEntretien from '../../models/CarnetEntretien.js';
import Devis from '../../models/Devis.js';
import Vehicule from '../../models/Vehicule.js';
import FicheClient from '../../models/FicheClient.js';
import FicheClientVehicule from '../../models/FicheClientVehicule.js';
import OrdreTravail from '../../models/Ordre.js';
import mongoose from 'mongoose';

export const getCarnetByVehiculeId = async (req, res) => {
  try {
    const { vehiculeId } = req.params;
    console.log("🔍 Recherche pour vehiculeId:", vehiculeId);

    // ✅ VÉRIFIER D'ABORD SI LE VÉHICULE EXISTE ET SI LE GARAGE Y A ACCÈS
    const vehicule = await Vehicule.findById(vehiculeId);
    console.log("🚗 Véhicule trouvé:", vehicule ? "OUI" : "NON");
    if (!vehicule) {
      return res.status(404).json({ error: 'Véhicule non trouvé' });
    }
    console.log("   - garagisteId:", vehicule.garagisteId);
    console.log("   - proprietaireId:", vehicule.proprietaireId);
    console.log("   - proprietaireModel:", vehicule.proprietaireModel);

    // ✅ VÉRIFIER L'ACCÈS DU GARAGE AU VÉHICULE
    const liaison = await FicheClientVehicule.findOne({
      vehiculeId: vehiculeId,
      garageId: req.user._id
    });
    console.log("🔗 Liaison trouvée:", liaison ? "OUI" : "NON");

    const estVehiculeGarage = vehicule.garagisteId?.toString() === req.user._id.toString();

    if (!liaison && !estVehiculeGarage) {
      return res.status(403).json({ 
        error: 'Vous n\'avez pas accès à ce véhicule' 
      });
    }

    // ✅ RÉCUPÉRER LES CARNETS EXISTANTS
    const carnetsExistants = await CarnetEntretien.find({ 
      vehiculeId
    })
      .populate({
        path: 'devisId',
        select: 'id inspectionDate services totalTTC status'
      })
      .sort({ dateCommencement: -1 });

    console.log("✅ Carnets existants récupérés:", carnetsExistants.length);

    // 🔥 NOUVEAU : Récupérer les IDs des devis déjà associés à un carnet
    const devisIdsAvecCarnet = carnetsExistants
      .map(c => c.devisId?.id)
      .filter(Boolean);
    
    console.log("📋 Devis déjà dans les carnets:", devisIdsAvecCarnet);

    // 🔥 TOUJOURS VÉRIFIER S'IL Y A DES ORDRES TERMINÉS SANS CARNET
    let ordresTermines = await OrdreTravail.find({
      'vehiculedetails.vehiculeId': vehiculeId,
      status: 'termine',
      devisId: { $nin: devisIdsAvecCarnet } // ✅ Exclure les ordres déjà transformés
    }).sort({ dateFinReelle: -1 });

    console.log("📋 Ordres terminés sans carnet trouvés:", ordresTermines.length);

    if (ordresTermines.length === 0) {
      // Essayer avec ObjectId
      ordresTermines = await OrdreTravail.find({
        'vehiculedetails.vehiculeId': new mongoose.Types.ObjectId(vehiculeId),
        status: 'termine',
        devisId: { $nin: devisIdsAvecCarnet }
      }).sort({ dateFinReelle: -1 });
      console.log("📋 Ordres trouvés (tentative 2):", ordresTermines.length);
    }

    // 🔥 CRÉER LES CARNETS MANQUANTS À PARTIR DES ORDRES
    const nouveauxCarnets = await Promise.all(ordresTermines.map(async (ordre) => {
      let devisInfo = null;
      let totalTTC = 0;
      let services = [];
      let devisId = null;

      try {
        const devis = await Devis.findOne({ id: ordre.devisId })
          .select('_id id inspectionDate services totalTTC status');

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

      try {
        const nouveauCarnet = new CarnetEntretien({
          vehiculeId: new mongoose.Types.ObjectId(vehiculeId),
          devisId: devisId,
          dateCommencement: ordre.dateCommence,
          dateFinCompletion: ordre.dateFinReelle,
          typeEntretien: 'maintenance',
          statut: 'termine',
          totalTTC: totalTTC,
          garagisteId: req.user._id,
          kilometrageEntretien: null,
          notes: `Créé automatiquement depuis l'ordre ${ordre.numeroOrdre}`,
          services: ordre.taches ? ordre.taches.map(tache => ({
            nom: tache.description,
            description: tache.serviceNom ,
            quantite: tache.quantite,
          })) : []
        });

        await nouveauCarnet.save();
        console.log(`💾 Carnet créé pour ordre ${ordre.numeroOrdre}`);

        return {
          _id: nouveauCarnet._id,
          numeroOrdre: ordre.numeroOrdre,
          dateCommencement: ordre.dateCommence,
          totalTTC: totalTTC,
          kilometrageEntretien: null,
          devisInfo: devisInfo,
          services: nouveauCarnet.services,
          source: 'carnet'
        };

      } catch (saveError) {
        console.error(`❌ Erreur sauvegarde:`, saveError);
        
        return {
          _id: ordre._id,
          numeroOrdre: ordre.numeroOrdre,
          dateCommencement: ordre.dateCommence,
          totalTTC: totalTTC,
          taches: ordre.taches,
          source: 'ordre'
        };
      }
    }));

    // 🔥 COMBINER LES CARNETS EXISTANTS ET LES NOUVEAUX
    const historique = [
      ...carnetsExistants.map(carnet => ({
        _id: carnet._id,
        dateCommencement: carnet.dateCommencement,
        totalTTC: carnet.totalTTC,
        typeEntretien: carnet.typeEntretien,
        kilometrageEntretien: carnet.kilometrageEntretien,
        devisInfo: carnet.devisId ? {
          id: carnet.devisId.id,
          status: carnet.devisId.status
        } : null,
        services: carnet.services,
        source: 'carnet'
      })),
      ...nouveauxCarnets
    ].sort((a, b) => new Date(b.dateCommencement) - new Date(a.dateCommencement));

    console.log("📊 Total historique:", historique.length);

    // ✅ RÉCUPÉRER LA FICHE CLIENT
    let ficheClient = null;
    if (liaison) {
      ficheClient = await FicheClient.findById(liaison.ficheClientId);
    } else if (vehicule.proprietaireModel === 'FicheClient') {
      ficheClient = await FicheClient.findOne({
        _id: vehicule.proprietaireId
      });
    }

    const vehiculeData = {
      _id: vehicule._id,
      marque: vehicule.marque,
      modele: vehicule.modele,
      immatriculation: vehicule.immatriculation,
      annee: vehicule.annee,
      typeCarburant: vehicule.typeCarburant,
      kilometrage: vehicule.kilometrage,
      proprietaire: ficheClient ? {
        _id: ficheClient._id,
        nom: ficheClient.nom,
        type: ficheClient.type,
        telephone: ficheClient.telephone
      } : {
        _id: 'unknown',
        nom: 'Client inconnu',
        type: 'particulier',
        telephone: 'N/A'
      }
    };

    res.json({
      vehicule: vehiculeData,
      historique,
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération du carnet d\'entretien',
      details: error.message
    });
  }
};

export const Statistiques = async (req, res) => {
  try {
    const { vehiculeId } = req.params;

    const carnets = await CarnetEntretien.find({ 
      vehiculeId, 
      garagisteId: req.user._id 
    }).sort({ dateCommencement: -1 });

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

    // ✅ MODIFICATION : Vérifier via la liaison, pas directement le véhicule
    const liaison = await FicheClientVehicule.findOne({
      vehiculeId: vehiculeId,
      garageId: req.user._id
    });

    if (!liaison) {
      return res.status(404).json({ 
        error: 'Véhicule non trouvé dans votre garage' 
      });
    }

    // Créer le carnet d'entretien manuel
    const nouveauCarnet = new CarnetEntretien({
      vehiculeId: new mongoose.Types.ObjectId(vehiculeId),
      dateCommencement: new Date(date),
      dateFinCompletion: new Date(date),
      typeEntretien: 'maintenance',
      garagisteId: req.user._id,
      statut: 'termine',
      totalTTC: parseFloat(cout),
      services: taches.map(tache => ({
        nom: tache.description,
        description: tache.serviceNom || 'entretien',
        quantite: tache.quantite,
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

// Fonctions helper (à ajouter si elles n'existent pas)
function getRepartitionParType(carnets) {
  const repartition = {};
  carnets.forEach(carnet => {
    const type = carnet.typeEntretien || 'autre';
    repartition[type] = (repartition[type] || 0) + 1;
  });
  return repartition;
}

function getEvolutionDepenses(carnets) {
  return carnets.map(carnet => ({
    date: carnet.dateCommencement,
    montant: carnet.totalTTC
  })).reverse();
}