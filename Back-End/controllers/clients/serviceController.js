import Service from '../../models/Service.js';

export const getServicesByGarageId = async (req, res) => {
  try {
    const { garageId } = req.params;
    
    console.log("🔍 Recherche services pour garage:", garageId);

    if (!garageId) {
      return res.status(400).json({ 
        success: false,
        error: 'ID du garage requis' 
      });
    }

    // Rechercher les services ACTIFS de ce garage
    const services = await Service.find({
      garagisteId: garageId,
      statut: "Actif" // Seulement les services actifs pour les clients
    });

    console.log(`✅ ${services.length} services trouvés pour le garage ${garageId}`);
    
    res.json({
      success: true,
      services: services,
      count: services.length
    });

  } catch (error) {
    console.error("❌ Erreur getServicesByGarageId:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};