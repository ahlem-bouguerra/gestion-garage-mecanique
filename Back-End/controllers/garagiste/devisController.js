import Devis from "../../models/Devis.js";
import OrdreTravail from '../../models/Ordre.js'; 
import FicheClient from "../../models/FicheClient.js";


export const createDevis = async (req, res) => {
  try {
    console.log('📥 Données reçues:', req.body);
    console.log('👤 Utilisateur:', req.user);

    const { clientId,vehicleInfo, vehiculeId, inspectionDate, services, montantTVA, montantRemise, tvaRate, remiseRate, maindoeuvre, estimatedTime, garageId } = req.body;

    // ⭐ Détermine le garageId selon le rôle
    let finalGarageId;
    
    if (req.user.isSuperAdmin) {
      // SuperAdmin : doit fournir le garageId dans le body
      if (!garageId) {
        return res.status(400).json({
          success: false,
          message: 'SuperAdmin doit spécifier un garageId'
        });
      }
      finalGarageId = garageId;
      console.log('👑 SuperAdmin crée un devis pour le garage:', finalGarageId);
    } else {
      // Garagiste : utilise son propre garageId
      if (!req.user.garage) {
        return res.status(400).json({
          success: false,
          message: 'Garagiste non associé à un garage'
        });
      }
      finalGarageId = req.user.garage;
      console.log('🔧 Garagiste crée un devis pour son garage:', finalGarageId);
    }

    // ✅ CALCUL CORRECT DES TOTAUX
    let totalServicesHT = 0;
    const processedServices = services.map(service => {
      const serviceTotal = service.quantity * service.unitPrice;
      totalServicesHT += serviceTotal;
      return { ...service, total: serviceTotal };
    });

    const totalHT = totalServicesHT + (maindoeuvre || 0);
    const totalTTC = totalHT + montantTVA;
    const finalTotalTTC = totalTTC - montantRemise;

    console.log('🔢 Calculs:');
    console.log('- Total services HT:', totalServicesHT);
    console.log('- Main d\'œuvre:', maindoeuvre || 0);
    console.log('- Total HT:', totalHT);
    console.log('- Taux TVA:', tvaRate || 20, '%');
    console.log('- Total TTC:', totalTTC);
    console.log('- Taux Remise:', remiseRate || 0, '%');
    console.log('- Total TTC après remise:', finalTotalTTC);

    const devisId = await Devis.generateDevisId();
    console.log('✅ ID généré:', devisId);

    const newDevis = new Devis({
      id: devisId,
      clientId,
      garageId: finalGarageId,
      vehicleInfo,
      vehiculeId,
      inspectionDate,
      services: processedServices,
      totalServicesHT: totalServicesHT,
      totalHT: totalHT, 
      totalTTC,
      finalTotalTTC,
      remiseRate: remiseRate || 0,
      montantTVA: montantTVA || 0,
      montantRemise: montantRemise || 0,
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
    filters.garageId = req.user.garage;

    if (status && status !== 'tous') filters.status = status.toLowerCase();

    // 🔍 Si recherche par nom de client
    if (clientName) {
      const clientsAvecCompte = await FicheClient.find({
        garageId: req.user.garage
      })
      .populate({
        path: 'clientId',
        match: { username: { $regex: clientName, $options: 'i' } }
      });
      
      const idsClientsAvecCompte = clientsAvecCompte
        .filter(c => c.clientId)
        .map(c => c._id);
      
      const clientsSansCompte = await FicheClient.find({
        garageId: req.user.garage,
        nom: { $regex: clientName, $options: 'i' }
      }).select('_id');
      
      const idsClientsSansCompte = clientsSansCompte.map(c => c._id);
      const allClientIds = [...idsClientsAvecCompte, ...idsClientsSansCompte];
      
      if (allClientIds.length > 0) {
        filters.clientId = { $in: allClientIds };
      } else {
        return res.json({ success: true, data: [] });
      }
    }

    if (dateDebut || dateFin) {
      filters.inspectionDate = {};
      if (dateDebut) filters.inspectionDate.$gte = dateDebut;
      if (dateFin) filters.inspectionDate.$lte = dateFin;
    }

    console.log('🔍 Filtres appliqués:', JSON.stringify(filters, null, 2));
    
    const devis = await Devis.find(filters)
      .populate({
        path: 'clientId',
        select: 'nom type clientId',
        populate: {
          path: 'clientId',
          select: 'username email phone'
        }
      })
      .sort({ createdAt: -1 })
      .lean(); // ✅ Ajouter .lean()
      
    console.log('📊 Nombre de résultats:', devis.length);

    // ✅ Enrichir chaque devis avec clientName
    const devisEnrichis = devis.map(d => {
      let clientName = 'Client inconnu';
      
      if (d.clientId) {
        if (d.clientId.clientId?.username) {
          clientName = d.clientId.clientId.username;
        } else {
          clientName = d.clientId.nom;
        }
      }
      
      return {
        ...d,
        clientName
      };
    });

    res.json({
      success: true,
      data: devisEnrichis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des devis',
      error: error.message
    });
  }
};


export const getDevisById = async (req, res) => {
  try {
    const { id } = req.params;
    
    let devis;
    
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      devis = await Devis.findById(id)
        .populate({
          path: 'clientId',
          select: 'nom type clientId',
          populate: {
            path: 'clientId',
            select: 'username email phone'
          }
        })
        .lean(); // ✅ Ajouter .lean()
    } else {
      devis = await Devis.findOne({ id: id })
        .populate({
          path: 'clientId',
          select: 'nom type clientId',
          populate: {
            path: 'clientId',
            select: 'username email phone'
          }
        })
        .lean(); // ✅ Ajouter .lean()
    }
    
    if (!devis) {
      return res.status(404).json({ error: 'Devis non trouvé' });
    }

    // ✅ Enrichir avec clientName
    let clientName = 'Client inconnu';
    if (devis.clientId) {
      if (devis.clientId.clientId?.username) {
        clientName = devis.clientId.clientId.username;
      } else {
        clientName = devis.clientId.nom;
      }
    }
    
    res.json({
      ...devis,
      clientName
    });
  } catch (error) {
    console.error("❌ Erreur getDevisById:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getAllDevisByGarage = async (req, res) => {
  try {
    const { garageId } = req.params;

    const devis = await Devis.find({ garageId })
      .populate({
        path: 'clientId',
        select: 'nom type clientId',
        populate: {
          path: 'clientId',
          select: 'username email phone'
        }
      })
      .sort({ createdAt: -1 })
      .lean(); // ✅ Ajouter .lean() pour pouvoir modifier les objets

    if (!devis || devis.length === 0) {
      return res.status(200).json([]);
    }

    // ✅ Enrichir chaque devis avec clientName
    const devisEnrichis = devis.map(d => {
      let clientName = 'Client inconnu';
      
      // Si clientId (FicheClient) existe et est populé
      if (d.clientId) {
        // Si clientId.clientId (Client) existe, utiliser username
        if (d.clientId.clientId?.username) {
          clientName = d.clientId.clientId.username;
        } else {
          // Sinon utiliser nom de FicheClient
          clientName = d.clientId.nom;
        }
      }
      
      return {
        ...d,
        clientName  // ✅ Ajouter le nom effectif
      };
    });

    return res.json(devisEnrichis);

  } catch (error) {
    console.error("❌ Erreur getAllDevisByGarage:", error);
    res.status(500).json({ error: error.message });
  }
};


export const getDevisByNum = async (req, res) => {
  try {
    const { id } = req.params; // ex: "DEV017"

    // 🔎 Recherche du devis via le champ "id" (pas _id)
    const devis = await Devis.findOne({ id: id, garageId: req.user.garage })  
    .populate({
      path: 'clientId',
      select: 'nom type clientId',
      populate: {
        path: 'clientId',
        select: 'username email phone'
      }
    });

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
      { id, garageId: req.user.garage }, 
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
    const { 
      clientId, 
      vehicleInfo, 
      inspectionDate, 
      services, 
      tvaRate,
      remiseRate,
      montantTVA,
      montantRemise, 
      maindoeuvre,
      estimatedTime,
      garageId
    } = req.body;

    console.log('🔄 Mise à jour devis ID:', id);

    const targetGarageId = garageId || req.user?.garage;

    if (!targetGarageId) {
      return res.status(400).json({
        success: false,
        message: 'garageId manquant'
      });
    }

    console.log('🏢 Garage cible:', targetGarageId);

    // ✅ Déterminer le critère de recherche
    const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);
    const searchCriteria = {
      ...(isMongoId ? { _id: id } : { id: id }),
      garageId: targetGarageId
    };

    console.log('🔍 Critères de recherche:', searchCriteria);

    // Vérifier l'existence
    const existingDevis = await Devis.findOne(searchCriteria)
    .populate({
  path: 'clientId',
  select: 'nom type clientId',
  populate: {
    path: 'clientId',
    select: 'username email phone'
  }
});

    if (!existingDevis) {
      console.log('❌ Devis non trouvé');
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé'
      });
    }

    console.log('✅ Devis trouvé:', existingDevis.id);

    // Recalculer les totaux
    let totalServicesHT = 0;
    const processedServices = services.map(service => {
      const serviceTotal = service.quantity * service.unitPrice;
      totalServicesHT += serviceTotal;
      return { ...service, total: serviceTotal };
    });

    const totalHT = totalServicesHT + (maindoeuvre || 0);
    const totalTTC = totalHT + montantTVA;
    const finalTotalTTC = totalTTC - montantRemise;

    console.log('🔢 Calculs:', { totalHT, totalTTC, finalTotalTTC });

    // Mettre à jour
    const updatedDevis = await Devis.findOneAndUpdate(
      searchCriteria,
      {
        clientId,
        vehicleInfo,
        inspectionDate,
        services: processedServices,
        totalServicesHT,
        totalHT,
        totalTTC,
        finalTotalTTC,
        remiseRate: remiseRate || 0,
        tvaRate: tvaRate || 19,
        montantRemise: montantRemise || 0,
        montantTVA: montantTVA || 0,
        maindoeuvre: maindoeuvre || 0,
        status: 'brouillon',
        estimatedTime,
      },
      {
        new: true,
        runValidators: true
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

export const updateFactureId = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log('🔄 Mise à jour devis:', id);
    console.log('📥 Nouvelles données:', updateData);

    const existingDevis = await Devis.findById(id).where({ garageId: req.user.garage })
    .populate({
  path: 'clientId',
  select: 'nom type clientId',
  populate: {
    path: 'clientId',
    select: 'username email phone'
  }
})
    if (!existingDevis) {
      return res.status(404).json({ success: false, message: 'Devis non trouvé' });
    }

    // ⚡ Recalcul seulement si services sont envoyés
    if (updateData.services) {
      let totalServicesHT = 0;
      updateData.services = updateData.services.map(service => {
        const serviceTotal = service.quantity * service.unitPrice;
        totalServicesHT += serviceTotal;
        return { ...service, total: serviceTotal };
      });

      const totalHT = totalServicesHT + (updateData.maindoeuvre || 0);
      const totalTTC = totalHT + montantTVA;
      const finalTotalTTC = totalTTC - montantRemise;

      updateData.totalServicesHT = totalServicesHT;
      updateData.totalHT = totalHT;
      updateData.totalTTC = totalTTC;
      updateData.finalTotalTTC = finalTotalTTC;
      updateData.status = 'brouillon';
    }

    const updatedDevis = await Devis.findOneAndUpdate(
      { _id: id, garageId: req.user.garage }, 
      updateData, 
      { new: true, runValidators: true }
    );

    res.json({ success: true, message: 'Devis mis à jour avec succès', data: updatedDevis });
  } catch (error) {
    console.error('❌ Erreur mise à jour devis:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du devis', error: error.message });
  }
};


export const deleteDevis = async (req, res) => {
  try {
    const { id } = req.params;

    const devis = await Devis.findOne({ id, garageId: req.user.garage}).populate({
  path: 'clientId',
  select: 'nom type clientId',
  populate: {
    path: 'clientId',
    select: 'username email phone'
  }
});
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

    await Devis.findOneAndDelete({ id, garageId: req.user.garage });

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
    )
    .populate({
  path: 'clientId',
  select: 'nom type clientId',
  populate: {
    path: 'clientId',
    select: 'username email phone'
  }
});
    
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
    )
    .populate({
  path: 'clientId',
  select: 'nom type clientId',
  populate: {
    path: 'clientId',
    select: 'username email phone'
  }
});
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


export const deleteDevisForSuperAdmin = async (req,res) =>{

  try {
    const { id } = req.params;

    const devis = await Devis.findById(id)
    .populate({
  path: 'clientId',
  select: 'nom type clientId',
  populate: {
    path: 'clientId',
    select: 'username email phone'
  }
});

    if (!devis) {
      return res.status(404).json({ error: 'Devis non trouvé' });
    }

    await Devis.findByIdAndDelete(id);
    res.json({ message: 'Devis supprimé avec succès' });

  } catch (error) {
    console.error('❌ Erreur deleteDevisById:', error);
    res.status(500).json({ error: error.message });
  }
};

