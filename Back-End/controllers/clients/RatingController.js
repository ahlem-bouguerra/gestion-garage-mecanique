// controllers/ratingController.js
import mongoose from 'mongoose';
import Rating from '../../models/Rating.js';
import OrdreTravail from '../../models/Ordre.js';
import FicheClient from '../../models/FicheClient.js';

// ============================================
// CRÉER UNE NOTATION
// ============================================
export const createRating = async (req, res) => {
  try {
    const clientId = req.client._id;
    const { ordreId, rating, comment, recommande } = req.body;

    console.log('⭐ Création notation pour ordre:', ordreId);

    // Validation
    if (!ordreId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'ordreId et rating sont requis'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'La note doit être entre 1 et 5'
      });
    }

    // Vérifier que l'ordre existe
    const ordre = await OrdreTravail.findById(ordreId);

    if (!ordre) {
      return res.status(404).json({
        success: false,
        message: 'Ordre de travail non trouvé'
      });
    }

    // Vérifier que l'ordre est terminé
    if (ordre.status !== 'termine') {
      return res.status(400).json({
        success: false,
        message: 'Seuls les ordres terminés peuvent être notés'
      });
    }

    // Vérifier que le client est propriétaire de cet ordre via FicheClient
    const fichesClients = await FicheClient.find({ 
      clientId: clientId 
    }).select('_id');

    const ficheClientIds = fichesClients.map(f => f._id.toString());
    const ordreClientId = ordre.clientInfo?.ClientId?.toString();

    if (!ficheClientIds.includes(ordreClientId)) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à noter cet ordre'
      });
    }

    // Vérifier qu'il n'y a pas déjà une note
    const existingRating = await Rating.findOne({ ordreId });

    if (existingRating) {
      return res.status(400).json({
        success: false,
        message: 'Cet ordre a déjà été noté'
      });
    }

    // Créer la notation
    const newRating = new Rating({
      ordreId,
      clientId,
      ficheClientId: ordre.clientInfo.ClientId,
      garageId: ordre.garageId,
      rating: Math.round(rating),
      comment: comment || '',
      recommande: recommande !== undefined ? recommande : rating >= 4,
      ordreSnapshot: {
        numeroOrdre: ordre.numeroOrdre,
        dateCommence: ordre.dateCommence,
        dateFinReelle: ordre.dateFinReelle,
        totalHeuresReelles: ordre.totalHeuresReelles,
        vehiculeNom: ordre.vehiculedetails?.nom,
        service: ordre.taches?.map(t => t.serviceNom).join(', ') || 'N/A'
      }
    });

    await newRating.save();

    // Mettre à jour l'ordre
    await OrdreTravail.findByIdAndUpdate(ordreId, {
      ratingId: newRating._id,
      ratedAt: new Date()
    });

    console.log('✅ Notation créée:', newRating._id);

    res.status(201).json({
      success: true,
      message: 'Merci pour votre évaluation !',
      rating: newRating
    });

  } catch (error) {
    console.error('❌ Erreur createRating:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la notation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// RÉCUPÉRER UNE NOTATION PAR ORDRE
// ============================================
export const getRatingByOrdre = async (req, res) => {
  try {
    const { ordreId } = req.params;
    const clientId = req.client._id;

    console.log('🔍 Récupération notation pour ordre:', ordreId);

    if (!mongoose.Types.ObjectId.isValid(ordreId)) {
      return res.status(400).json({
        success: false,
        message: 'ID d\'ordre invalide'
      });
    }

    const rating = await Rating.findOne({ ordreId })
      .populate('garageId', 'name email phone')
      .lean();

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Aucune notation trouvée pour cet ordre'
      });
    }

    // Vérifier que c'est bien le client propriétaire
    if (rating.clientId.toString() !== clientId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    res.json({
      success: true,
      rating
    });

  } catch (error) {
    console.error('❌ Erreur getRatingByOrdre:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la notation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// RÉCUPÉRER TOUTES LES NOTATIONS DU CLIENT
// ============================================
export const getMyRatings = async (req, res) => {
  try {
    const clientId = req.client._id;

    console.log('📋 Récupération notations client:', clientId);

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const ratings = await Rating.find({ clientId })
      .populate('garageId', 'name email phone address averageRating')
      .populate('ordreId', 'numeroOrdre dateCommence dateFinReelle')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Rating.countDocuments({ clientId });

    console.log('✅ Notations trouvées:', ratings.length);

    res.json({
      success: true,
      ratings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    });

  } catch (error) {
    console.error('❌ Erreur getMyRatings:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des notations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// RÉCUPÉRER LES NOTATIONS D'UN GARAGE (PUBLIC)
// ============================================
export const getGarageRatings = async (req, res) => {
  try {
    const { garageId } = req.params;

    console.log('📊 Récupération notations garage:', garageId);

    if (!mongoose.Types.ObjectId.isValid(garageId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de garage invalide'
      });
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filtre
    const filter = { 
      garageId: new mongoose.Types.ObjectId(garageId),
      status: 'active'
    };

    if (req.query.minRating) {
      filter.rating = { $gte: parseInt(req.query.minRating) };
    }

    const ratings = await Rating.find(filter)
      .populate('ficheClientId', 'nom')
      .select('rating comment recommande createdAt ordreSnapshot reponseGarage ')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Rating.countDocuments(filter);

    // Statistiques
    const stats = await Rating.aggregate([
      {
        $match: { 
          garageId: new mongoose.Types.ObjectId(garageId),
          status: 'active'
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 },
          rating5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          rating4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          rating3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          rating2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          rating1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
          totalRecommande: { $sum: { $cond: ['$recommande', 1, 0] } }
        }
      }
    ]);

    const statistics = stats[0] || {
      averageRating: 0,
      totalRatings: 0,
      rating5: 0,
      rating4: 0,
      rating3: 0,
      rating2: 0,
      rating1: 0,
      totalRecommande: 0
    };

    console.log('✅ Notations trouvées:', ratings.length);

    res.json({
      success: true,
      ratings,
      statistics,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    });

  } catch (error) {
    console.error('❌ Erreur getGarageRatings:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des notations du garage',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// MODIFIER UNE NOTATION (dans les 7 jours)
// ============================================
export const updateRating = async (req, res) => {
  try {
    const { ratingId } = req.params;
    const clientId = req.client._id;
    const { rating, comment, recommande } = req.body;

    console.log('✏️ Modification notation:', ratingId);

    if (!mongoose.Types.ObjectId.isValid(ratingId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de notation invalide'
      });
    }

    const existingRating = await Rating.findById(ratingId);

    if (!existingRating) {
      return res.status(404).json({
        success: false,
        message: 'Notation non trouvée'
      });
    }

    // Vérifier que c'est bien le propriétaire
    if (existingRating.clientId.toString() !== clientId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez pas modifier cette notation'
      });
    }

    // Vérifier le délai de modification (7 jours)
    const daysSinceRating = (Date.now() - existingRating.createdAt) / (1000 * 60 * 60 * 24);
    if (daysSinceRating > 7) {
      return res.status(400).json({
        success: false,
        message: 'Le délai de modification (7 jours) est dépassé'
      });
    }

    // Mettre à jour
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'La note doit être entre 1 et 5'
        });
      }
      existingRating.rating = Math.round(rating);
    }

    if (comment !== undefined) existingRating.comment = comment;
    if (recommande !== undefined) existingRating.recommande = recommande;

    await existingRating.save();

    console.log('✅ Notation modifiée');

    res.json({
      success: true,
      message: 'Notation mise à jour avec succès',
      rating: existingRating
    });

  } catch (error) {
    console.error('❌ Erreur updateRating:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification de la notation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// SUPPRIMER UNE NOTATION
// ============================================
export const deleteRating = async (req, res) => {
  try {
    const { ratingId } = req.params;
    const clientId = req.client._id;

    console.log('🗑️ Suppression notation:', ratingId);

    if (!mongoose.Types.ObjectId.isValid(ratingId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de notation invalide'
      });
    }

    const rating = await Rating.findById(ratingId);

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Notation non trouvée'
      });
    }

    // Vérifier que c'est bien le propriétaire
    if (rating.clientId.toString() !== clientId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer cette notation'
      });
    }

    // Retirer la référence dans l'ordre
    await OrdreTravail.findByIdAndUpdate(rating.ordreId, {
      $unset: { ratingId: 1, ratedAt: 1 }
    });

    // Supprimer la notation
    await Rating.findByIdAndDelete(ratingId);

    console.log('✅ Notation supprimée');

    res.json({
      success: true,
      message: 'Notation supprimée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur deleteRating:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la notation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};