import CarnetEntretien from '../../models/CarnetEntretien.js';
import Devis from '../../models/Devis.js';
import Vehicule from '../../models/Vehicule.js';
import OrdreTravail from '../../models/Ordre.js';
import mongoose from 'mongoose';
import { User } from '../../models/User.js';



// ✅ VERSION CLIENT
export const getCarnetByVehiculeIdClient = async (req, res) => {
  try {
    const { vehiculeId } = req.params;
    const clientId = req.client._id; // ⚠️ Différence : req.client au lieu de req.user

    console.log("🔍 [CLIENT] Recherche pour vehiculeId:", vehiculeId);
    console.log("👤 ClientId:", clientId);

    // ✅ VÉRIFIER QUE LE VÉHICULE EXISTE
    const vehicule = await Vehicule.findById(vehiculeId);
    console.log("🚗 Véhicule trouvé:", vehicule ? "OUI" : "NON");
    
    if (!vehicule) {
      return res.status(404).json({ error: 'Véhicule non trouvé' });
    }

    // ✅ VÉRIFIER QUE LE CLIENT EST PROPRIÉTAIRE
    if (vehicule.proprietaireId.toString() !== clientId.toString() || 
        vehicule.proprietaireModel !== 'Client') {
      return res.status(403).json({ 
        error: 'Ce véhicule ne vous appartient pas' 
      });
    }

    console.log("✅ Client propriétaire confirmé");

    // ✅ RÉCUPÉRER LES CARNETS EXISTANTS
    const carnetsExistants = await CarnetEntretien.find({ 
      vehiculeId
    })
      .populate({
        path: 'devisId',
        select: 'id inspectionDate services totalTTC status'
      })
      .populate({
        path: 'garagisteId',
        select: 'nom prenom telephone adresse' // Info du garage
      })
      .sort({ dateCommencement: -1 });

    console.log("✅ Carnets existants récupérés:", carnetsExistants.length);

    // 🔥 Récupérer les IDs des devis déjà associés
    const devisIdsAvecCarnet = carnetsExistants
      .map(c => c.devisId?.id)
      .filter(Boolean);
    
    console.log("📋 Devis déjà dans les carnets:", devisIdsAvecCarnet);

    // 🔥 VÉRIFIER S'IL Y A DES ORDRES TERMINÉS SANS CARNET
    let ordresTermines = await OrdreTravail.find({
      'vehiculedetails.vehiculeId': vehiculeId,
      status: 'termine',
      devisId: { $nin: devisIdsAvecCarnet }
    }).sort({ dateFinReelle: -1 });

    console.log("📋 Ordres terminés sans carnet trouvés:", ordresTermines.length);

    if (ordresTermines.length === 0) {
      ordresTermines = await OrdreTravail.find({
        'vehiculedetails.vehiculeId': new mongoose.Types.ObjectId(vehiculeId),
        status: 'termine',
        devisId: { $nin: devisIdsAvecCarnet }
      }).sort({ dateFinReelle: -1 });
      console.log("📋 Ordres trouvés (tentative 2):", ordresTermines.length);
    }

    // 🔥 CRÉER LES CARNETS MANQUANTS (même logique)
    const nouveauxCarnets = await Promise.all(ordresTermines.map(async (ordre) => {
      let devisInfo = null;
      let totalTTC = 0;
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
          garagisteId: ordre.garagisteId, // ID du garage qui a fait l'entretien
          kilometrageEntretien: null,
          notes: `Créé automatiquement depuis l'ordre ${ordre.numeroOrdre}`,
          services: ordre.taches ? ordre.taches.map(tache => ({
            nom: tache.description,
            description: tache.serviceNom,
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
        // ✅ NOUVEAU : Info du garage
        garage: carnet.garagisteId ? {
          nom: carnet.garagisteId.nom || 'Garage inconnu',
          telephone: carnet.garagisteId.telephone,
          adresse: carnet.garagisteId.adresse
        } : null,
        source: 'carnet'
      })),
      ...nouveauxCarnets
    ].sort((a, b) => new Date(b.dateCommencement) - new Date(a.dateCommencement));

    console.log("📊 Total historique:", historique.length);

    // ✅ DONNÉES DU VÉHICULE (simplifiées pour le client)
    const vehiculeData = {
      _id: vehicule._id,
      marque: vehicule.marque,
      modele: vehicule.modele,
      immatriculation: vehicule.immatriculation,
      annee: vehicule.annee,
      typeCarburant: vehicule.typeCarburant,
      kilometrage: vehicule.kilometrage,
      carteGrise: vehicule.carteGrise || null
    };

    res.json({
      vehicule: vehiculeData,
      historique,
    });

  } catch (error) {
    console.error('❌ Erreur [CLIENT]:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération du carnet d\'entretien',
      details: error.message
    });
  }
};



// ✅ VERSION CLIENT CORRIGÉE
export const creerCarnetManuelClient = async (req, res) => {
  try {
    const { vehiculeId, date, taches, cout, garage } = req.body; // ✅ Ajout de 'garage'
    const clientId = req.client._id;

    console.log("📝 [CLIENT] Création carnet manuel pour véhicule:", vehiculeId);

    // ✅ Validation des données
    if (!vehiculeId || !date || !taches || taches.length === 0) {
      return res.status(400).json({ 
        error: 'Données manquantes: vehiculeId, date et taches sont requis' 
      });
    }

    // ✅ VÉRIFIER QUE LE VÉHICULE APPARTIENT AU CLIENT
    const vehicule = await Vehicule.findById(vehiculeId);

    if (!vehicule) {
      return res.status(404).json({ 
        error: 'Véhicule non trouvé' 
      });
    }

    if (vehicule.proprietaireId.toString() !== clientId.toString() || 
        vehicule.proprietaireModel !== 'Client') {
      return res.status(403).json({ 
        error: 'Ce véhicule ne vous appartient pas' 
      });
    }

    console.log("✅ Véhicule appartient au client");

    // ✅ GÉRER LE GARAGISTE
    // Option 1: Utiliser le client lui-même comme "garagiste" par défaut


    // ✅ CRÉER LE CARNET D'ENTRETIEN MANUEL
    const nouveauCarnet = new CarnetEntretien({
      vehiculeId: new mongoose.Types.ObjectId(vehiculeId),
      dateCommencement: new Date(date),
      dateFinCompletion: new Date(date),
      statut: 'termine',
      totalTTC: cout ? parseFloat(cout) : 0,
      kilometrageEntretien: null,
      services: taches.map(tache => ({
        nom: tache.description || tache.nom || 'Entretien',
        description: tache.serviceNom || tache.description || 'Service manuel',
        quantite: tache.quantite || 1,
        prix: tache.prix || 0
      })),
      notes: garage?.nom 
        ? `Ajouté manuellement par le client - Garage: ${garage.nom}${garage.adresse ? ` (${garage.adresse})` : ''}`
        : 'Ajouté manuellement par le client'
    });

    await nouveauCarnet.save();
    console.log(`💾 Carnet d'entretien manuel créé par le client`);

    res.status(201).json({
      message: 'Entrée d\'entretien créée avec succès',
      carnet: nouveauCarnet
    });

  } catch (error) {
    console.error('❌ Erreur création carnet manuel [CLIENT]:', error);
    res.status(500).json({
      error: 'Erreur lors de la création de l\'entrée d\'entretien',
      details: error.message
    });
  }
};