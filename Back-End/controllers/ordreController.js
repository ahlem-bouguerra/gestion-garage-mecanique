import OrdreTravail from '../models/Ordre.js';
import Devis from '../models/Devis.js';
import Atelier from '../models/Atelier.js';
import Service from '../models/Service.js';
import Mecanicien from '../models/Mecanicien.js';
import mongoose from 'mongoose';

/**
 * Créer un nouvel ordre de travail
 * POST /api/ordre-travail/
 */
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

    // Vérifier que l'atelier existe
    const atelier = await Atelier.findById(atelierId);
    if (!atelier) {
      return res.status(404).json({
        success: false,
        error: 'Atelier non trouvé'
      });
    }

    // ✅ Générer le numéro d'ordre AVANT la création
    const count = await OrdreTravail.countDocuments({});
    const year = new Date().getFullYear();
    const numeroOrdre = `OT-${year}-${String(count + 1).padStart(4, '0')}`;

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
      numeroOrdre, // ✅ Ajout explicite du numéro
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
/**
 * Récupérer tous les ordres de travail avec pagination et filtres
 * GET /api/ordre-travail/
 */
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

/**
 * Récupérer un ordre de travail par ID avec tous les détails
 * GET /api/ordre-travail/:id
 */
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

/**
 * Mettre à jour le statut d'un ordre de travail
 * PUT /api/ordre-travail/:id/status
 */
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

/**
 * Démarrer une tâche spécifique
 * PUT /api/ordre-travail/:id/taches/:tacheId/demarrer
 */
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

/**
 * Terminer une tâche spécifique
 * PUT /api/ordre-travail/:id/taches/:tacheId/terminer
 */
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

/**
 * Ajouter une note à un ordre de travail
 * POST /api/ordre-travail/:id/notes
 */
export const ajouterNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { contenu } = req.body;

    if (!contenu?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Le contenu de la note est obligatoire'
      });
    }

    const ordre = await OrdreTravail.findById(id);
    if (!ordre) {
      return res.status(404).json({
        success: false,
        error: 'Ordre de travail non trouvé'
      });
    }

    await ordre.ajouterNote(contenu, req.user?.nom || 'Utilisateur');

    res.json({
      success: true,
      message: 'Note ajoutée avec succès',
      ordre
    });

  } catch (error) {
    console.error('Erreur ajout note:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de l\'ajout de la note'
    });
  }
};

/**
 * Récupérer les statistiques des ordres de travail
 * GET /api/ordre-travail/statistiques
 */
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

/**
 * Supprimer un ordre de travail (soft delete)
 * DELETE /api/ordre-travail/:id
 */
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

/**
 * Récupérer les ordres par mécanicien
 * GET /api/ordre-travail/mecanicien/:mecanicienId
 */
export const getOrdresParMecanicien = async (req, res) => {
  try {
    const { mecanicienId } = req.params;
    const { status } = req.query;

    const filter = {
      'taches.mecanicienId': mecanicienId
    };

    if (status) {
      filter['taches.status'] = status;
    }

    const ordres = await OrdreTravail.find(filter)
      .populate('devisId', 'id clientName vehicleInfo')
      .populate('atelierId', 'name')
      .sort({ createdAt: -1 });

    // Filtrer les tâches pour ne montrer que celles du mécanicien
    const ordresFiltres = ordres.map(ordre => ({
      ...ordre.toJSON(),
      taches: ordre.taches.filter(t => t.mecanicienId.toString() === mecanicienId)
    }));

    res.json({
      success: true,
      ordres: ordresFiltres
    });

  } catch (error) {
    console.error('Erreur récupération ordres mécanicien:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};