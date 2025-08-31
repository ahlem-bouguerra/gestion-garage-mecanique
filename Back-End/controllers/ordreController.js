import OrdreTravail from '../models/Ordre.js';
import Devis from '../models/Devis.js';
import Atelier from '../models/Atelier.js';
import Service from '../models/Service.js';
import Mecanicien from '../models/Mecanicien.js';
import mongoose from 'mongoose';


export const createOrdreTravail = async (req, res) => {
  try {
    const { devisId, dateCommence, atelierId, priorite, description, taches } = req.body;

    // Validation des données requises
    if (!devisId || !dateCommence || !atelierId || !taches || taches.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Données manquantes : devisId, dateCommence, atelierId et taches sont obligatoires'
      });
    }

    // Vérifier que le devis existe
    const devis = await Devis.findOne({ id: devisId });
    if (!devis) {
      return res.status(404).json({
        success: false,
        error: `Devis ${devisId} non trouvé`
      });
    }

    // Vérifier si un ordre existe déjà pour ce devis
    const existingOrdre = await OrdreTravail.findOne({ devisId });
    if (existingOrdre) {
      return res.status(400).json({
        success: false,
        error: `Un ordre de travail est déjà créé pour le devis ${devisId}`
      });
    }

    // Vérifier que l'atelier existe
    const atelier = await Atelier.findById(atelierId);
    if (!atelier) {
      return res.status(404).json({
        success: false,
        error: 'Atelier non trouvé'
      });
    }

    // Valider et enrichir les tâches
    const tachesEnrichies = [];
    for (const tache of taches) {
      if (!tache.serviceId || !tache.mecanicienId) {
        return res.status(400).json({
          success: false,
          error: 'Chaque tâche doit avoir un serviceId et mecanicienId'
        });
      }

      // Récupérer les informations du service
      const service = await Service.findById(tache.serviceId);
      if (!service) {
        return res.status(404).json({
          success: false,
          error: `Service non trouvé pour la tâche: ${tache.description}`
        });
      }

      // Récupérer les informations du mécanicien
      const mecanicien = await Mecanicien.findById(tache.mecanicienId);
      if (!mecanicien) {
        return res.status(404).json({
          success: false,
          error: `Mécanicien non trouvé pour la tâche: ${tache.description}`
        });
      }

      tachesEnrichies.push({
        description: tache.description,
        quantite: tache.quantite || 1,
        serviceId: tache.serviceId,
        serviceNom: service.name,
        mecanicienId: tache.mecanicienId,
        mecanicienNom: mecanicien.nom,
        estimationHeures: tache.estimationHeures || 1,
        notes: tache.notes || '',
        status: 'assignee'
      });
    }

    // Calculer la date de fin prévue (estimation basée sur les heures)
    const totalHeuresEstimees = tachesEnrichies.reduce((total, tache) => total + tache.estimationHeures, 0);
    const dateFinPrevue = new Date(dateCommence);
    dateFinPrevue.setHours(dateFinPrevue.getHours() + totalHeuresEstimees);

    // Créer l'ordre de travail avec le numéro généré
    const ordreTravail = new OrdreTravail({
      devisId: devis.id,
      clientInfo: {
        nom: devis.clientName,
        telephone: devis.clientPhone,
        email: devis.clientEmail,
        adresse: devis.clientAddress
      },
      vehiculeInfo: devis.vehicleInfo,
      dateCommence: new Date(dateCommence),
      dateFinPrevue,
      atelierId,
      atelierNom: atelier.name,
      priorite: priorite || 'normale',
      description: description || '',
      taches: tachesEnrichies,
      createdBy: req.user?.id
    });

    const ordreSauve = await ordreTravail.save();

    // Populer les références pour la réponse
    await ordreSauve.populate([
      { path: 'devisId', select: 'id clientName vehicleInfo' },
      { path: 'atelierId', select: 'name localisation' },
      { path: 'taches.serviceId', select: 'name' },
      { path: 'taches.mecanicienId', select: 'nom' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Ordre de travail créé avec succès',
      ordre: ordreSauve
    });

  } catch (error) {
    console.error('Erreur création ordre de travail:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur serveur lors de la création de l\'ordre de travail'
    });
  }
};

