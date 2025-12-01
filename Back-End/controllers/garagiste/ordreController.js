import OrdreTravail from '../../models/Ordre.js';
import Devis from '../../models/Devis.js';
import Atelier from '../../models/Atelier.js';
import Service from '../../models/Service.js';
import mongoose from 'mongoose';
import { Garagiste } from '../../models/Garagiste.js';

export const createOrdreTravail = async (req, res) => {
  try {
    console.log("📥 Données reçues pour ordre de travail:", req.body);

    const { devisId, dateCommence, atelierId, priorite, description, taches } = req.body;
    const { garageId } = req.query;

    // ⭐ Détermination du garage
    let targetGarageId;
    if (req.user.isSuperAdmin && garageId) {
      targetGarageId = garageId;
    } else if (!req.user.isSuperAdmin) {
      targetGarageId = req.user.garageId || req.user.garage;
    }

    if (!targetGarageId) {
      return res.status(400).json({ success: false, error: "garageId introuvable." });
    }

    // 🔎 Vérification des champs obligatoires
    if (!devisId || !dateCommence || !atelierId || !taches || taches.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Champs requis manquants : devisId, dateCommence, atelierId, taches'
      });
    }

    // 🔎 Vérifier que le devis existe
    const devis = await Devis.findOne({
      id: devisId,
      garageId: targetGarageId
    });

    if (!devis) {
      return res.status(404).json({
        success: false,
        error: `Devis ${devisId} non trouvé dans ce garage`
      });
    }

    // 🚫 Vérifier si un OT existe déjà
    const existingOrdre = await OrdreTravail.findOne({
      devisId,
      garageId: targetGarageId
    });

    if (existingOrdre) {
      return res.status(400).json({
        success: false,
        error: `Un ordre de travail existe déjà pour le devis ${devisId}`
      });
    }

    // 🔎 Vérifier l’atelier
    const atelier = await Atelier.findOne({
      _id: atelierId,
      garageId: targetGarageId
    });

    if (!atelier) {
      return res.status(404).json({ success: false, error: 'Atelier non trouvé dans ce garage' });
    }

    // ✨ Valider et enrichir les tâches
    const tachesEnrichies = [];

    for (const tache of taches) {
      if (!tache.serviceId || !tache.mecanicienId) {
        return res.status(400).json({
          success: false,
          error: 'Chaque tâche doit contenir serviceId et mecanicienId'
        });
      }

      const service = await Service.findById(tache.serviceId);
      if (!service) {
        return res.status(404).json({
          success: false,
          error: `Service introuvable pour la tâche "${tache.description}"`
        });
      }

const mecanicien = await Garagiste.findOne({
  _id: tache.mecanicienId,
  garage: targetGarageId  // Correspond au schéma
});

      if (!mecanicien) {
        return res.status(404).json({
          success: false,
          error: `Mécanicien introuvable ou n'appartient pas à ce garage`
        });
      }

      tachesEnrichies.push({
        description: tache.description,
        quantite: tache.quantite || 1,
        serviceId: tache.serviceId,
        serviceNom: service.name,
        mecanicienId: mecanicien._id,
        mecanicienNom: mecanicien.username,
        estimationHeures: tache.estimationHeures || 1,
        notes: tache.notes || '',
        status: 'assignee'
      });
    }

    // ⏳ Calcul de la date de fin prévue
    const totalHeures = tachesEnrichies.reduce((sum, t) => sum + t.estimationHeures, 0);
    const dateFinPrevue = new Date(dateCommence);
    dateFinPrevue.setHours(dateFinPrevue.getHours() + totalHeures);

    // 🆕 Création de l'ordre de travail
    const ordreTravail = new OrdreTravail({
      devisId: devis.id,
      garageId: targetGarageId,
      clientInfo: {
        nom: devis.clientName,
        ClientId: devis.clientId,
        telephone: devis.clientPhone,
        email: devis.clientEmail,
        adresse: devis.clientAddress
      },
      vehiculedetails: {
        nom: devis.vehicleInfo,
        vehiculeId: devis.vehiculeId,
      },
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

    // 🔗 Populate des relations
    await ordreSauve.populate([
      { path: 'devisId', select: 'id clientName vehicleInfo vehiculeId' },
      { path: 'atelierId', select: 'name localisation' },
      { path: 'taches.serviceId', select: 'name' },
      { path: 'taches.mecanicienId', select: 'username email phone' }
    ]);

    return res.status(201).json({
      success: true,
      message: 'Ordre de travail créé avec succès',
      ordre: ordreSauve
    });

  } catch (error) {
    console.error('❌ Erreur création ordre de travail:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur serveur'
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
      sortOrder = 'desc',
      garageId // ⭐ NOUVEAU : Paramètre pour SuperAdmin
    } = req.query;

    // ⭐ Construction du filtre selon le rôle
    const filter = {};
    
    // Si SuperAdmin ET garageId fourni, utiliser ce garageId
    // Sinon, utiliser le garageId de l'utilisateur connecté
    if (req.user.isSuperAdmin && garageId) {
      filter.garageId = garageId;
    } else if (!req.user.isSuperAdmin) {
      filter.garageId = req.user.garage || req.user.garageId;
    }
    // Si SuperAdmin sans garageId, pas de filtre garage (tous les ordres)
    
 
    
    if (atelier) filter.atelierId = atelier;
    if (priorite) filter.priorite = priorite;
    
    if (dateDebut && dateFin) {
      filter.dateCommence = {
        $gte: new Date(dateDebut),
        $lte: new Date(dateFin)
      };
    }

    console.log('🔍 Filtre appliqué:', filter);

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
      .populate('taches.mecanicienId', 'username email phone')
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
    
    console.log('Recherche ordre avec ID:', id);
    
    // ⭐ Construction du filtre selon le rôle
    const filter = { _id: id };
    
    // Si pas SuperAdmin, filtrer par garage
    if (!req.user.isSuperAdmin) {
      filter.garageId = req.user.garage || req.user.garageId;
    }
    
    const ordre = await OrdreTravail.findOne(filter)
      .populate('devisId', 'id clientName vehicleInfo inspectionDate services')
      .populate('atelierId', 'name localisation')
      .populate('taches.serviceId', 'name description')
.populate('taches.mecanicienId', 'username phone email')
.populate('createdBy', 'username email')
.populate('updatedBy', 'username email');

    if (!ordre) {
      console.log('Ordre non trouvé pour ID:', id);
      return res.status(404).json({
        success: false,
        error: 'Ordre de travail non trouvé'
      });
    }

    console.log('Ordre trouvé:', ordre.numeroOrdre);
    
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


export const demarrerOrdre = async (req, res) => {
  try {
    const { id } = req.params;

    const ordre = await OrdreTravail.findOne({_id: id,garageId: req.user.garageId})
    if (!ordre) {
      return res.status(404).json({
        success: false,
        error: 'Ordre de travail non trouvé'
      });
    }

    // Changer le statut de l'ordre complet
    ordre.status = 'en_cours';
    ordre.dateDebutReelle = new Date();
    
    await ordre.save();

    res.json({
      success: true,
      message: 'Ordre de travail démarré avec succès',
      ordre
    });

  } catch (error) {
    console.error('Erreur démarrage ordre:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

export const terminerOrdre = async (req, res) => {
  try {
    const { id } = req.params;

    const ordre = await OrdreTravail.findOne({
      _id: id,
     garageId: req.user.garageId
    });
    if (!ordre) {
      return res.status(404).json({
        success: false,
        error: 'Ordre de travail non trouvé'
      });
    }

    // Changer le statut de l'ordre complet
    ordre.status = 'termine';
    ordre.dateFinReelle = new Date();
    
    await ordre.save();

    res.json({
      success: true,
      message: 'Ordre de travail terminé avec succès',
      ordre
    });

  } catch (error) {
    console.error('Erreur fin ordre:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};


export const getStatistiques = async (req, res) => {
  try {
    const { atelierId, garageId } = req.query; // ⭐ AJOUT : garageId depuis query

    // ⭐ Déterminer quel garageId utiliser
    let targetGarageId;
    if (req.user.isSuperAdmin && garageId) {
      // SuperAdmin avec garageId spécifique
      targetGarageId = garageId;
    } else if (!req.user.isSuperAdmin) {
      // Garagiste : utiliser son propre garage
      targetGarageId = req.user.garageId || req.user.garage;
    }
    // Si SuperAdmin sans garageId, targetGarageId reste undefined = stats globales

    console.log('📊 Récupération stats pour garageId:', targetGarageId);

    const stats = await OrdreTravail.getStatistiques(atelierId, targetGarageId);

    // Statistiques additionnelles
    const matchFilter = {};
    
    if (targetGarageId) {
      matchFilter.garageId = new mongoose.Types.ObjectId(targetGarageId);
    }
    
    if (atelierId) {
      matchFilter.atelierId = new mongoose.Types.ObjectId(atelierId);
    }

    const statsParPriorite = await OrdreTravail.aggregate([
      { $match: matchFilter },
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

    const ordre = await OrdreTravail.findOne({
      _id: id,
      garageId: req.user.garageId
    });
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
    const { garageId } = req.query; // ou req.params selon votre route
    
    // Déterminer le garageId à utiliser
    let targetGarageId;
    
    if (req.user.role === 'Super Admin') {
      // Super admin peut spécifier un garageId ou voir tous les garages
      targetGarageId = garageId || null;
    } else {
      // Utilisateur normal utilise son propre garageId
      targetGarageId = req.user.garageId;
    }
    
    // Construire la requête
    const query = { devisId: devisId };
    
    // Ajouter le filtre garageId seulement si nécessaire
    if (targetGarageId) {
      query.garageId = targetGarageId;
    }
    
    // Chercher un ordre existant pour ce devis
    const existingOrdre = await OrdreTravail.findOne(query);
    
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

export const getOrdresByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { page = 1, limit = 10, garageId } = req.query; // ⭐ NOUVEAU

    // ⭐ Construction du filtre
    const filter = status === 'supprime' 
      ? { status: 'supprime' }
      : { 
          status: status,
          $and: [{ status: { $ne: 'supprime' } }] 
        };
    
    // ⭐ Ajouter le filtre garage selon le rôle
    if (req.user.isSuperAdmin && garageId) {
      filter.garageId = garageId;
    } else if (!req.user.isSuperAdmin) {
      filter.garageId = req.user.garage || req.user.garageId;
    }

    const options = {
      sort: { createdAt: -1 },
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    };

    const ordres = await OrdreTravail.find(filter)
      .populate('devisId', 'id clientName vehicleInfo')
      .populate('atelierId', 'name localisation')
      .populate('taches.serviceId', 'name')
      .populate('taches.mecanicienId', 'username email phone')
      .sort(options.sort)
      .skip(options.skip)
      .limit(options.limit)
      .lean();

    const total = await OrdreTravail.countDocuments(filter);

    res.json({
      success: true,
      total,
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


export const getOrdresByAtelier = async (req, res) => {
  try {
    const { atelierId } = req.params;
    const { page = 1, limit = 10, garageId } = req.query; // ⭐ NOUVEAU

    const filter = { 
      atelierId: atelierId,
      status: { $ne: 'supprime' }
    };
    
    // ⭐ Ajouter le filtre garage selon le rôle
    if (req.user.isSuperAdmin && garageId) {
      filter.garageId = garageId;
    } else if (!req.user.isSuperAdmin) {
      filter.garageId = req.user.garage || req.user.garageId;
    }

    const options = {
      sort: { createdAt: -1 },
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    };

    const ordres = await OrdreTravail.find(filter)
      .populate('devisId', 'id clientName vehicleInfo')
      .populate('atelierId', 'name localisation')
      .populate('taches.serviceId', 'name')
      .populate('taches.mecanicienId', 'username email phone')
      .sort(options.sort)
      .skip(options.skip)
      .limit(options.limit)
      .lean();

    const total = await OrdreTravail.countDocuments(filter);

    res.json({
      success: true,
      total,
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
      taches,
      garageId
    } = req.body;

    console.log('🔍 DEBUG UPDATE ORDRE:');
    console.log('- Ordre ID:', id);
    console.log('- req.user.role:', req.user?.role);
    console.log('- req.user.isSuperAdmin:', req.user?.isSuperAdmin);
    console.log('- garageId dans body:', garageId);

    // Déterminer le garageId à utiliser
    let targetGarageId;
    
    // ✅ CORRECTION : Vérifier aussi isSuperAdmin et rendre insensible à la casse
    if (req.user.isSuperAdmin === true || req.user.role?.toLowerCase() === 'Super Admin') {
      console.log('✅ SuperAdmin détecté');
      
      if (garageId) {
        targetGarageId = garageId;
        console.log('✅ GarageId fourni dans body:', targetGarageId);
      } else {
        // Si pas de garageId fourni, chercher l'ordre sans filtre garage
        const ordreTemp = await OrdreTravail.findById(id);
        if (!ordreTemp) {
          return res.status(404).json({
            success: false,
            error: 'Ordre de travail non trouvé'
          });
        }
        targetGarageId = ordreTemp.garageId;
        console.log('✅ GarageId récupéré de l\'ordre existant:', targetGarageId);
      }
    } else {
      // Pour les autres rôles, utiliser le garageId de l'utilisateur
      targetGarageId = req.user.garageId;
      console.log('✅ Admin Garage - targetGarageId:', targetGarageId);
    }

    console.log('🔍 Recherche ordre avec _id:', id, 'et garageId:', targetGarageId);
    
    // Chercher l'ordre existant avec le garageId approprié
    const ordre = await OrdreTravail.findOne({
      _id: id,
      garageId: targetGarageId
    });
    
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

    if (ordre.status === 'supprime') {
      return res.status(400).json({
        success: false,
        error: 'Impossible de modifier un ordre supprimé'
      });
    }

    // Mettre à jour les champs simples
    if (dateCommence) {
      ordre.dateCommence = new Date(dateCommence);
    }

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

    if (priorite) {
      ordre.priorite = priorite;
    }

    if (description !== undefined) {
      ordre.description = description;
    }

    // Mettre à jour les tâches si fournies
    if (taches && Array.isArray(taches)) {
      console.log('Mise à jour des tâches:', taches.length);
      
      const tachesEnrichies = [];
      for (const tache of taches) {
        if (!tache.serviceId || !tache.mecanicienId) {
          return res.status(400).json({
            success: false,
            error: `Chaque tâche doit avoir un serviceId et mecanicienId. Tâche: ${tache.description}`
          });
        }

        const service = await Service.findById(tache.serviceId);
        const mecanicien = await Garagiste.findById(tache.mecanicienId)

        if (!service) {
          return res.status(404).json({
            success: false,
            error: `Service non trouvé pour la tâche: ${tache.description}`
          });
        }

        if (!mecanicien) {
          return res.status(404).json({
            success: false,
            error: `Mécanicien non trouvé pour la tâche: ${tache.description}`
          });
        }

        tachesEnrichies.push({
          _id: tache._id || new mongoose.Types.ObjectId(),
          description: tache.description,
          quantite: tache.quantite || 1,
          serviceId: tache.serviceId,
          serviceNom: service.name,
          mecanicienId: tache.mecanicienId,
          mecanicienNom: mecanicien.username,
          estimationHeures: tache.estimationHeures || 1,
          notes: tache.notes || '',
          status: tache.status || 'assignee',
          dateDebut: tache.dateDebut,
          dateFin: tache.dateFin,
          heuresReelles: tache.heuresReelles || 0
        });
      }
      
      ordre.taches = tachesEnrichies;

      // Recalculer dateFinPrevue basée sur les nouvelles estimations
      const totalHeuresEstimees = tachesEnrichies.reduce(
        (total, t) => total + (t.estimationHeures || 0),
        0
      );
      if (ordre.dateCommence && totalHeuresEstimees > 0) {
        const dateFinPrevue = new Date(ordre.dateCommence);
        dateFinPrevue.setHours(dateFinPrevue.getHours() + totalHeuresEstimees);
        ordre.dateFinPrevue = dateFinPrevue;
      }
    }

    // Marquer comme mis à jour
    ordre.updatedBy = req.user?.id;
    ordre.updatedAt = new Date();

    // Sauvegarder
    const ordreSauve = await ordre.save();

    // Populer les références pour la réponse
    await ordreSauve.populate([
      { path: 'atelierId', select: 'name localisation' },
      { path: 'taches.serviceId', select: 'name' },
      { path: 'taches.mecanicienId', select: 'username email telephone' }
    ]);

    console.log('Ordre modifié avec succès:', ordreSauve.numeroOrdre);

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

export const getOrdresSupprimes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filtrer par garagiste connecté et statut supprimé
    const filter = {
      garageId: req.user.garageId,
      status: 'supprime'
    };

    console.log("📋 Recherche ordres supprimés:", filter);

    // Compter le total d'ordres supprimés
    const total = await OrdreTravail.countDocuments(filter);

    // Récupérer les ordres supprimés avec pagination
    const ordres = await OrdreTravail.find(filter)
      .populate([
        { 
          path: 'atelierId', 
          select: 'name localisation' 
        },
        { 
          path: 'taches.serviceId', 
          select: 'name' 
        },
        { 
          path: 'taches.mecanicienId', 
          select: 'username email phone' 
        }
      ])
      .sort({ updatedAt: -1 }) // Trier par dernière modification (suppression)
      .skip(skip)
      .limit(limit)
      .lean(); // Pour de meilleures performances

    console.log(`📊 ${ordres.length} ordres supprimés trouvés sur ${total} total`);

    res.status(200).json({
      success: true,
      ordres,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Erreur récupération ordres supprimés:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur serveur lors de la récupération des ordres supprimés'
    });
  }
};


export const deleteOrdreTravailDefinitif = async (req, res) => {
  try {
    const { id } = req.params;
    const { garageId } = req.body;

    console.log('🗑️ Suppression ordre ID:', id);

    let targetGarageId;
    
    if (req.user.isSuperAdmin === true || req.user.role?.toLowerCase() === 'Super Admin') {
      if (garageId) {
        targetGarageId = garageId;
      } else {
        const ordreTemp = await OrdreTravail.findById(id);
        if (!ordreTemp) {
          return res.status(404).json({
            success: false,
            error: 'Ordre de travail non trouvé'
          });
        }
        targetGarageId = ordreTemp.garageId;
      }
    } else {
      targetGarageId = req.user.garageId;
    }

    // Supprimer directement
    const ordre = await OrdreTravail.findOneAndDelete({
      _id: id,
      garageId: targetGarageId
    });
    
    if (!ordre) {
      return res.status(404).json({
        success: false,
        error: 'Ordre de travail non trouvé'
      });
    }

    console.log('✅ Ordre supprimé définitivement:', ordre.numeroOrdre);

    res.json({
      success: true,
      message: 'Ordre de travail supprimé définitivement'
    });

  } catch (error) {
    console.error('❌ Erreur suppression ordre de travail:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur serveur lors de la suppression'
    });
  }
};