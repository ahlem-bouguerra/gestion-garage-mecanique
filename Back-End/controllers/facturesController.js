import Facture from '../models/Facture.js';
import Devis from '../models/Devis.js';
import mongoose from 'mongoose'; // ✅ Import ajouté



export const CreateFacture = async (req, res) => {
  try {
    const { devisId } = req.params;

    // Validation de l'ObjectId
    if (!mongoose.Types.ObjectId.isValid(devisId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de devis invalide' 
      });
    }

    // 1️⃣ Vérifier si le devis existe et est accepté
    const devis = await Devis.findById(devisId);
    if (!devis) {
      return res.status(404).json({ success: false, message: 'Devis non trouvé' });
    }
    if (devis.status !== 'accepte') {
      return res.status(400).json({ success: false, message: 'Seuls les devis acceptés peuvent être facturés' });
    }

    // 2️⃣ Vérifier si une facture existe déjà pour ce devis
    const existingFacture = await Facture.findOne({ devisId: devis._id });
    if (existingFacture) {
      return res.status(400).json({ success: false, message: 'Une facture existe déjà pour ce devis', facture: existingFacture });
    }

    // 3️⃣ Générer automatiquement le numeroFacture (sécurisé)
    const numeroFacture = await Facture.generateFactureId();
    console.log('✅ ID généré:', numeroFacture);

    // 4️⃣ Préparer les données de la facture
    const factureData = {
      numeroFacture: numeroFacture,
      devisId: devis._id,
       clientId: devis.clientId,   // ← ici
  clientInfo: {
    nom: devis.clientName,
    telephone: devis.clientPhone,
    email: devis.clientEmail,
    adresse: devis.clientAddress
  },
      clientName: devis.clientName,
      vehicleInfo: devis.vehicleInfo,
      inspectionDate: devis.inspectionDate,
      services: devis.services.map(service => ({
        pieceId: service.pieceId,
        piece: service.piece,
        quantity: service.quantity,
        unitPrice: service.unitPrice,
        total: service.total || (service.quantity * service.unitPrice)
      })),
      maindoeuvre: devis.maindoeuvre || 0,
      tvaRate: devis.tvaRate || 20,
      totalHT: devis.totalHT || 0,
      totalTVA: (devis.totalTTC - devis.totalHT) || 0,
      totalTTC: devis.totalTTC || 0,
      estimatedTime: devis.estimatedTime,
      createdBy: req.user?.id
    };

    console.log('FactureData avant save:', factureData);

    // 5️⃣ Créer et sauvegarder la facture
    const facture = new Facture(factureData);
    await facture.save();

    // 6️⃣ Population si nécessaire
    const populatedFacture = await Facture.findById(facture._id)
      .populate('clientId', 'nom email telephone')
      .populate('devisId', 'id status');

    // 7️⃣ Réponse réussie
    res.status(201).json({ success: true, message: 'Facture générée avec succès', facture: populatedFacture });

  } catch (error) {
    console.error('Erreur lors de la génération de facture:', error);

    // Si doublon sur numeroFacture (rare, mais possible en cas de requêtes simultanées)
    if (error.code === 11000 && error.keyPattern?.numeroFacture) {
      return res.status(409).json({ success: false, message: 'Numéro de facture déjà existant, réessayez', error: error.message });
    }

    res.status(500).json({ success: false, message: 'Erreur serveur lors de la génération de facture', error: error.message });
  }
};

export const GetAllFactures = async (req, res) => {
  try {
    const {
      clientInfo,
      clientId,
      paymentStatus,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
      sortBy = 'invoiceDate',
      sortOrder = 'desc'
    } = req.query;

    // Construction de la requête avec filtres
    let query = {};

    if (clientId && mongoose.Types.ObjectId.isValid(clientId)) {
      query.clientId = clientId;
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {}; // Utilisez createdAt ou le bon champ de date
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Exécution de la requête
    const factures = await Facture.find(query)
        .select('numeroFacture clientInfo vehicleInfo totalTTC paymentAmount paymentStatus invoiceDate dueDate') // Ajoutez paymentAmount
        .populate('clientInfo', 'nom email telephone')
      .populate('devisId', 'id status')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Compter le total pour la pagination
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
    console.error('Erreur lors de la récupération des factures:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des factures',
      error: error.message
    });
  }
};

