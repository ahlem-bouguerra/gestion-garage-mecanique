import Facture from '../../models/Facture.js';
import Devis from '../../models/Devis.js';
import mongoose from 'mongoose'; // ✅ Import ajouté
import CreditNote from '../../models/CreditNote.js';
import FicheClient from '../../models/FicheClient.js'; 

export const CreateFacture = async (req, res) => {
  try {
    const { devisId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(devisId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de devis invalide' 
      });
    }

    // ⭐ Support SuperAdmin avec ?garageId=xxx ou body.garageId
    let garageIdToUse = req.user.garageId;
    
    if (req.user.isSuperAdmin) {
      garageIdToUse = req.query.garageId || req.body.garageId || req.user.garageId;
    }

    // 1️⃣ Vérifier si le devis existe et est accepté
    const devis = await Devis.findOne({_id: devisId, garageId: garageIdToUse });
    if (!devis) {
      return res.status(404).json({ success: false, message: 'Devis non trouvé' });
    }
    if (devis.status !== 'accepte') {
      return res.status(400).json({ success: false, message: 'Seuls les devis acceptés peuvent être facturés' });
    }

    const ficheClient = await FicheClient.findById(devis.clientId);

    // 2️⃣ Vérifier si une facture existe déjà
    const existingFacture = await Facture.findOne({ 
      devisId: devis._id, 
      garageId: garageIdToUse  
    });
    
    if (existingFacture) {
      return res.status(400).json({ 
        success: false, 
        message: 'Une facture existe déjà pour ce devis', 
        facture: existingFacture 
      });
    }

    // 3️⃣ Générer le numéro
    const numeroFacture = await Facture.generateFactureId();
    const timbreFiscal = 1.000;
    const finalTotalTTCAvecTimbre = (devis.finalTotalTTC || 0) + timbreFiscal;

    // 4️⃣ Créer la facture
    const factureData = {
      numeroFacture: numeroFacture,
      devisId: devis._id,
      clientId: devis.clientId,
      realClientId: ficheClient?.clientId || null,
      garageId: garageIdToUse, // ⭐ Utiliser garageIdToUse
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
        piece: service.piece,
        quantity: service.quantity,
        unitPrice: service.unitPrice,
        total: service.total || (service.quantity * service.unitPrice)
      })),
      maindoeuvre: devis.maindoeuvre || 0,
      tvaRate: devis.tvaRate || 20, 
      remiseRate: devis.remiseRate,
      totalTVA: devis.montantTVA,
      totalRemise: devis.montantRemise,
      timbreFiscal: timbreFiscal,
      finalTotalTTC: finalTotalTTCAvecTimbre,
      totalHT: devis.totalHT || 0,
      totalTTC: devis.totalTTC || 0,
      estimatedTime: devis.estimatedTime,
      createdBy: req.user?.id
    };

    const facture = new Facture(factureData);
    await facture.save();

