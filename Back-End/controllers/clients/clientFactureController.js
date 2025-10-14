import Facture from '../../models/Facture.js';
import Devis from '../../models/Devis.js';
import mongoose from 'mongoose';
import CreditNote from '../../models/CreditNote.js';

// ✅ Récupérer toutes les factures du client connecté via ses devis
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

    // ✅ ÉTAPE 1: Récupérer tous les devis du client via ses véhicules
    const clientDevis = await Devis.find({ 
      clientId: req.client._id 
    }).select('_id');

    console.log(`📋 ${clientDevis.length} devis trouvés pour ce client`);

    if (clientDevis.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: parseInt(limit)
        }
      });
    }

    // ✅ ÉTAPE 2: Extraire les IDs des devis
    const devisIds = clientDevis.map(devis => devis._id);
    console.log('📋 IDs des devis:', devisIds);

    // ✅ ÉTAPE 3: Construire la requête pour chercher les factures par devisId
    let query = {
      devisId: { $in: devisIds },
      status: 'active'
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

    // ✅ Mettre à jour les factures en retard
    await Facture.updateOverdueInvoices();

    // ✅ ÉTAPE 4: Récupérer les factures
    const factures = await Facture.find(query)
      .select('numeroFacture clientInfo vehicleInfo totalTTC paymentAmount paymentStatus invoiceDate creditNoteId dueDate garagisteId devisId')
      .populate('garagisteId', 'username email phone streetAddress cityName governorateName')
      .populate('devisId', '_id status createdAt')
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

    // ✅ Récupérer les devis du client
    const clientDevis = await Devis.find({ 
      clientId: req.client._id 
    }).select('_id');

    if (clientDevis.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aucun devis trouvé pour ce client'
      });
    }

    const devisIds = clientDevis.map(devis => devis._id);

    // ✅ Chercher la facture via devisId
    const facture = await Facture.findOne({ 
      _id: id, 
      devisId: { $in: devisIds },
      status: 'active'
    })
      .populate('garagisteId', 'username email phone streetAddress cityName governorateName')
      .populate('devisId', '_id status createdAt');

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

// ✅ Statistiques des factures du client via devis
export const GetClientFactureStats = async (req, res) => {
  try {
    console.log('👤 Calcul stats pour client:', req.client._id);

    // ✅ ÉTAPE 1: Récupérer tous les devis du client
    const clientDevis = await Devis.find({ 
      clientId: req.client._id 
    }).select('_id');

    console.log(`📋 ${clientDevis.length} devis trouvés`);

    if (clientDevis.length === 0) {
      return res.json({
        success: true,
        data: {
          totalFactures: 0,
          totalTTC: 0,
          totalPaye: 0,
          totalPayePartiel: 0,
          facturesPayees: 0,
          facturesEnRetard: 0,
          facturesPartiellesPayees: 0,
          facturesEnAttente: 0,
          totalEncaisse: 0,
          totalImpaye: 0,
          tauxPaiement: 0
        }
      });
    }

    const devisIds = clientDevis.map(devis => devis._id);

    // ✅ Mettre à jour les factures en retard
    await Facture.updateOverdueInvoices();

    // ✅ ÉTAPE 2: Agréger les statistiques des factures liées à ces devis
    const stats = await Facture.aggregate([
      {
        $match: {
          status: 'active',
          devisId: { $in: devisIds }
        }
      },
      {
        $group: {
          _id: null,
          totalFactures: { $sum: 1 },
          totalTTC: { $sum: '$totalTTC' },
          totalPaye: {
            $sum: {
              $cond: [
                { $eq: ['$paymentStatus', 'paye'] },
                '$totalTTC',
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
      totalTTC: 0,
      totalPaye: 0,
      totalPayePartiel: 0,
      facturesPayees: 0,
      facturesEnRetard: 0,
      facturesPartiellesPayees: 0,
      facturesEnAttente: 0
    };

    result.totalEncaisse = result.totalPaye + result.totalPayePartiel;
    result.totalImpaye = result.totalTTC - result.totalEncaisse;
    result.tauxPaiement = result.totalTTC > 0 
      ? ((result.totalEncaisse / result.totalTTC) * 100).toFixed(2) 
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
    console.log('👤 User ID:', req.client._id);
    
    if (!mongoose.Types.ObjectId.isValid(creditNoteId)) {
      return res.status(400).json({
        success: false,
        message: 'ID d\'avoir invalide'
      });
    }
    
    const creditNote = await CreditNote.findById(creditNoteId)
      .populate('originalFactureId', 'numeroFacture devisId');

    if (!creditNote) {
      console.log('❌ Avoir non trouvé');
      return res.status(404).json({
        success: false,
        message: 'Avoir non trouvé'
      });
    }

    // ✅ Vérifier via les devis du client
    const clientDevis = await Devis.find({ 
      clientId: req.client._id 
    }).select('_id');

    const devisIds = clientDevis.map(devis => devis._id.toString());
    
    // Récupérer le devisId de la facture originale
    const originalFacture = await Facture.findById(creditNote.originalFactureId).select('devisId');
    
    if (!originalFacture || !devisIds.includes(originalFacture.devisId.toString())) {
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