export const GetFactureById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validation de l'ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de facture invalide'
      });
    }

    const facture = await Facture.findById(id)
      .populate('clientId', 'nom email telephone adresse')
      .populate('devisId', 'id status')
      .populate('services.pieceId', 'name description');

    if (!facture) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }

    res.json({
      success: true,
      data: facture
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la facture:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération de la facture',
      error: error.message
    });
  }
};

// ✅ FONCTION CORRIGÉE - Récupérer une facture par devisId
// GET /api/factures/by-devis/:devisId
export const getFactureByDevis = async (req, res) => {
try {
    const facture = await Facture.findOne({ devisId: req.params.devisId }).populate("devisId");
    if (!facture) return res.status(404).json({ message: "Aucune facture trouvée pour ce devis" });

    res.json(facture);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const MarquerFacturePayed = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentAmount, paymentMethod, paymentDate } = req.body;

    // Validation de l'ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de facture invalide'
      });
    }

    // Validation des données
    if (!paymentAmount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Montant et méthode de paiement requis'
      });
    }

    const facture = await Facture.findById(id);
    if (!facture) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }

    // Utiliser la méthode du modèle pour marquer comme payée

    await facture.markAsPaid(
      parseFloat(paymentAmount), // Ce montant s'ajoutera au précédent
      paymentMethod,
      paymentDate ? new Date(paymentDate) : new Date()
    );

    res.json({
      success: true,
      message: 'Paiement enregistré avec succès',
      facture: facture
    });

  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'enregistrement du paiement',
      error: error.message
    });
  }
};

export const UpdateFacture = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, dueDate } = req.body;

    // Validation de l'ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de facture invalide'
      });
    }

    const updatedFacture = await Facture.findByIdAndUpdate(
      id,
      {
        notes,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedFacture) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Facture mise à jour avec succès',
      facture: updatedFacture
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la facture:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour',
      error: error.message
    });
  }
};

export const DeleteFacture = async (req, res) => {
  try {
    const { id } = req.params;

    // Validation de l'ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de facture invalide'
      });
    }

    const facture = await Facture.findById(id);
    
    if (!facture) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }

    // Empêcher la suppression si la facture est payée
    if (facture.paymentStatus === 'paye') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer une facture payée'
      });
    }

    await Facture.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Facture supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de la facture:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression',
      error: error.message
    });
  }
};

// 📊 STATISTIQUES DES FACTURES

export const StaticFacture = async (req, res) => {
  try {
    const stats = await Facture.aggregate([
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
          // Nouveau calcul pour les paiements partiels
          totalPayePartiel: {
            $sum: {
              $cond: [
                { $in: ['$paymentStatus', ['partiellement_paye', 'en_retard']] },
                '$paymentAmount', // Montant effectivement payé
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
          // Factures en retard (incluant partiellement payées)
          facturesEnRetard: {
            $sum: {
              $cond: [
                { $eq: ['$paymentStatus', 'en_retard'] },
                1,
                0
              ]
            }
          },
          // Factures partiellement payées (non en retard)
          facturesPartiellesPayees: {
            $sum: {
              $cond: [
                { $eq: ['$paymentStatus', 'partiellement_paye'] },
                1,
                0
              ]
            }
          },
          // Factures en attente
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

    // Calculer le montant total encaissé (payé + partiellement payé)
    result.totalEncaisse = result.totalPaye + result.totalPayePartiel;
    
    // Calculer le montant impayé
    result.totalImpaye = result.totalTTC - result.totalEncaisse;

    // Calculer les pourcentages
    result.tauxPaiement = result.totalTTC > 0 
      ? ((result.totalEncaisse / result.totalTTC) * 100).toFixed(2) 
      : 0;

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Erreur lors du calcul des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du calcul des statistiques',
      error: error.message
    });
  }
};