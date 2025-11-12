import Facture from '../../models/Facture.js';
import Devis from '../../models/Devis.js';
import mongoose from 'mongoose';
import CreditNote from '../../models/CreditNote.js';

// ✅ Récupérer toutes les factures du client connecté
export const getClientFactures = async (req, res) => {
  try {
    const {
      paymentStatus,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
      sortBy = 'invoiceDate',
      sortOrder = 'desc'
    } = req.query;

    console.log('👤 Client ID:', req.client._id);

    // ✅ Construire la requête directement avec realClientId
    let query = {
      realClientId: req.client._id,
      status: { $in: ['active', 'cancelled'] }
    };

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    console.log('🔍 Query factures:', JSON.stringify(query, null, 2));

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // ✅ Récupérer les factures directement
    const factures = await Facture.find(query)
      .select('numeroFacture clientInfo vehicleInfo totalTTC finalTotalTTC paymentAmount paymentStatus invoiceDate creditNoteId dueDate garagisteId devisId')
      .populate('garagisteId', 'username email phone streetAddress cityName governorateName')
      .populate('devisId', '_id status createdAt')
      .populate('realClientId', 'email phone')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    console.log(`✅ ${factures.length} facture(s) trouvée(s)`);

    const total = await Facture.countDocuments(query);

    res.json({
      success: true,
      data: factures,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des factures client:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des factures',
      error: error.message
    });
  }
};


// ✅ Récupérer une facture spécifique par son ID
export const GetClientFactureById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de facture invalide'
      });
    }

    // ✅ Chercher directement la facture avec realClientId
    const facture = await Facture.findOne({ 
      _id: id, 
      realClientId: req.client._id,
      status: { $in: ['active', 'cancelled'] }
    })
      .populate('garagisteId', 'username email phone streetAddress cityName governorateName')
      .populate('devisId', '_id status createdAt')
      .populate('realClientId', 'email phone');

    if (!facture) {
      console.log('❌ Facture non trouvée');
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }

    console.log('✅ Facture trouvée:', facture.numeroFacture);

    res.json({
      success: true,
      data: facture
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la facture:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération de la facture',
      error: error.message
    });
  }
};

// ✅ Statistiques des factures du client
export const GetClientFactureStats = async (req, res) => {
  try {
    console.log('👤 Calcul stats pour client:', req.client._id);

    // ✅ Agréger les statistiques directement avec realClientId
    const stats = await Facture.aggregate([
      {
        $match: {
          status: 'active',
          realClientId: new mongoose.Types.ObjectId(req.client._id)
        }
      },
      {
        $group: {
          _id: null,
          totalFactures: { $sum: 1 },
          finalTotalTTC: { $sum: '$finalTotalTTC' },
          totalPaye: {
            $sum: {
              $cond: [
                { $eq: ['$paymentStatus', 'paye'] },
                '$finalTotalTTC',
                0
              ]
            }
          },
          totalPayePartiel: {
            $sum: {
              $cond: [
                { $in: ['$paymentStatus', ['partiellement_paye', 'en_retard']] },
                '$paymentAmount',
                0
              ]
            }
          },
          facturesPayees: {
            $sum: {
              $cond: [
                { $eq: ['$paymentStatus', 'paye'] },
                1,
                0
              ]
            }
          },
          facturesEnRetard: {
            $sum: {
              $cond: [
                { $eq: ['$paymentStatus', 'en_retard'] },
                1,
                0
              ]
            }
          },
          facturesPartiellesPayees: {
            $sum: {
              $cond: [
                { $eq: ['$paymentStatus', 'partiellement_paye'] },
                1,
                0
              ]
            }
          },
          facturesEnAttente: {
            $sum: {
              $cond: [
                { $eq: ['$paymentStatus', 'en_attente'] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalFactures: 0,
      finalTotalTTC: 0,
      totalPaye: 0,
      totalPayePartiel: 0,
      facturesPayees: 0,
      facturesEnRetard: 0,
      facturesPartiellesPayees: 0,
      facturesEnAttente: 0
    };

    result.totalEncaisse = result.totalPaye + result.totalPayePartiel;
    result.totalImpaye = result.finalTotalTTC - result.totalEncaisse;
    result.tauxPaiement = result.finalTotalTTC > 0 
      ? ((result.totalEncaisse / result.finalTotalTTC) * 100).toFixed(2) 
      : 0;

    console.log('✅ Stats calculées:', result);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Erreur lors du calcul des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du calcul des statistiques',
      error: error.message
    });
  }
};

// ✅ Récupérer l'avoir associé à une facture
export const getClientCreditNoteById = async (req, res) => {
  try {
    const { creditNoteId } = req.params;
    console.log('🔍 Recherche avoir ID:', creditNoteId);
    console.log('👤 Client ID:', req.client._id);
    
    if (!mongoose.Types.ObjectId.isValid(creditNoteId)) {
      return res.status(400).json({
        success: false,
        message: 'ID d\'avoir invalide'
      });
    }
    
    const creditNote = await CreditNote.findById(creditNoteId)
      .populate('originalFactureId', 'numeroFacture realClientId')
      .populate('clientId', 'nom email telephone adresse'); 

    if (!creditNote) {
      console.log('❌ Avoir non trouvé');
      return res.status(404).json({
        success: false,
        message: 'Avoir non trouvé'
      });
    }

    // ✅ Vérifier via realClientId de la facture originale
    const originalFacture = await Facture.findById(creditNote.originalFactureId).select('realClientId');
    
    if (!originalFacture || originalFacture.realClientId.toString() !== req.client._id.toString()) {
      console.log('❌ Accès non autorisé');
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à cet avoir'
      });
    }

    console.log('✅ Avoir autorisé');

    res.json({
      success: true,
      data: creditNote
    });
  } catch (error) {
    console.error('❌ Erreur récupération avoir:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};