export const getOrdresTravail = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      atelier,
      priorite,
      dateDebut,
      dateFin,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Construction du filtre
    const filter = {};
    
    if (status) filter.status = status;
    if (atelier) filter.atelierId = atelier;
    if (priorite) filter.priorite = priorite;
    
    if (dateDebut && dateFin) {
      filter.dateCommence = {
        $gte: new Date(dateDebut),
        $lte: new Date(dateFin)
      };
    }

    // Options de tri
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calcul de pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Requête avec pagination
    const ordres = await OrdreTravail.find(filter)
      .populate('devisId', 'id clientName vehicleInfo')
      .populate('atelierId', 'name localisation')
      .populate('taches.serviceId', 'name')
      .populate('taches.mecanicienId', 'nom')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Compter le total pour la pagination
    const total = await OrdreTravail.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      ordres,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        totalPages,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Erreur récupération ordres:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des ordres de travail'
    });
  }
};

export const getOrdreTravailById = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Recherche ordre avec ID:', id); // Debug
    
    const ordre = await OrdreTravail.findById(id)
      .populate('devisId', 'id clientName vehicleInfo inspectionDate services')
      .populate('atelierId', 'name localisation')
      .populate('taches.serviceId', 'name description')
      .populate('taches.mecanicienId', 'nom telephone email')
      .populate('createdBy', 'nom email')
      .populate('updatedBy', 'nom email');

    if (!ordre) {
      console.log('Ordre non trouvé pour ID:', id); // Debug
      return res.status(404).json({
        success: false,
        error: 'Ordre de travail non trouvé'
      });
    }

    console.log('Ordre trouvé:', ordre.numeroOrdre); // Debug
    
    res.json({
      success: true,
      ordre
    });

  } catch (error) {
    console.error('Erreur récupération ordre:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération de l\'ordre de travail'
    });
  }
};

export const updateStatusOrdreTravail = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const statusValides = ['en_attente', 'en_cours', 'termine', 'suspendu'];
    if (!statusValides.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Statut invalide'
      });
    }

    const ordre = await OrdreTravail.findByIdAndUpdate(
      id,
      { 
        status, 
        updatedBy: req.user?.id,
        ...(status === 'termine' && { dateFinReelle: new Date() })
      },
      { new: true }
    ).populate('atelierId', 'name');

    if (!ordre) {
      return res.status(404).json({
        success: false,
        error: 'Ordre de travail non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Statut mis à jour avec succès',
      ordre
    });

  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la mise à jour du statut'
    });
  }
};

