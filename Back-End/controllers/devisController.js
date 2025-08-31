import Devis from "../models/Devis.js";
import OrdreTravail from '../models/Ordre.js'; 

export const createDevis = async (req, res) => {
  try {
    console.log('📥 Données reçues:', req.body);

    const { clientId, clientName, vehicleInfo, inspectionDate, services, tvaRate, maindoeuvre,estimatedTime } = req.body;

    // ✅ CALCUL CORRECT DES TOTAUX
    // 1. Total des services (pièces seulement)
    let totalServicesHT = 0;
    const processedServices = services.map(service => {
      const serviceTotal = service.quantity * service.unitPrice;
      totalServicesHT += serviceTotal;
      return { ...service, total: serviceTotal };
    });

    // 2. Total HT = services + main d'œuvre
    const totalHT = totalServicesHT + (maindoeuvre || 0);

    // 3. Total TTC = Total HT + TVA
    const totalTTC = totalHT * (1 + (tvaRate || 20) / 100);

    console.log('🔢 Calculs:');
    console.log('- Total services HT:', totalServicesHT);
    console.log('- Main d\'œuvre:', maindoeuvre || 0);
    console.log('- Total HT:', totalHT);
    console.log('- Taux TVA:', tvaRate || 20, '%');
    console.log('- Total TTC:', totalTTC);

    const devisId = await Devis.generateDevisId();
    console.log('✅ ID généré:', devisId);

    const newDevis = new Devis({
      id: devisId,
      clientId,
      clientName,
      vehicleInfo,
      inspectionDate,
      services: processedServices,
      totalServicesHT: totalServicesHT,
      totalHT: totalHT, // ✅ Stocke seulement le total des services
      totalTTC,
      tvaRate: tvaRate || 20,
      maindoeuvre: maindoeuvre || 0,
      status: 'brouillon',
      estimatedTime,
    });

    console.log('💾 Sauvegarde du devis...');
    const savedDevis = await newDevis.save();
    console.log('✅ Devis sauvegardé:', savedDevis.id);

    res.status(201).json({
      success: true,
      message: 'Devis créé avec succès',
      data: savedDevis
    });

  } catch (error) {
    console.error('❌ Erreur lors de la création du devis:', error);

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
      filters.inspectionDate = {}; // ✅ Changé de 'date' à 'inspectionDate'
      
      if (dateDebut) {
        // ✅ Comme c'est un String, on compare directement les strings au format ISO
        filters.inspectionDate.$gte = dateDebut; // Pas besoin de new Date()
      }
      if (dateFin) {
        filters.inspectionDate.$lte = dateFin;
      }
    }

    console.log('🔍 Filtres appliqués:', JSON.stringify(filters, null, 2));
    const devis = await Devis.find(filters).sort({ createdAt: -1 });
    console.log('📊 Nombre de résultats:', devis.length);

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


// GET /api/vehicules/:id - Récupérer un véhicule spécifique
export const getDevisById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const devis = await Devis.findById(id);
    
    if (!devis) {
      return res.status(404).json({ error: 'devis non trouvé' });
    }
    
    res.json(devis);
  } catch (error) {
    console.error("❌ Erreur getdevisById:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getDevisByNum = async (req, res) => {
  try {
    const { id } = req.params; // ex: "DEV017"

    // 🔎 Recherche du devis via le champ "id" (pas _id)
    const devis = await Devis.findOne({ id: id });

    if (!devis) {
      return res.status(404).json({ error: `Devis avec id ${id} non trouvé` });
    }

    // 🔎 Recherche des ordres liés à ce devis
    const ordres = await OrdreTravail.find({ devisId: id });

    // 📝 Retourne le devis avec la liste des ordres liés
    res.json({
      devis,
      ordres,
    });
  } catch (error) {
    console.error("❌ Erreur getDevisByNum:", error);
    res.status(500).json({ error: error.message });
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

export const updateDevis = async (req, res) => {
  try {
    const { id } = req.params;
    const { clientId, clientName, vehicleInfo, inspectionDate, services, tvaRate, maindoeuvre ,estimatedTime} = req.body;

    console.log('🔄 Mise à jour devis:', id);
    console.log('📥 Nouvelles données:', req.body);

    // Vérifier que le devis existe
    const existingDevis = await Devis.findOne({ id });
    if (!existingDevis) {
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé'
      });
    }

    // ✅ RECALCULER LES TOTAUX (même logique que create)
    let totalServicesHT = 0;
    const processedServices = services.map(service => {
      const serviceTotal = service.quantity * service.unitPrice;
      totalServicesHT += serviceTotal;
      return { ...service, total: serviceTotal };
    });

    const totalHT = totalServicesHT + (maindoeuvre || 0);
    const totalTTC = totalHT * (1 + (tvaRate || 20) / 100);

    console.log('🔢 Nouveaux calculs:');
    console.log('- Total services HT:', totalServicesHT);
    console.log('- Main d\'œuvre:', maindoeuvre || 0);
    console.log('- Total HT:', totalHT);
    console.log('- Total TTC:', totalTTC);

    // Mettre à jour le devis
    const updatedDevis = await Devis.findOneAndUpdate(
      { id },
      {
        clientId,
        clientName,
        vehicleInfo,
        inspectionDate,
        services: processedServices,
        totalServicesHT: totalServicesHT,
        totalHT: totalHT,
        totalTTC,
        tvaRate: tvaRate || 20,
        maindoeuvre: maindoeuvre || 0,
        status: 'brouillon', // ✅ Remettre en brouillon après modification
        estimatedTime,
      },
      {
        new: true, // Retourner le document mis à jour
        runValidators: true // Valider les données
      }
    );

    console.log('✅ Devis mis à jour:', updatedDevis.id);

    res.json({
      success: true,
      message: 'Devis mis à jour avec succès',
      data: updatedDevis
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour devis:', error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du devis',
        error: error.message
      });
    }
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



export const acceptDevis = async (req, res) => {
  try {
    const { devisId } = req.params;
    const devis = await Devis.findByIdAndUpdate(
      devisId, 
      { status: 'accepte' }, 
      { new: true }
    );
    
    if (!devis) {
      return res.status(404).send(`
        <html><body><h1>❌ Devis non trouvé</h1></body></html>
      `);
    }

    console.log(`✅ Devis ${devisId} accepté`);
    
    res.send(`
      <html>
        <head><title>Devis Accepté</title><meta charset="UTF-8"></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <div style="max-width:500px;margin:0 auto;background:#fff;padding:40px;border-radius:10px;box-shadow:0 4px 6px rgba(0,0,0,0.1)">
            <h1 style="color:#27ae60">✅ Devis Accepté !</h1>
            <p>Merci d'avoir accepté notre devis <strong>N° ${devis.id}</strong></p>
            <p>Nous vous contacterons très prochainement pour programmer les travaux.</p>
            <hr style="margin:30px 0;">
          </div>
        </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Erreur acceptation devis:', error);
    res.status(500).send(`<html><body><h1>❌ Erreur technique</h1></body></html>`);
  }
};

export const refuseDevis = async (req, res) => {
  try {
    const { devisId } = req.params;
    const devis = await Devis.findByIdAndUpdate(
      devisId, 
      { status: 'refuse' }, 
      { new: true }
    );
    
    if (!devis) {
      return res.status(404).send(`
        <html><body><h1>❌ Devis non trouvé</h1></body></html>
      `);
    }

    console.log(`❌ Devis ${devisId} refusé`);
    
    res.send(`
      <html>
        <head><title>Devis Refusé</title><meta charset="UTF-8"></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <div style="max-width:500px;margin:0 auto;background:#fff;padding:40px;border-radius:10px;box-shadow:0 4px 6px rgba(0,0,0,0.1)">
            <h1 style="color:#e74c3c">❌ Devis Refusé</h1>
            <p>Nous avons bien pris en compte votre refus du devis <strong>N° ${devis.id}</strong></p>
            <p>Merci de nous avoir consultés. N'hésitez pas à revenir vers nous pour vos futurs besoins.</p>
            <hr style="margin:30px 0;">

          </div>
        </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Erreur refus devis:', error);
    res.status(500).send(`<html><body><h1>❌ Erreur technique</h1></body></html>`);
  }
};
