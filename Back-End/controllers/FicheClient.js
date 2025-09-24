import FicheClient from "../models/FicheClient.js";
import OrdreTravail from "../models/Ordre.js";
import { validateTunisianPhone, validatePhoneMiddleware } from '../utils/phoneValidator.js';
import mongoose from "mongoose";

export const createFicheClient = async (req, res) => {
  try {
    // Vérifier que le garagiste est authentifié
    if (!req.user) {
      return res.status(401).json({ error: "Garagiste non authentifié" });
    }
    const garagisteId = req.user._id || req.user.userId; // <-- la clé qui existe
    if (!garagisteId) {
      return res.status(401).json({ error: "Garagiste non authentifié" });
    }

    // Valider le téléphone
    const phoneValidation = validateTunisianPhone(req.body.telephone);
    if (!phoneValidation.isValid) {
      return res.status(400).json({ error: phoneValidation.message });
    }

    // Normaliser le numéro
    req.body.telephone = phoneValidation.cleanNumber;

    // Associer le garagiste connecté
    req.body.garagisteId = garagisteId;

    const fiche = new FicheClient(req.body);
    await fiche.save();

    res.status(201).json(fiche);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Téléphone ou email ou nom déjà utilisé" });
    }
    res.status(500).json({ error: error.message }); // 500 car erreur serveur
  }
};

export const getFicheClients = async (req, res) => {
  try {
    // ✅ Filtrer par garagisteId
    const fiches = await FicheClient.find({ 
      garagisteId: req.user._id 
    });
    res.json(fiches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getFicheClientById = async (req, res) => {
  try {
    console.log("🔍 Recherche client avec ID:", req.params._id);
    
    // ✅ Filtrer par garagisteId ET par _id
    const fiche = await FicheClient.findOne({
      _id: req.params._id,
      garagisteId: req.user._id
    });
    
    if (!fiche) {
      return res.status(404).json({ error: "Client non trouvé ou non autorisé" });
    }
    
    console.log("📋 Client trouvé:", fiche.nom);
    res.json(fiche);
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getFicheClientNoms = async (req, res) => {
  try {
    // ✅ Filtrer par garagisteId
    const clients = await FicheClient.find(
      { garagisteId: req.user._id }, 
      { nom: 1, type: 1, _id: 1 }
    ); 
    
    res.json(clients);
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const updateFicheClient = async (req, res) => {
  try {
    console.log("✏️ Mise à jour client avec ID:", req.params._id);
    console.log("📝 Données:", req.body);
    
    // ✅ Filtrer par garagisteId ET par _id
    const fiche = await FicheClient.findOneAndUpdate(
      { 
        _id: req.params._id,
        garagisteId: req.user._id
      },
      req.body,
      { new: true }
    );
    
    if (!fiche) {
      return res.status(404).json({ error: "Client non trouvé ou non autorisé" });
    }
    
    console.log("✅ Client mis à jour:", fiche.nom);
    res.json(fiche);
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    res.status(400).json({ error: error.message });
  }
};

export const deleteFicheClient = async (req, res) => {
  try {
    console.log("🗑️ Suppression client avec ID:", req.params._id);
    
    // ✅ Filtrer par garagisteId ET par _id
    const fiche = await FicheClient.findOneAndDelete({
      _id: req.params._id,
      garagisteId: req.user._id
    });
    
    if (!fiche) {
      return res.status(404).json({ error: "Client non trouvé ou non autorisé" });
    }
    
    console.log("✅ Client supprimé:", fiche.nom);
    res.json({ message: "Client supprimé avec succès" });
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getHistoriqueVisiteByIdClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    console.log('🔍 Recherche historique pour client:', clientId);

    // ✅ Vérifier que le client existe ET appartient au garagiste
    const client = await FicheClient.findOne({
      _id: clientId,
      garagisteId: req.user._id
    });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client non trouvé ou non autorisé'
      });
    }

    // ✅ Rechercher les ordres terminés pour ce client ET ce garagiste
    const ordresTermines = await OrdreTravail.find({
      'clientInfo.ClientId': new mongoose.Types.ObjectId(clientId),
      garagisteId: req.user._id, // ✅ Ajouter cette ligne
      status: 'termine'
    })
    .populate('atelierId', 'name localisation')
    .populate('taches.serviceId', 'name')
    .populate('taches.mecanicienId', 'nom')
    .sort({ dateFinPrevue: -1 })
    .select('numeroOrdre dateCommence dateFinPrevue atelierNom taches vehiculedetails totalHeuresEstimees');

    console.log(`✅ Trouvé ${ordresTermines.length} ordres terminés`);

    // Formater les données pour l'affichage
    const historiqueVisites = ordresTermines.map(ordre => ({
      id: ordre._id,
      numeroOrdre: ordre.numeroOrdre,
      dateVisite: ordre.dateFinPrevue,
      vehicule: ordre.vehiculedetails.nom,
      atelier: ordre.atelierNom,
      dureeHeures: ordre.totalHeuresEstimees || 0,
      taches: ordre.taches.map(tache => ({
        description: tache.description,
        service: tache.serviceNom,
        mecanicien: tache.mecanicienNom,
        heuresReelles: tache.estimationHeures || 0,
        status: tache.status
      })),
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

export const getHistoryVisite = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    // ✅ Vérifier que le client appartient au garagiste
    const client = await FicheClient.findOne({
      _id: clientId,
      garagisteId: req.user._id
    });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client non trouvé ou non autorisé'
      });
    }
    
    // ✅ Compter les ordres terminés pour ce garagiste
    const nombreVisites = await OrdreTravail.countDocuments({
      'clientInfo.ClientId': new mongoose.Types.ObjectId(clientId),
      garagisteId: req.user._id, // ✅ Ajouter cette ligne
      status: 'termine'
    });

    // ✅ Trouver la dernière visite pour ce garagiste
    const derniereVisite = await OrdreTravail.findOne({
      'clientInfo.ClientId': new mongoose.Types.ObjectId(clientId),
      garagisteId: req.user._id, // ✅ Ajouter cette ligne
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