const populatedFacture = await Facture.findById(facture._id)
  .populate({
    path: 'clientId',
    model: 'FicheClient',
    select: 'nom email telephone clientId',
    populate: {
      path: 'clientId',
      model: 'Client',
      select: 'username email phone'
    }
  })
  .populate({
    path: 'realClientId',
    model: 'Client',
    select: 'username email phone'
  })
  .populate('devisId', 'id status');

    res.status(201).json({ 
      success: true, 
      message: 'Facture générée avec succès', 
      facture: populatedFacture 
    });

  } catch (error) {
    console.error('Erreur:', error);
    
    if (error.code === 11000 && error.keyPattern?.numeroFacture) {
      return res.status(409).json({ 
        success: false, 
        message: 'Numéro de facture déjà existant', 
        error: error.message 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
};

export const GetAllFactures = async (req, res) => {
  try {
    const {
      garageId, // 👈 Nouveau paramètre pour Super Admin
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

    // 🔑 Logique intelligente pour garageId
    let targetGarageId;
    
    if (req.user.role === 'superadmin') {
      // Super Admin DOIT fournir garageId en query
      if (!garageId) {
        return res.status(400).json({
          success: false,
          message: 'garageId requis pour Super Admin'
        });
      }
      targetGarageId = garageId;
    } else {
      // Garage normal utilise son propre ID
      targetGarageId = req.user.garageId;
    }

    // Construction de la requête avec filtres
    let query = { garageId: targetGarageId }; // 👈 Utilise targetGarageId

    if (clientId && mongoose.Types.ObjectId.isValid(clientId)) {
      query.clientId = clientId;
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Exécution de la requête
const factures = await Facture.find(query)
  .select('numeroFacture clientInfo vehicleInfo totalTTC finalTotalTTC paymentAmount paymentStatus invoiceDate creditNoteId dueDate')
  .populate({
    path: 'clientId',
    model: 'FicheClient',
    select: 'nom email telephone clientId',
    populate: {
      path: 'clientId',
      model: 'Client',
      select: 'username email phone'
    }
  })
  .populate({
    path: 'realClientId',
    model: 'Client',
    select: 'username email phone'
  })
  .populate('devisId', 'id status')
  .sort(sortOptions)
  .skip(skip)
  .limit(parseInt(limit));

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
export const StaticFacture = async (req, res) => {
  try {
        const { garageId } = req.query; // 👈 Accepter garageId

    let targetGarageId;
    
    if (req.user.role === 'superadmin') {
      if (!garageId) {
        return res.status(400).json({
          success: false,
          message: 'garageId requis pour Super Admin'
        });
      }
      targetGarageId = garageId;
    } else {
      targetGarageId = req.user.garageId;
    }
    const stats = await Facture.aggregate([
  {
    $match: {
      status: 'active', // <-- exclut les factures annulées
      garageId: new mongoose.Types.ObjectId(targetGarageId) 
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

    // Calculer le montant total encaissé (payé + partiellement payé)
    result.totalEncaisse = result.totalPaye + result.totalPayePartiel;
    
    // Calculer le montant impayé
    result.totalImpaye = result.finalTotalTTC - result.totalEncaisse;

    // Calculer les pourcentages
    result.tauxPaiement = result.finalTotalTTC > 0 
      ? ((result.totalEncaisse / result.finalTotalTTC) * 100).toFixed(2) 
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

export const GetFactureById = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔐 Récupération du garageId
    let garageIdToUse = req.user.garageId; // valeur par défaut

    // 👑 Si user = super admin -> il peut envoyer ?garageId=xxx
    if (req.user.isSuperAdmin && req.query.garageId) {
      garageIdToUse = req.query.garageId;
    }

    // Vérification ObjectId facture
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID de facture invalide"
      });
    }

    // Vérification ObjectId garage
    if (!mongoose.Types.ObjectId.isValid(garageIdToUse)) {
      return res.status(400).json({
        success: false,
        message: "ID garage invalide"
      });
    }

    const facture = await Facture.findOne({
  _id: id,
  garageId: garageIdToUse
})
  .populate({
    path: 'clientId',
    model: 'FicheClient',
    select: 'nom email telephone adresse clientId',
    populate: {
      path: 'clientId',
      model: 'Client',
      select: 'username email phone'
    }
  })
  .populate({
    path: 'realClientId',
    model: 'Client',
    select: 'username email phone'
  })
  .populate('devisId', 'id status')
  .populate('services', 'name description')
  .populate('garageId', 'nom governorateName cityName streetAddress telephoneProfessionnel emailProfessionnel');

    if (!facture) {
      return res.status(404).json({
        success: false,
        message: "Facture non trouvée"
      });
    }

    res.json({
      success: true,
      data: facture
    });

  } catch (error) {
    console.error("Erreur lors de la récupération de la facture:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération de la facture",
      error: error.message
    });
  }
};



export const getFactureByDevis = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        message: "Utilisateur non authentifié"
      });
    }

    // 🎯 Déterminer quel garageId utiliser
    let garageIdToUse = req.user.garageId;

    if (req.user.isSuperAdmin) {
      if (!req.query.garageId) {
        return res.status(400).json({
          message: "garageId est requis pour SuperAdmin"
        });
      }
      garageIdToUse = req.query.garageId;
    }

    // ⭐ Vérifier que garageIdToUse est défini
    if (!garageIdToUse) {
      return res.status(400).json({
        message: "garageId manquant"
      });
    }

    const facture = await Facture.findOne({
      garageId: garageIdToUse,
      devisId: req.params.devisId,
      status: "active"
    }).populate("devisId");

    if (!facture) {
      return res.status(404).json({
        message: "Aucune facture active trouvée pour ce devis"
      });
    }

    return res.json(facture);

  } catch (err) {
    console.error("❌ Erreur getFactureByDevis:", err);
    return res.status(500).json({ message: err.message });
  }
};


export const MarquerFacturePayed = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentAmount, paymentMethod, paymentDate, garageId: garageIdFromBody } = req.body;

    // Déterminer le garageId à utiliser
    const garageId = garageIdFromBody || req.user.garageId;

    console.log('💡 Role utilisateur:', req.user.role);
    console.log('💡 garageId reçu du body:', garageIdFromBody);
    console.log('💡 garageId utilisé:', garageId);

    // Vérification garageId
    if (!garageId || !mongoose.Types.ObjectId.isValid(garageId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de garage invalide ou manquant'
      });
    }

    // Vérification factureId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de facture invalide'
      });
    }

    // Vérification des données de paiement
    if (!paymentAmount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Montant et méthode de paiement requis'
      });
    }

    // Chercher la facture avec la bonne combinaison facture + garage
    const facture = await Facture.findOne({ _id: id, garageId });
    if (!facture) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée pour ce garage'
      });
    }

    // Marquer la facture comme payée
    await facture.markAsPaid(
      parseFloat(paymentAmount),
      paymentMethod,
      paymentDate ? new Date(paymentDate) : new Date()
    );

    res.json({
      success: true,
      message: 'Paiement enregistré avec succès',
      facture
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
      { _id: id, garageId: req.user.garageId },
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

    const facture = await Facture.findOne({ _id: id, garageId: req.user.garageId});;
    
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



export const CreateFactureWithCredit = async (req, res) => {
  try {
    let garageIdToUse = req.user.garageId;

if (req.user.isSuperAdmin) {
  if (!req.query.garageId) {
    return res.status(400).json({
      success: false,
      message: "garageId est requis pour un SuperAdmin"
    });
  }
  garageIdToUse = req.query.garageId;
}
    const { devisId } = req.params;
    const { createCreditNote = false } = req.body;
    const timbreFiscal = 1.000;

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
      garageId: garageIdToUse

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
      garageId: garageIdToUse

    });

    let creditNote = null;
 const ficheClient = await FicheClient.findById(devis.clientId);
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
        remiseRate: existingFacture.remiseRate,
        totalRemise: existingFacture.totalRemise,
        timbreFiscal: existingFacture.timbreFiscal || timbreFiscal, // ✅ Prendre celui de la facture
        finalTotalTTC: existingFacture.finalTotalTTC,
        totalHT: existingFacture.totalHT,
        totalTVA: existingFacture.totalTVA,
        totalTTC: existingFacture.totalTTC,
        reason: 'Annulation suite à modification du devis',
        creditDate: new Date(),
        createdBy: req.user?.id,
        garageId: garageIdToUse

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
     const totalRemise = totalTTC * ((devis.remiseRate || 0) / 100);

    const finalTotalTTC = (totalTTC - totalRemise) + timbreFiscal;

    // 5. Créer la nouvelle facture
    const numeroFacture = await Facture.generateFactureId();

    const newFactureData = {
      numeroFacture: numeroFacture,
      devisId: devis._id,
      clientId: devis.clientId,
      realClientId: ficheClient?.clientId || null,
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
      totalRemise: totalRemise,
      timbreFiscal: timbreFiscal, // ✅ Ajoutez explicitement
      finalTotalTTC: finalTotalTTC, 
      totalTTC: totalTTC,
      remiseRate: devis.remiseRate,
      estimatedTime: devis.estimatedTime,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdBy: req.user?.id,
      garageId: garageIdToUse,

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

const populatedFacture = await Facture.findById(newFacture._id)
  .populate({
    path: 'clientId',
    model: 'FicheClient',
    select: 'nom email telephone clientId',
    populate: {
      path: 'clientId',
      model: 'Client',
      select: 'username email phone'
    }
  })
  .populate({
    path: 'realClientId',
    model: 'Client',
    select: 'username email phone'
  })
  .populate('devisId', 'id status');

const populatedCreditNote = creditNote ? 
  await CreditNote.findById(creditNote._id)
    .populate({
      path: 'clientId',
      model: 'FicheClient',
      select: 'nom email telephone clientId',
      populate: {
        path: 'clientId',
        model: 'Client',
        select: 'username email phone'
      }
    })
    .populate('originalFactureId', 'numeroFacture') :
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

export const getCreditNoteById = async (req, res) => {
  try {
    let garageIdToUse = req.user.garageId;

    // ✅ Gestion SuperAdmin
    if (req.user.isSuperAdmin) {
      if (!req.query.garageId) {
        return res.status(400).json({
          success: false,
          message: "garageId est requis pour un SuperAdmin"
        });
      }
      garageIdToUse = req.query.garageId;
    }
    
    const { creditNoteId } = req.params;
    console.log('🔍 Recherche avoir ID:', creditNoteId);
    console.log('👤 User ID:', req.user._id);
    console.log('🏢 Garage ID utilisé:', garageIdToUse);
    
    // Vérifiez d'abord si l'avoir existe (sans filtre garageId)
    const existsCheck = await CreditNote.findById(creditNoteId);
    console.log('💾 Avoir existe?', !!existsCheck);
    
const creditNote = await CreditNote.findOne({
  _id: creditNoteId,
  garageId: garageIdToUse
})
  .populate({
    path: 'clientId',
    model: 'FicheClient',
    select: 'nom email telephone adresse clientId',
    populate: {
      path: 'clientId',
      model: 'Client',
      select: 'username email phone'
    }
  })
  .populate('originalFactureId', 'numeroFacture')
  .populate('services', 'name description');

    if (!creditNote) {
      console.log('❌ Avoir non trouvé pour ce garage');
      return res.status(404).json({
        success: false,
        message: 'Avoir non trouvé'
      });
    }

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

export const GetPaymentsOverviewData = async (req, res) => {
  try {
    console.log('📊 GetPaymentsOverviewData appelé');
    console.log('👤 User ID:', req.user._id);
    console.log('⏰ TimeFrame:', req.query.timeFrame);

    const { timeFrame = 'monthly' } = req.query;
    
    // ✅ IMPORTANT : Convertir en ObjectId si c'est une string
    const garageId = mongoose.Types.ObjectId.isValid(req.user.garageId) 
      ? new mongoose.Types.ObjectId(req.user.garageId)
      : req.user.garageId;

    // Déterminer la plage de dates selon le timeFrame
    let startDate, groupFormat;
    const now = new Date();

    switch (timeFrame) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$invoiceDate" } };
        break;
      case 'weekly':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        groupFormat = { 
          $dateToString: { 
            format: "%Y-W%U", // %U au lieu de %V
            date: "$invoiceDate" 
          } 
        };
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear() - 5, 0, 1);
        groupFormat = { $dateToString: { format: "%Y", date: "$invoiceDate" } };
        break;
      case 'monthly':
      default:
        startDate = new Date(now.getFullYear(), 0, 1);
        groupFormat = { $dateToString: { format: "%Y-%m", date: "$invoiceDate" } };
        break;
    }

    console.log('📅 Date de début:', startDate);
    console.log('🔧 Format de groupe:', groupFormat);

    // Agrégation pour les totaux
    const facturesData = await Facture.aggregate([
      {
        $match: {
          garageId: garageId, // ✅ ObjectId converti
          status: 'active',
          invoiceDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: groupFormat,
          totalAmount: { $sum: '$finalTotalTTC' },
          paidAmount: {
            $sum: {
              $cond: [
                { $eq: ['$paymentStatus', 'paye'] },
                '$finalTotalTTC',
                { $ifNull: ['$paymentAmount', 0] }
              ]
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    console.log('📊 Données trouvées:', facturesData.length, 'périodes');

    // Formater les données pour le graphique
    const formattedData = {
      total: facturesData.map(item => ({
        x: item._id,
        y: parseFloat(item.totalAmount.toFixed(2))
      })),
      paid: facturesData.map(item => ({
        x: item._id,
        y: parseFloat(item.paidAmount.toFixed(2))
      }))
    };

    console.log('✅ Données formatées:', formattedData);

    res.json({
      success: true,
      data: formattedData,
      timeFrame: timeFrame
    });

  } catch (error) {
    console.error('❌ Erreur GetPaymentsOverviewData:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message,
      stack: error.stack // Pour debug
    });
  }
};
export const GetWeeksProfitData = async (req, res) => {
  try {
    const { weeksCount = 12 } = req.query;
    const garageId = mongoose.Types.ObjectId.isValid(req.user.garageId) 
      ? new mongoose.Types.ObjectId(req.user.garageId)
      : req.user.garageId;

    const weeksAgo = new Date();
    weeksAgo.setDate(weeksAgo.getDate() - (weeksCount * 7));

    const facturesData = await Facture.aggregate([
      {
        $match: {
          garageId: garageId,
          status: 'active',
          invoiceDate: { $gte: weeksAgo }
        }
      },
      {
        $group: {
          _id: { 
            $dateToString: { 
              format: "%Y-W%U", 
              date: "$invoiceDate" 
            } 
          },
          revenue: { $sum: '$finalTotalTTC' },
          // Ajoutez les dépenses si vous les avez
          expenses: { $sum: 0 }
        }
      },
      {
        $project: {
          week: '$_id',
          revenue: 1,
          expenses: 1,
          profit: { $subtract: ['$revenue', '$expenses'] }
        }
      },
      {
        $sort: { week: 1 }
      }
    ]);

    res.json({
      success: true,
      data: facturesData
    });

  } catch (error) {
    console.error('❌ Erreur GetWeeksProfitData:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

export const GetDevicesUsedData = async (req, res) => {
  try {
    console.log('📊 GetDevicesUsedData appelé');
    
    const garageId = mongoose.Types.ObjectId.isValid(req.user.garageId) 
      ? new mongoose.Types.ObjectId(req.user.garageId)
      : req.user.garageId;

    // ✅ Agrégation par statut de paiement
    const devicesData = await Facture.aggregate([
      {
        $match: {
          garageId: garageId,
          status: 'active'
        }
      },
      {
        $group: {
          _id: '$paymentStatus', // ✅ Utiliser un champ qui existe
          count: { $sum: 1 },
          totalAmount: { $sum: '$finalTotalTTC' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    console.log('📊 Données trouvées:', devicesData);

    // ✅ Mapper les statuts en français
    const statusLabels = {
      'paye': 'Payé',
      'partiellement_paye': 'Partiellement payé',
      'non_paye': 'Non payé',
      'en_attente': 'En attente'
    };

    const total = devicesData.reduce((sum, item) => sum + item.count, 0);
    
    // ✅ Formater les données
    let formattedData = devicesData.map(item => ({
      device: statusLabels[item._id] || item._id || 'Inconnu',
      value: item.count,
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0
    }));

    // ✅ Données de fallback si aucune facture
    if (formattedData.length === 0) {
      formattedData = [
        { device: 'Aucune facture', value: 1, percentage: 100 }
      ];
    }

    console.log('✅ Données formatées:', formattedData);

    res.json({
      success: true,
      data: formattedData
    });

  } catch (error) {
    console.error('❌ Erreur GetDevicesUsedData:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};