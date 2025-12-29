import Devis from '../../models/Devis.js';
import Vehicule from '../../models/Vehicule.js';

/**
 * 🚗 Récupérer tous les devis du client connecté
 * Via ses véhicules
 */
export const getClientDevis = async (req, res) => {
  try {
    const clientId = req.client._id; // ID du client connecté
    
    console.log('🔍 Recherche des devis pour client:', clientId);

    // 1️⃣ Trouver tous les véhicules du client
    const vehicules = await Vehicule.find({ proprietaireId: clientId });
    
    if (!vehicules || vehicules.length === 0) {
      return res.json({
        success: true,
        message: 'Aucun véhicule trouvé',
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        }
      });
    }

    // 2️⃣ Extraire les IDs des véhicules
    const vehiculeIds = vehicules.map(v => v._id);
    console.log('🚗 Véhicules trouvés:', vehiculeIds.length);
        // ✅ AJOUTER LA PAGINATION ICI
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Construire les filtres
    const filters = { vehiculeId: { $in: vehiculeIds } };
    
    // Filtre par statut
    if (req.query.status && req.query.status !== 'tous') {
      filters.status = req.query.status;
    }

    // Compter le total AVANT de faire la requête paginée
    const total = await Devis.countDocuments(filters);

    // 3️⃣ Trouver tous les devis liés à ces véhicules
    const devis = await Devis.find({ 
      vehiculeId: { $in: vehiculeIds } 
    })
    .populate('vehiculeId', 'marque modele immatriculation')
    .populate('garageId', 'nom  emailProfessionnel telephoneProfessionnel')
    .sort({ createdAt: -1 }) // Plus récents en premier
    .skip(skip)        // ← Ajouter skip
    .limit(limit);     // ← Ajouter limit

    console.log('📋 Devis trouvés:', devis.length);

    // 4️⃣ Calculer les totaux corrects pour chaque devis
    const devisWithCalculations = devis.map(d => {
      const totalServicesHT = d.services.reduce((sum, service) => {
        return sum + (service.quantity * service.unitPrice);
      }, 0);

      const totalHT = totalServicesHT + (d.maindoeuvre || 0);
      const totalTTC = totalHT * (1 + (d.tvaRate || 20) / 100);

      return {
        ...d.toObject(),
        totalHT: totalServicesHT,
        totalTTC: totalTTC
      };
    });

    res.json({
      success: true,
      count: devisWithCalculations.length,
      data: devisWithCalculations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération devis client:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des devis',
      error: error.message
    });
  }
};

/**
 * 🔍 Récupérer un devis spécifique par son ID
 * (Vérification que le devis appartient bien au client)
 */
export const getClientDevisById = async (req, res) => {
  try {
    const { devisId } = req.params;
    const clientId = req.client._id;

    console.log('🔍 Recherche devis:', devisId, 'pour client:', clientId);

    // 1️⃣ Récupérer le devis
    let devis;
    
    if (devisId.match(/^[0-9a-fA-F]{24}$/)) {
      // ObjectId MongoDB
      devis = await Devis.findById(devisId)
        .populate('vehiculeId')
        .populate('garageId', 'nom emailProfessionnel telephoneProfessionnel');
    } else {
      // ID personnalisé (DEV001, etc.)
      devis = await Devis.findOne({ id: devisId })
        .populate('vehiculeId')
        .populate('garageId', 'nom emailProfessionnel telephoneProfessionnel');
    }

    if (!devis) {
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé'
      });
    }

    // 2️⃣ Vérifier que le véhicule appartient au client
    const vehicule = await Vehicule.findById(devis.vehiculeId);
    
    if (!vehicule || vehicule.proprietaireId.toString() !== clientId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à ce devis'
      });
    }

    // 3️⃣ Retourner le devis tel quel (valeurs de la BD)
    res.json({
      success: true,
      data: {
        ...devis.toObject(),
        // Les champs suivants viennent directement de la BD :
        // - totalHT
        // - totalServicesHT
        // - totalTTC
        // - finalTotalTTC
        // - montantTVA
        // - montantRemise
        // - maindoeuvre
        // - tvaRate
        // - remiseRate
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération devis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du devis',
      error: error.message
    });
  }
};

/**
 * 📊 Obtenir les statistiques des devis du client
 */
export const getClientDevisStats = async (req, res) => {
  try {
    const clientId = req.client._id;

    // Trouver les véhicules du client
    const vehicules = await Vehicule.find({ proprietaireId: clientId });
    const vehiculeIds = vehicules.map(v => v._id);

    if (vehiculeIds.length === 0) {
      return res.json({
        success: true,
        stats: {
          total: 0,
          brouillon: 0,
          envoye: 0,
          accepte: 0,
          refuse: 0
        }
      });
    }

    // Compter par statut
    const stats = await Devis.aggregate([
      {
        $match: {
          vehiculeId: { $in: vehiculeIds }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statsObj = {
      total: 0,
      brouillon: 0,
      envoye: 0,
      accepte: 0,
      refuse: 0
    };

    stats.forEach(stat => {
      statsObj[stat._id] = stat.count;
      statsObj.total += stat.count;
    });

    res.json({
      success: true,
      stats: statsObj
    });

  } catch (error) {
    console.error('❌ Erreur stats devis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};