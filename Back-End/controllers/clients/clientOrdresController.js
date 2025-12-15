import OrdreTravail from '../../models/Ordre.js';
import mongoose from 'mongoose';
import FicheClient from '../../models/FicheClient.js';

export const getAllMesOrdres = async (req, res) => {
  try {
    const clientId = req.client._id; // Client authentifié
    
    console.log('📋 Récupération des ordres pour client:', clientId);

    // 🔍 ÉTAPE 1: Trouver toutes les fiches clients liées à ce client authentifié
    const fichesClients = await FicheClient.find({ 
      clientId: clientId 
    }).select('_id garageId nom').lean();

    console.log('📂 Fiches clients trouvées:', fichesClients.length);
    
    if (fichesClients.length === 0) {
      return res.json({
        success: true,
        ordres: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
          hasMore: false
        },
        message: 'Aucune fiche client trouvée. Créez d\'abord une réservation dans un garage.',
        debug: {
          clientIdRecherche: clientId.toString(),
          fichesClientsTrouvees: 0
        }
      });
    }

    // Extraire les IDs des fiches clients
    const ficheClientIds = fichesClients.map(f => f._id);
    console.log('🆔 IDs des fiches clients:', ficheClientIds.map(id => id.toString()));

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // 🔍 ÉTAPE 2: Chercher les ordres avec les IDs des fiches clients
    const filters = { 
      'clientInfo.ClientId': { $in: ficheClientIds }
    };

    // Filtre par statut
    if (req.query.status && req.query.status !== 'tous') {
      filters.status = req.query.status;
    }

    // Filtre par date
    if (req.query.dateDebut && req.query.dateFin) {
      filters.dateCommence = {
        $gte: new Date(req.query.dateDebut),
        $lte: new Date(req.query.dateFin)
      };
    }

    // Filtre par garage
    if (req.query.garageId) {
      filters.garageId = new mongoose.Types.ObjectId(req.query.garageId);
    }

    // Recherche par numéro d'ordre
    if (req.query.search) {
      filters.numeroOrdre = { $regex: req.query.search, $options: 'i' };
    }

    console.log('🔍 Filtres appliqués:', JSON.stringify(filters, null, 2));

    // Récupérer les ordres avec populate
    const ordres = await OrdreTravail.find(filters)
      .populate('garageId', 'nom email phone address')
      .populate('atelierId', 'name localisation')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    console.log('📊 Nombre d\'ordres trouvés:', ordres.length);

    // Compter le total
    const total = await OrdreTravail.countDocuments(filters);

    // Enrichir chaque ordre avec des infos utiles
    const ordresEnrichis = ordres.map(ordre => {
      // Trouver la fiche client correspondante
      const ficheClient = fichesClients.find(
        f => f._id.toString() === ordre.clientInfo?.ClientId?.toString()
      );

      return {
        ...ordre,
        ficheClientInfo: ficheClient ? {
          id: ficheClient._id,
          nom: ficheClient.nom,
          garageId: ficheClient.garageId
        } : null,
        canBeRated: ordre.status === 'termine' && !ordre.ratedAt,
        joursRestants: ordre.dateFinPrevue 
          ? Math.ceil((new Date(ordre.dateFinPrevue) - new Date()) / (1000 * 60 * 60 * 24))
          : null,
        enRetard: ordre.dateFinPrevue && new Date() > new Date(ordre.dateFinPrevue) && ordre.status !== 'termine'
      };
    });

    console.log('✅ Ordres enrichis:', ordresEnrichis.length);

    res.json({
      success: true,
      ordres: ordresEnrichis,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total
      },
      message: total === 0 
        ? 'Aucun ordre de travail trouvé'
        : `${total} ordre(s) trouvé(s)`,
      debug: process.env.NODE_ENV === 'development' ? {
        clientIdRecherche: clientId.toString(),
        fichesClientsTrouvees: fichesClients.length,
        ficheClientIds: ficheClientIds.map(id => id.toString())
      } : undefined
    });

  } catch (error) {
    console.error('❌ Erreur getAllMesOrdres:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des ordres',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};




export const getOrdreById = async (req, res) => {
  try {
    const { ordreId } = req.params;
    const clientId = req.client._id;

    console.log('🔍 Récupération ordre:', ordreId, 'pour client:', clientId);

    // Vérifier que l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(ordreId)) {
      return res.status(400).json({
        success: false,
        message: 'ID d\'ordre invalide'
      });
    }

    // 🔍 ÉTAPE 1: Trouver les fiches clients du client authentifié
    const fichesClients = await FicheClient.find({ 
      clientId: clientId 
    }).select('_id').lean();

    if (fichesClients.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aucune fiche client trouvée'
      });
    }

    const ficheClientIds = fichesClients.map(f => f._id);
    console.log('🆔 Fiches clients:', ficheClientIds.map(id => id.toString()));

    // 🔍 ÉTAPE 2: Récupérer l'ordre avec vérification des fiches clients
    const ordre = await OrdreTravail.findOne({
      _id: ordreId,
      'clientInfo.ClientId': { $in: ficheClientIds }
    })
      .populate('garageId', 'nom email phone address averageRating totalRatings')
      .populate('atelierId', 'name localisation equipements capacite')
      .populate('taches.serviceId', 'name category price')
      .populate('taches.mecanicienId', 'username email specialites')
      .lean();

    if (!ordre) {
      return res.status(404).json({
        success: false,
        message: 'Ordre de travail non trouvé ou accès non autorisé'
      });
    }

    // Enrichir l'ordre avec des informations calculées
    const ordreEnrichi = {
      ...ordre,
      // ⭐ Peut être noté ?
      canBeRated: ordre.status === 'termine' && !ordre.ratedAt,
      // Progression
      progressionPourcentage: ordre.nombreTaches > 0 
        ? Math.round((ordre.nombreTachesTerminees / ordre.nombreTaches) * 100)
        : 0,
      // Temps restant
      joursRestants: ordre.dateFinPrevue 
        ? Math.ceil((new Date(ordre.dateFinPrevue) - new Date()) / (1000 * 60 * 60 * 24))
        : null,
      // Retard
      enRetard: ordre.dateFinPrevue && new Date() > new Date(ordre.dateFinPrevue) && ordre.status !== 'termine',
      // Durée totale
      dureeJours: ordre.dateCommence && ordre.dateFinReelle
        ? Math.ceil((new Date(ordre.dateFinReelle) - new Date(ordre.dateCommence)) / (1000 * 60 * 60 * 24))
        : null,
      // Statistiques des tâches
      tachesStats: {
        total: ordre.nombreTaches,
        terminees: ordre.nombreTachesTerminees,
        enCours: ordre.taches?.filter(t => t.status === 'en_cours').length || 0,
        enAttente: ordre.taches?.filter(t => t.status === 'assignee').length || 0
      }
    };

    console.log('✅ Ordre trouvé:', ordre.numeroOrdre);

    res.json({
      success: true,
      ordre: ordreEnrichi,
      message: 'Ordre de travail récupéré avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur getOrdreById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'ordre',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


export const getOrdreStats = async (req, res) => {
  try {
    const clientId = req.client._id;

    console.log('📊 Calcul statistiques pour client:', clientId);

    // 🔍 ÉTAPE 1: Trouver les fiches clients du client authentifié
    const fichesClients = await FicheClient.find({ 
      clientId: clientId 
    }).select('_id').lean();

    console.log('📂 Fiches clients trouvées:', fichesClients.length);

    if (fichesClients.length === 0) {
      return res.json({
        success: true,
        stats: {
          total: 0,
          enAttente: 0,
          enCours: 0,
          termines: 0,
          suspendus: 0,
          notes: 0,
          aNotes: 0,
          totalHeuresEstimees: 0,
          totalHeuresReelles: 0
        },
        ordresRecents: [],
        message: 'Aucune fiche client trouvée'
      });
    }

    const ficheClientIds = fichesClients.map(f => f._id);
    console.log('🆔 IDs des fiches clients:', ficheClientIds.map(id => id.toString()));

    // 🔍 ÉTAPE 2: Calculer les statistiques avec les fiches clients
    const stats = await OrdreTravail.aggregate([
      {
        $match: {
          'clientInfo.ClientId': { $in: ficheClientIds }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          enAttente: {
            $sum: { $cond: [{ $eq: ['$status', 'en_attente'] }, 1, 0] }
          },
          enCours: {
            $sum: { $cond: [{ $eq: ['$status', 'en_cours'] }, 1, 0] }
          },
          termines: {
            $sum: { $cond: [{ $eq: ['$status', 'termine'] }, 1, 0] }
          },
          suspendus: {
            $sum: { $cond: [{ $eq: ['$status', 'suspendu'] }, 1, 0] }
          },
          // ⭐ Ordres notés
          notes: {
            $sum: { $cond: [{ $ne: ['$ratedAt', null] }, 1, 0] }
          },
          // ⭐ Ordres à noter
          aNotes: {
            $sum: { 
              $cond: [
                { 
                  $and: [
                    { $eq: ['$status', 'termine'] },
                    { $eq: ['$ratedAt', null] }
                  ]
                }, 
                1, 
                0
              ] 
            }
          },
          totalHeuresEstimees: { $sum: '$totalHeuresEstimees' },
          totalHeuresReelles: { $sum: '$totalHeuresReelles' }
        }
      }
    ]);

    const statistiques = stats[0] || {
      total: 0,
      enAttente: 0,
      enCours: 0,
      termines: 0,
      suspendus: 0,
      notes: 0,
      aNotes: 0,
      totalHeuresEstimees: 0,
      totalHeuresReelles: 0
    };

    // Ordres récents (5 derniers)
    const ordresRecents = await OrdreTravail.find({
      'clientInfo.ClientId': { $in: ficheClientIds }
    })
      .select('numeroOrdre status dateCommence dateFinPrevue garageId')
      .populate('garageId', 'nom')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    console.log('✅ Statistiques calculées:', statistiques);
    console.log('📋 Ordres récents:', ordresRecents.length);

    res.json({
      success: true,
      stats: statistiques,
      ordresRecents,
      message: 'Statistiques récupérées avec succès',
      debug: process.env.NODE_ENV === 'development' ? {
        clientIdRecherche: clientId.toString(),
        fichesClientsTrouvees: fichesClients.length,
        ficheClientIds: ficheClientIds.map(id => id.toString())
      } : undefined
    });

  } catch (error) {
    console.error('❌ Erreur getOrdreStats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul des statistiques',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};