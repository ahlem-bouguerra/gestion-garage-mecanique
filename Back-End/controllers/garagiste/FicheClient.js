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
    let clients;
    
    // ⭐ Cas 1 : SuperAdmin avec garageId dans query params
    if (req.user.isSuperAdmin) {
      const { garageId } = req.query;
      
      if (!garageId) {
        return res.status(400).json({ 
          error: 'SuperAdmin doit spécifier un garageId en query parameter' 
        });
      }
      
      console.log('👑 SuperAdmin récupère les clients du garage:', garageId);
      clients = await FicheClient.find({ garageId });
    } 
    // ⭐ Cas 2 : Garagiste - utilise son propre garage
    else {
      if (!req.user.garage) {
        return res.status(400).json({ 
          error: 'Garagiste non associé à un garage' 
        });
      }
      
      console.log('🔧 Garagiste récupère ses clients');
      clients = await FicheClient.find({ garageId: req.user.garage });
    }

    res.json(clients);
    
  } catch (error) {
    console.error('❌ Erreur getFicheClients:', error);
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
    const clientId = req.params._id; // ou req.params.id selon ta route
    const garageId = req.user.garageId;

    const { email, telephone } = req.body;

    // 1) Vérifier email déjà utilisé (par un autre client du même garage)
    if (email) {
      const existsEmail = await FicheClient.findOne({
        garageId,
        email,
        _id: { $ne: clientId },
      });

      if (existsEmail) {
        return res.status(409).json({
          success: false,
          field: "email",
          message: "Cet email est déjà utilisé par un autre client.",
        });
      }
    }

    // 2) Vérifier téléphone déjà utilisé (par un autre client du même garage)
    if (telephone) {
      const existsTel = await FicheClient.findOne({
        garageId,
        telephone,
        _id: { $ne: clientId },
      });

      if (existsTel) {
        return res.status(409).json({
          success: false,
          field: "telephone",
          message: "Ce numéro de téléphone est déjà utilisé par un autre client.",
        });
      }
    }

    // 3) Update
    const fiche = await FicheClient.findOneAndUpdate(
      { _id: clientId, garageId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!fiche) {
      return res.status(404).json({
        success: false,
        message: "Client non trouvé ou non autorisé",
      });
    }

    return res.json({ success: true, data: fiche });
  } catch (error) {
    // 4) Mongo duplicate key error (si index unique sur email/tel)
    if (error?.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0] || "unknown";
      return res.status(409).json({
        success: false,
        field,
        message:
          field === "email"
            ? "Cet email est déjà utilisé par un autre client."
            : field === "telephone"
            ? "Ce numéro de téléphone est déjà utilisé par un autre client."
            : "Valeur déjà utilisée.",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Erreur lors de la mise à jour",
      error: error.message,
    });
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
