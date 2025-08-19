import Devis from "../models/Devis.js";


export const createDevis = async (req, res) => {
  try {
    console.log('📥 Données reçues:', req.body); // Pour débugger

    const { clientId, clientName, vehicleInfo, inspectionDate, services, tvaRate,maindoeuvre } = req.body;

    // Calculer les totaux
    let totalHT = 0;
    const processedServices = services.map(service => {
      const serviceTotal = service.quantity * service.unitPrice;
      totalHT += serviceTotal;
      return { ...service, total: serviceTotal };
    });

    const totalTTC = totalHT * (1 + tvaRate / 100);
    
    console.log('🔢 Génération de l\'ID devis...'); // Pour débugger
    const devisId = await Devis.generateDevisId();
    console.log('✅ ID généré:', devisId); // Pour débugger

    const newDevis = new Devis({
      id: devisId,
      clientId,
      clientName,
      vehicleInfo,
      inspectionDate: inspectionDate ,
      services: processedServices,
      totalHT,
      totalTTC,
      tvaRate,
      maindoeuvre
    });

    console.log('💾 Sauvegarde du devis...'); // Pour débugger
    const savedDevis = await newDevis.save();
    console.log('✅ Devis sauvegardé:', savedDevis.id); // Pour débugger

    // ❌ SUPPRIMEZ cette ligne :
    // res.status(201).json(savedDevis);

    // ✅ GARDEZ seulement cette ligne :
    res.status(201).json({
      success: true,
      message: 'Devis créé avec succès',
      data: savedDevis
    });

  } catch (error) {
    console.error('❌ Erreur lors de la création du devis:', error); // Pour débugger
    
    // Vérifier si la réponse n'a pas déjà été envoyée
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du devis',
        error: error.message
      });
    }
  }
};

export const getAllDevis = async (req, res) => {
  try {
    const { status, clientName, dateDebut, dateFin } = req.query;
    const filters = {};

    if (status && status !== 'tous') filters.status = status.toLowerCase();
    if (clientName) filters.clientName = { $regex: clientName, $options: 'i' };
    if (dateDebut || dateFin) {
      filters.inspectionDate = {};
      if (dateDebut) filters.inspectionDate.$gte = new Date(dateDebut);
      if (dateFin) filters.inspectionDate.$lte = new Date(dateFin);
    }

    const devis = await Devis.find(filters).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: devis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des devis',
      error: error.message
    });
  }
};

export const updateDevisStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedDevis = await Devis.findOneAndUpdate(
      { id },
      { status },
      { new: true }
    );

    if (!updatedDevis) {
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé'
      });
    }

    res.json({
      success: true,
      message: `Statut mis à jour: ${status}`,
      data: updatedDevis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour',
      error: error.message
    });
  }
};

export const deleteDevis = async (req, res) => {
  try {
    const { id } = req.params;

    const devis = await Devis.findOne({ id });
    if (!devis) {
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé'
      });
    }

    if (devis.status === 'accepte') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer un devis accepté'
      });
    }

    await Devis.findOneAndDelete({ id });

    res.json({
      success: true,
      message: 'Devis supprimé avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression',
      error: error.message
    });
  }
};