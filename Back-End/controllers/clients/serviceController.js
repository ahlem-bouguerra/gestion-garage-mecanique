import GarageService from '../../models/GarageService.js';


// ✅ CLIENT : Voir les services d'un garage spécifique
export const getGarageServicesForClient = async (req, res) => {
  try {
    const { garageId } = req.params; // Récupérer depuis l'URL
    
    if (!garageId) {
      return res.status(400).json({ error: 'Garage ID requis' });
    }

    const garageServices = await GarageService.find({ garageId })
      .populate('serviceId')
      .sort({ addedAt: -1 });
    
    // Extraire uniquement les services actifs
    const services = garageServices
      .map(gs => gs.serviceId)
      .filter(service => service && service.statut === 'Actif');
    
    console.log(`✅ ${services.length} services pour le garage ${garageId}`);
    res.json({ success: true, services });
    
  } catch (error) {
    console.error("❌ Erreur getGarageServicesForClient:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};