export const demarrerTache = async (req, res) => {
  try {
    const { id, tacheId } = req.params;

    const ordre = await OrdreTravail.findById(id);
    if (!ordre) {
      return res.status(404).json({
        success: false,
        error: 'Ordre de travail non trouvé'
      });
    }

    await ordre.demarrerTache(tacheId, req.user?.id);

    res.json({
      success: true,
      message: 'Tâche démarrée avec succès',
      ordre
    });

  } catch (error) {
    console.error('Erreur démarrage tâche:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

export const terminerTache = async (req, res) => {
  try {
    const { id, tacheId } = req.params;
    const { heuresReelles } = req.body;

    const ordre = await OrdreTravail.findById(id);
    if (!ordre) {
      return res.status(404).json({
        success: false,
        error: 'Ordre de travail non trouvé'
      });
    }

    await ordre.terminerTache(tacheId, heuresReelles, req.user?.id);

    res.json({
      success: true,
      message: 'Tâche terminée avec succès',
      ordre
    });

  } catch (error) {
    console.error('Erreur fin tâche:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};


export const getStatistiques = async (req, res) => {
  try {
    const { atelierId } = req.query;

    const stats = await OrdreTravail.getStatistiques(atelierId);

    // Statistiques additionnelles
    const statsParPriorite = await OrdreTravail.aggregate([
      ...(atelierId ? [{ $match: { atelierId: new mongoose.Types.ObjectId(atelierId) } }] : []),
      {
        $group: {
          _id: '$priorite',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      statistiques: {
        ...stats,
        parPriorite: statsParPriorite.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('Erreur statistiques:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des statistiques'
    });
  }
};


export const supprimerOrdreTravail = async (req, res) => {
  try {
    const { id } = req.params;

    const ordre = await OrdreTravail.findById(id);
    if (!ordre) {
      return res.status(404).json({
        success: false,
        error: 'Ordre de travail non trouvé'
      });
    }

    // Vérifier si l'ordre peut être supprimé (pas en cours)
    if (ordre.status === 'en_cours') {
      return res.status(400).json({
        success: false,
        error: 'Impossible de supprimer un ordre de travail en cours'
      });
    }

    // Soft delete - marquer comme supprimé plutôt que supprimer réellement
    ordre.status = 'supprime';
    ordre.updatedBy = req.user?.id;
    await ordre.save();

    res.json({
      success: true,
      message: 'Ordre de travail supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression ordre:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la suppression'
    });
  }
};



export const getOrdresParDevisId = async (req, res) => {
  try {
    const { devisId } = req.params;
    
    // Chercher un ordre existant pour ce devis
    const existingOrdre = await OrdreTravail.findOne({ devisId: devisId });
    
    if (existingOrdre) {
      return res.json({
        exists: true,
        ordre: existingOrdre
      });
    } else {
      return res.json({
        exists: false
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/ordres/status/:status
export const getOrdresByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const options = {
      sort: { createdAt: -1 },
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    };

    const ordres = await OrdreTravail.findByStatus(status, options);

    res.json({
      success: true,
      total: ordres.length,
      ordres
    });
  } catch (error) {
    console.error("Erreur getOrdresByStatus:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// GET /api/ordres/atelier/:atelierId
export const getOrdresByAtelier = async (req, res) => {
  try {
    const { atelierId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const options = {
      sort: { createdAt: -1 },
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    };

    const ordres = await OrdreTravail.findByAtelier(atelierId, options);

    res.json({
      success: true,
      total: ordres.length,
      ordres
    });
  } catch (error) {
    console.error("Erreur getOrdresByAtelier:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const updateOrdreTravail = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      dateCommence,
      atelierId,
      priorite,
      description,
      taches
    } = req.body;

    // Chercher l'ordre existant
    const ordre = await OrdreTravail.findById(id);
    if (!ordre) {
      return res.status(404).json({
        success: false,
        error: 'Ordre de travail non trouvé'
      });
    }

    // Vérifier si l'ordre peut être modifié
    if (ordre.status === 'termine') {
      return res.status(400).json({
        success: false,
        error: 'Impossible de modifier un ordre terminé'
      });
    }

    // Mettre à jour les champs simples
    if (dateCommence) ordre.dateCommence = new Date(dateCommence);
    if (atelierId) {
      const atelier = await Atelier.findById(atelierId);
      if (!atelier) {
        return res.status(404).json({
          success: false,
          error: 'Atelier non trouvé'
        });
      }
      ordre.atelierId = atelierId;
      ordre.atelierNom = atelier.name;
    }
    if (priorite) ordre.priorite = priorite;
    if (description !== undefined) ordre.description = description;

    // Mettre à jour les tâches si fournies
    if (taches && Array.isArray(taches)) {
      const tachesEnrichies = [];
      for (const tache of taches) {
        if (!tache.serviceId || !tache.mecanicienId) {
          return res.status(400).json({
            success: false,
            error: 'Chaque tâche doit avoir un serviceId et mecanicienId'
          });
        }

        const service = await Service.findById(tache.serviceId);
        const mecanicien = await Mecanicien.findById(tache.mecanicienId);

        if (!service || !mecanicien) {
          return res.status(404).json({
            success: false,
            error: 'Service ou mécanicien non trouvé'
          });
        }

        tachesEnrichies.push({
          _id: tache._id || new mongoose.Types.ObjectId(),
          description: tache.description,
          quantite: tache.quantite || 1,
          serviceId: tache.serviceId,
          serviceNom: service.name,
          mecanicienId: tache.mecanicienId,
          mecanicienNom: mecanicien.nom,
          estimationHeures: tache.estimationHeures || 1,
          notes: tache.notes || '',
          status: tache.status || 'assignee',
          dateDebut: tache.dateDebut,
          dateFin: tache.dateFin,
          heuresReelles: tache.heuresReelles
        });
      }
      ordre.taches = tachesEnrichies;

      // Recalculer dateFinPrevue
      const totalHeuresEstimees = tachesEnrichies.reduce(
        (total, t) => total + t.estimationHeures,
        0
      );
      const dateFinPrevue = new Date(ordre.dateCommence);
      dateFinPrevue.setHours(dateFinPrevue.getHours() + totalHeuresEstimees);
      ordre.dateFinPrevue = dateFinPrevue;
    }

    ordre.updatedBy = req.user?.id;
    ordre.updatedAt = new Date();

    const ordreSauve = await ordre.save();

    // Populer les références pour la réponse
    await ordreSauve.populate([
      { path: 'atelierId', select: 'name localisation' },
      { path: 'taches.serviceId', select: 'name' },
      { path: 'taches.mecanicienId', select: 'nom' }
    ]);

    res.json({
      success: true,
      message: 'Ordre de travail mis à jour avec succès',
      ordre: ordreSauve
    });

  } catch (error) {
    console.error('Erreur mise à jour ordre de travail:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur serveur lors de la mise à jour'
    });
  }
};
