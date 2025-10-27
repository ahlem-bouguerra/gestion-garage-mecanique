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
      .select('numeroFacture clientInfo vehicleInfo totalTTC paymentAmount paymentStatus invoiceDate creditNoteId dueDate garagisteId devisId')
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

export const CreateFactureWithCredit = async (req, res) => {
  try {
    const { devisId } = req.params;
    const { createCreditNote = false } = req.body;

    // Validation de l'ObjectId
    if (!mongoose.Types.ObjectId.isValid(devisId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de devis invalide' 
      });
    }

    // 1. Récupérer le devis avec filtrage garagiste
    const devis = await Devis.findOne({ 
      _id: devisId, 
      garagisteId: req.user._id 
    });
    if (!devis) {
      return res.status(404).json({ 
        success: false, 
        message: 'Devis non trouvé' 
      });
    }

    // 2. Vérifier si une facture existe déjà avec filtrage garagiste
    const existingFacture = await Facture.findOne({ 
      devisId: devisId, 
      status: 'active',
      garagisteId: req.user._id 
    });

    let creditNote = null;

    // 3. Si facture existe ET que l'utilisateur veut créer un avoir
    if (existingFacture && createCreditNote) {
      // Générer le numéro d'avoir
      const creditNumber = await CreditNote.generateCreditNumber();
      
      // Créer l'avoir
      creditNote = new CreditNote({
        creditNumber: creditNumber,
        originalFactureId: existingFacture._id,
        originalFactureNumber: existingFacture.numeroFacture,
        clientId: existingFacture.clientId,
        clientInfo: existingFacture.clientInfo,
        vehicleInfo: existingFacture.vehicleInfo,
        inspectionDate: existingFacture.inspectionDate,
        services: existingFacture.services.map(service => ({
          ...service.toObject(),
          total: service.total || (service.quantity * service.unitPrice)
        })),
        maindoeuvre: existingFacture.maindoeuvre,
        tvaRate: existingFacture.tvaRate,
        totalHT: existingFacture.totalHT,
        totalTVA: existingFacture.totalTVA,
        totalTTC: existingFacture.totalTTC,
        reason: 'Annulation suite à modification du devis',
        creditDate: new Date(),
        createdBy: req.user?.id,
        garagisteId: req.user._id
      });
      
      await creditNote.save();

      // Marquer l'ancienne facture comme annulée
      await Facture.findByIdAndUpdate(existingFacture._id, {
        paymentStatus: 'annule',
        status: 'cancelled',
        creditNoteId: creditNote._id,
        cancelledAt: new Date()
      });

      console.log('✅ Avoir créé:', creditNumber);
    }

    // 4. Calculer les totaux du nouveau devis
    const totalServicesHT = devis.services.reduce((sum, service) => {
      return sum + ((service.quantity || 0) * (service.unitPrice || 0));
    }, 0);

    const totalHT = totalServicesHT + (devis.maindoeuvre || 0);
    const totalTVA = totalHT * ((devis.tvaRate || 20) / 100);
    const totalTTC = totalHT + totalTVA;

    // 5. Créer la nouvelle facture
    const numeroFacture = await Facture.generateFactureId();
    
    const newFactureData = {
      numeroFacture: numeroFacture,
      devisId: devis._id,
      clientId: devis.clientId,
      clientInfo: {
        nom: devis.clientName
      },
      vehicleInfo: devis.vehicleInfo,
      inspectionDate: devis.inspectionDate,
      services: devis.services.map(service => ({
        piece: service.piece,
        quantity: service.quantity,
        unitPrice: service.unitPrice,
        total: (service.quantity || 0) * (service.unitPrice || 0)
      })),
      maindoeuvre: devis.maindoeuvre || 0,
      tvaRate: devis.tvaRate || 20,
      totalHT: totalHT,
      totalTVA: totalTVA,
      totalTTC: totalTTC,
      estimatedTime: devis.estimatedTime,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdBy: req.user?.id,
      garagisteId: req.user._id,
      status: 'active'
    };

    // Si on a créé un avoir, lier la nouvelle facture à l'ancienne
    if (existingFacture && creditNote) {
      newFactureData.replacedByFactureId = existingFacture._id;
      
      // Mettre à jour l'ancienne facture avec la référence de remplacement
      await Facture.findByIdAndUpdate(existingFacture._id, {
        replacedByFactureId: null // sera mis à jour après création
      });
    }

    const newFacture = new Facture(newFactureData);
    await newFacture.save();

    // Mettre à jour la référence dans l'ancienne facture
    if (existingFacture && creditNote) {
      await Facture.findByIdAndUpdate(existingFacture._id, {
        replacedByFactureId: newFacture._id
      });
    }

    // 6. Mettre à jour le devis
    await Devis.findByIdAndUpdate(devisId, { 
      factureId: newFacture._id,
      updatedAt: new Date()
    });

    // 7. Populer la réponse
    const populatedFacture = await Facture.findById(newFacture._id)
      .populate('clientId', 'nom email telephone')
      .populate('devisId', 'id status');

    const populatedCreditNote = creditNote ? 
      await CreditNote.findById(creditNote._id).populate('originalFactureId', 'numeroFacture') :
      null;

    // 8. Réponse avec les deux documents
    res.status(201).json({ 
      success: true, 
      message: creditNote ? 
        'Avoir créé et nouvelle facture générée avec succès' : 
        'Nouvelle facture créée avec succès',
      facture: populatedFacture,
      creditNote: populatedCreditNote,
      workflow: creditNote ? 'credit_and_new' : 'new_only'
    });

  } catch (error) {
    console.error('❌ Erreur création facture avec avoir:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        message: 'Numéro de document déjà existant, réessayez' 
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Données invalides', 
        details: error.message 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
};
export const handleClientPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentAmount, paymentMethod, paymentDate, reference } = req.body;

    // Trouver la facture du client
    const facture = await Facture.findOne({ 
      _id: id, 
      realClientId: req.client._id,
      status: 'active'
    });

    if (!facture) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }

    // Enregistrer le paiement
    await facture.markAsPaid(
      parseFloat(paymentAmount),
      paymentMethod,
      paymentDate ? new Date(paymentDate) : new Date(),
      reference
    );

    res.json({
      success: true,
      message: 'Paiement enregistré avec succès',
      facture: facture
    });

  } catch (error) {
    console.error('Erreur paiement client:', error);
    res.status(500).json({
      success: false,
      message: error.message
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
      .populate('originalFactureId', 'numeroFacture realClientId');

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