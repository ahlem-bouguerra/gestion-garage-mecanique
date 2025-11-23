// controllers/garagiste/garageServiceController.js
import GarageService from '../../models/GarageService.js';
import Service from '../../models/Service.js';

// ✅ GARAGISTE : Voir tous les services disponibles (créés par Super Admin)
export const getAvailableServices = async (req, res) => {
  try {
    const services = await Service.find({ 
      statut: 'Actif' 
    }).sort({ name: 1 });
    
    console.log(`✅ ${services.length} services disponibles`);
    res.json(services);
  } catch (error) {
    console.error("❌ Erreur getAvailableServices:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ GARAGISTE : Voir les services de SON garage
export const getMyGarageServices = async (req, res) => {
  try {
    const garageServices = await GarageService.find({ 
      garageId: req.user.garageId 
    })
    .populate('serviceId')
    .sort({ addedAt: -1 });
    
    console.log(`✅ ${garageServices.length} services dans le garage`);
    res.json(garageServices);
  } catch (error) {
    console.error("❌ Erreur getMyGarageServices:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ GARAGISTE : Ajouter un service à son garage
export const addServiceToGarage = async (req, res) => {
  try {
    const { serviceId } = req.body;
    
    if (!serviceId) {
      return res.status(400).json({ error: 'Service ID requis' });
    }

    // Vérifier que le service existe et est actif
    const service = await Service.findOne({ 
      _id: serviceId, 
      statut: 'Actif' 
    });
    
    if (!service) {
      return res.status(404).json({ 
        error: 'Service non trouvé ou désactivé' 
      });
    }

    // Vérifier si déjà ajouté
    const existant = await GarageService.findOne({
      garageId: req.user.garageId,
      serviceId
    });

    if (existant) {
      return res.status(409).json({ 
        error: 'Ce service est déjà dans votre garage' 
      });
    }

    // Créer la relation
    const garageService = new GarageService({
      garageId: req.user.garageId,
      serviceId
    });

    await garageService.save();
    await garageService.populate('serviceId');

    console.log("✅ Service ajouté au garage:", garageService);
    res.status(201).json(garageService);
  } catch (error) {
    console.error("❌ Erreur addServiceToGarage:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ GARAGISTE : Retirer un service de son garage
export const removeServiceFromGarage = async (req, res) => {
  try {
    const { id } = req.params;

    const garageService = await GarageService.findOneAndDelete({
      _id: id,
      garageId: req.user.garageId
    });

    if (!garageService) {
      return res.status(404).json({ error: 'Service non trouvé dans votre garage' });
    }

    console.log("🗑️ Service retiré du garage:", garageService);
    res.json({ message: 'Service retiré du garage avec succès' });
  } catch (error) {
    console.error("❌ Erreur removeServiceFromGarage:", error);
    res.status(500).json({ error: error.message });
  }
};

// Retourne uniquement les services du garage, format simple
export const getServicesForMechanics = async (req, res) => {
  try {
    const { garageId } = req.query; // ⭐ Récupérer garageId depuis query params
    
    // ⭐ Déterminer quel garageId utiliser
    let targetGarageId;
    
    if (req.user.isSuperAdmin && garageId) {
      // SuperAdmin avec garageId spécifique
      targetGarageId = garageId;
    } else if (!req.user.isSuperAdmin) {
      // Garagiste : utiliser son propre garage
      targetGarageId = req.user.garageId || req.user.garage;
    }
    
    console.log('🔍 Recherche services pour garage:', targetGarageId);
    
    // ⭐ Construire le filtre
    const filter = targetGarageId ? { garageId: targetGarageId } : {};
    
    const garageServices = await GarageService.find(filter).populate('serviceId');
    
    // Extraire uniquement les services
    const services = garageServices
      .map(gs => gs.serviceId)
      .filter(service => service !== null); // ⭐ Filtrer les services null/undefined
    
    console.log("✅ Services récupérés:", services.length);
    
    res.json({
      success: true,
      services
    });
    
  } catch (error) {
    console.error("❌ Erreur getServicesForMechanics:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};