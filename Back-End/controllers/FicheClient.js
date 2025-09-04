import FicheClient from "../models/FicheClient.js";
import OrdreTravail from "../models/Ordre.js";
import { validateTunisianPhone, validatePhoneMiddleware } from '../utils/phoneValidator.js';
import mongoose from "mongoose";
export const createFicheClient = async (req, res) => {
  try {
        // Valider le téléphone
        const phoneValidation = validateTunisianPhone(req.body.telephone);
        if (!phoneValidation.isValid) {
          return res.status(400).json({ error: phoneValidation.message });
        }
        
        // Normaliser le numéro
        req.body.telephone = phoneValidation.cleanNumber;

    const fiche = new FicheClient(req.body);
    await fiche.save();
    res.status(201).json(fiche);
  } catch (error) {
    // Gestion des erreurs d'unicité
    if (error.code === 11000) {
      return res.status(400).json({ error: "Téléphone ou email ou nom déjà utilisé" });
    }
    res.status(400).json({ error: error.message });
  }
};


export const getFicheClients = async (req, res) => {
  try {
    const fiches = await FicheClient.find();
    res.json(fiches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CORRECTION: Utiliser _id au lieu de id dans la recherche
export const getFicheClientById = async (req, res) => {
  try {
    console.log("🔍 Recherche client avec ID:", req.params._id);
    const fiche = await FicheClient.findById(req.params._id);
    if (!fiche) return res.status(404).json({ error: "client non trouvé" });
    console.log("📋 Client trouvé:", fiche.nom);
    res.json(fiche);
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getFicheClientNoms = async (req, res) => {
  try {
    // GARDER l'_id car le frontend en a besoin !
    const clients = await FicheClient.find({}, { nom: 1, type: 1, _id: 1 }); 
    // Retourne : [ { _id: "abc123", nom: "Ahlem", type: "particulier" }, ... ]
   
    res.json(clients);
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// CORRECTION: Utiliser _id au lieu de id dans la mise à jour
export const updateFicheClient = async (req, res) => {
  try {
    console.log("✏️ Mise à jour client avec ID:", req.params._id);
    console.log("📝 Données:", req.body);
    const fiche = await FicheClient.findByIdAndUpdate(
      req.params._id,
      req.body,
      { new: true }
    );
    if (!fiche) return res.status(404).json({ error: "Client non trouvé" });
    console.log("✅ Client mis à jour:", fiche.nom);
    res.json(fiche);
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    res.status(400).json({ error: error.message });
  }
};

// CORRECTION: Utiliser _id au lieu de id dans la suppression
export const deleteFicheClient = async (req, res) => {
  try {
    console.log("🗑️ Suppression client avec ID:", req.params._id);
    const fiche = await FicheClient.findByIdAndDelete(req.params._id);
    if (!fiche) return res.status(404).json({ error: "Client non trouvé" });
    console.log("✅ Client supprimé:", fiche.nom);
    res.json({ message: "Client supprimé avec succès" });
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    res.status(500).json({ error: error.message });
  }
};


// Route pour récupérer l'historique des visites d'un client
export const getHistoriqueVisiteByIdClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    console.log('🔍 Recherche historique pour client:', clientId);

    // Vérifier que le client existe
    const client = await FicheClient.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client non trouvé'
      });
    }

    // Rechercher tous les ordres terminés pour ce client
    const ordresTermines = await OrdreTravail.find({
      'clientInfo.ClientId': new mongoose.Types.ObjectId(clientId),
      status: 'termine'
    })
    .populate('atelierId', 'name localisation')
    .populate('taches.serviceId', 'name')
    .populate('taches.mecanicienId', 'nom')
    .sort({ dateFinPrevue: -1 }) // Trier par date de fin la plus récente
    .select('numeroOrdre dateCommence dateFinPrevue atelierNom taches vehiculeInfo totalHeuresEstimees');

    console.log(`✅ Trouvé ${ordresTermines.length} ordres terminés`);

    // Formater les données pour l'affichage
    const historiqueVisites = ordresTermines.map(ordre => ({
      id: ordre._id,
      numeroOrdre: ordre.numeroOrdre,
      dateVisite: ordre.dateFinPrevue,
      vehicule: ordre.vehiculeInfo,
      atelier: ordre.atelierNom,
      dureeHeures: ordre.totalHeuresEstimees || 0,
      taches: ordre.taches.map(tache => ({
        description: tache.description,
        service: tache.serviceNom,
        mecanicien: tache.mecanicienNom,
        heuresReelles: tache.estimationHeures || 0,
        status: tache.status
      })),
      // Résumé des services effectués
      servicesEffectues: [...new Set(ordre.taches.map(t => t.serviceNom))].join(', ')
    }));

    // Calculer quelques statistiques
    const statistiques = {
      nombreVisites: historiqueVisites.length,
      derniereVisite: historiqueVisites.length > 0 ? historiqueVisites[0].dateVisite : null,
      totalHeuresTravail: historiqueVisites.reduce((total, visite) => total + visite.dureeHeures, 0),
      servicesUniques: [...new Set(historiqueVisites.flatMap(v => v.taches.map(t => t.service)))].length
    };

    res.json({
      success: true,
      client: {
        id: client._id,
        nom: client.nom,
        type: client.type
      },
      historiqueVisites,
      statistiques
    });

  } catch (error) {
    console.error('❌ Erreur récupération historique client:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'historique client'
    });
  }
};

// Route pour récupérer un résumé rapide des visites (pour affichage sur la carte)
export const getHistoryVisite = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    // Compter les ordres terminés
    const nombreVisites = await OrdreTravail.countDocuments({
      'clientInfo.ClientId': new mongoose.Types.ObjectId(clientId),
      status: 'termine'
    });

    // Trouver la dernière visite
    const derniereVisite = await OrdreTravail.findOne({
      'clientInfo.ClientId': new mongoose.Types.ObjectId(clientId),
      status: 'termine'
    })
    .sort({ dateFinPrevue: -1 })
    .select('dateFinPrevue numeroOrdre');

    res.json({
      success: true,
      nombreVisites,
      derniereVisite: derniereVisite ? {
        date: derniereVisite.dateFinPrevue,
        
      } : null
    });

  } catch (error) {
    console.error('❌ Erreur résumé visites:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du résumé'
    });
  }
};