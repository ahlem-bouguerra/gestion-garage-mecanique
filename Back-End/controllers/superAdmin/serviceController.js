// controllers/admin/serviceController.js
import Service from '../../models/Service.js';
import { Users } from '../../models/Users.js';  // ✅ Avec accolades

// ✅ SUPER ADMIN : Créer un service global
export const createGlobalService = async (req, res) => {
  try {
    const { name, description, statut } = req.body;
    

    if (!name || !description) {
      return res.status(400).json({ 
        error: 'Les champs nom et description sont obligatoires'
      });
    }

    // Vérifier doublon
    const serviceExistant = await Service.findOne({ name });
    if (serviceExistant) {
      return res.status(409).json({ 
        error: 'Ce service existe déjà' 
      });
    }

    const service = new Service({ 
      name, 
      description, 
      statut: statut || 'Actif',
      createdBy: req.user._id
    });
    
    await service.save();
    console.log("✅ Service créé:", service);
    res.status(201).json(service);
    
  } catch (error) {
    console.error("❌ Erreur createGlobalService:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ SUPER ADMIN : Récupérer tous les services
export const getAllGlobalServices = async (req, res) => {
  try {
    const services = await Service.find()
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });
    
    console.log(`✅ ${services.length} services récupérés`);
    res.json(services);
  } catch (error) {
    console.error("❌ Erreur getAllGlobalServices:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ SUPER ADMIN : Modifier un service
export const updateGlobalService = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const service = await Service.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.status(404).json({ error: 'Service non trouvé' });
    }

    console.log("✅ Service modifié:", service);
    res.json(service);
  } catch (error) {
    console.error("❌ Erreur updateGlobalService:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ SUPER ADMIN : Supprimer un service
export const deleteGlobalService = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findByIdAndDelete(id);

    if (!service) {
      return res.status(404).json({ error: 'Service non trouvé' });
    }

    console.log("🗑️ Service supprimé:", service);
    res.json({ message: "Service supprimé avec succès" });
  } catch (error) {
    console.error("❌ Erreur deleteGlobalService:", error);
    res.status(500).json({ error: error.message });
  }
};