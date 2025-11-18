import FicheClient from "../../models/FicheClient.js";
import OrdreTravail from "../../models/Ordre.js";
import { validateTunisianPhone } from '../../utils/phoneValidator.js';
import mongoose from "mongoose";



export const createFicheClient = async (req, res) => {
  try {
    if (!req.user || !req.user.garageId) {
      return res.status(401).json({ error: "Utilisateur non authentifié ou garage manquant" });
    }

    const garageId = req.user.garageId;

    // Valider le téléphone
    const phoneValidation = validateTunisianPhone(req.body.telephone);
    if (!phoneValidation.isValid) {
      return res.status(400).json({ error: phoneValidation.message });
    }

    req.body.telephone = phoneValidation.cleanNumber;

    // Associer le CLIENT AU GARAGE
    req.body.garageId = garageId;

    const fiche = new FicheClient(req.body);
    await fiche.save();

    res.status(201).json(fiche);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Téléphone ou email ou nom déjà utilisé" });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getFicheClients = async (req, res) => {
  try {
    const clients = await FicheClient.find({
      garageId: req.user.garageId
    });

    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getFicheClientById = async (req, res) => {
  try {
    const fiche = await FicheClient.findOne({
      _id: req.params._id,
      garageId: req.user.garageId
    });

    if (!fiche) {
      return res.status(404).json({ error: "Client non trouvé ou non autorisé" });
    }

    res.json(fiche);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getFicheClientNoms = async (req, res) => {
  try {


    const clients = await FicheClient.find(
      { garageId: req.user.garageId },
      { nom: 1, type: 1, _id: 1 }
    );

    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const updateFicheClient = async (req, res) => {
  try {


    const fiche = await FicheClient.findOneAndUpdate(
      {
        _id: req.params._id,
        garageId: req.user.garageId
      },
      req.body,
      { new: true }
    );

    if (!fiche) {
      return res.status(404).json({ error: "Client non trouvé ou non autorisé" });
    }

    res.json(fiche);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteFicheClient = async (req, res) => {
  try {

  
    const fiche = await FicheClient.findOneAndDelete({
      _id: req.params._id,
      garageId: req.user.garageId
    });

    if (!fiche) {
      return res.status(404).json({ error: "Client non trouvé ou non autorisé" });
    }

    res.json({ message: "Client supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getHistoriqueVisiteByIdClient = async (req, res) => {
  try {

    const { clientId } = req.params;

    const client = await FicheClient.findOne({
      _id: clientId,
      garageId: req.user.garageId
    });

    if (!client) {
      return res.status(404).json({ success: false, error: "Client non trouvé ou non autorisé" });
    }

    const ordresTermines = await OrdreTravail.find({
      "clientInfo.ClientId": new mongoose.Types.ObjectId(clientId),
      garageId: req.user.garageId,
      status: "termine"
    })
      .populate('atelierId', 'name localisation')
      .populate('taches.serviceId', 'name')
      .populate('taches.mecanicienId', 'nom')
      .sort({ dateFinPrevue: -1 })
      .select('numeroOrdre dateCommence dateFinPrevue atelierNom taches vehiculedetails totalHeuresEstimees');

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

    const statistiques = {
      nombreVisites: historiqueVisites.length,
      derniereVisite: historiqueVisites[0]?.dateVisite || null,
      totalHeuresTravail: historiqueVisites.reduce((t, v) => t + v.dureeHeures, 0),
      servicesUniques: [...new Set(historiqueVisites.flatMap(v => v.taches.map(t => t.service)))].length
    };

    res.json({
      success: true,
      client: { id: client._id, nom: client.nom, type: client.type },
      historiqueVisites,
      statistiques
    });

  } catch (error) {
    res.status(500).json({ success: false, error: "Erreur lors de la récupération de l'historique" });
  }
};


export const getHistoryVisite = async (req, res) => {
  try {
    const { clientId } = req.params;

    const client = await FicheClient.findOne({
      _id: clientId,
      garageId: req.user.garageId
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client non trouvé ou non autorisé'
      });
    }

    const nombreVisites = await OrdreTravail.countDocuments({
      "clientInfo.ClientId": new mongoose.Types.ObjectId(clientId),
      garageId: req.user.garageId,
      status: "termine"
    });

    const derniereVisite = await OrdreTravail.findOne({
      "clientInfo.ClientId": new mongoose.Types.ObjectId(clientId),
      garageId: req.user.garageId,
      status: "termine"
    })
      .sort({ dateFinPrevue: -1 })
      .select("dateFinPrevue numeroOrdre");

    res.json({
      success: true,
      nombreVisites,
      derniereVisite: derniereVisite ? { date: derniereVisite.dateFinPrevue } : null
    });

  } catch (error) {
    res.status(500).json({ success: false, error: "Erreur lors du résumé des visites" });
  }
};
