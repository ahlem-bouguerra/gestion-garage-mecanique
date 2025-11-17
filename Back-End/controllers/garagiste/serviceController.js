import Service from '../../models/Service.js';


export const getAllServices = async (req, res) => {
  try {
    const services = await Service.find({garageId: req.user.garageId});
    console.log("✅ services récupérées:", services.length);
    res.json(services);
  } catch (error) {
    console.error("❌ Erreur getAllservices:", error);
    res.status(500).json({ error: error.message });
  }
};


export const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findOne({_id:id , garageId: req.user.garageId});

    if (!service) {
      return res.status(404).json({ error: 'service non trouvée' });
    }

    res.json(service);
  } catch (error) {
    console.error("❌ Erreur getserviceById:", error);
    res.status(500).json({ error: error.message });
  }
};


export const createService = async (req, res) => {
  try {
    const {name, description, statut} = req.body;
    
    if (!name || !description) {
      return res.status(400).json({ 
        error: 'Les champs nom et description sont obligatoires'
      });
    }

    // Vérifier si le service existe déjà pour ce garagiste
    const serviceExistant = await Service.findOne({ 
      name, 
      garageId: req.user.garageId 
    });
    
    if (serviceExistant) {
      return res.status(409).json({ 
        error: 'Vous avez déjà ce service dans votre liste' 
      });
    }

    const service = new Service({ 
      name, 
      description, 
      statut, 
      garageId: req.user.garageId 
    });
    
    await service.save();
    console.log("✅ service créé:", service);
    res.status(201).json(service);
    
  } catch (error) {
    console.error("❌ Erreur createService:", error);
    
    // Gestion des erreurs d'enum
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Service non valide. Veuillez choisir un service dans la liste.' 
      });
    }
    
    res.status(500).json({ error: error.message });
  }
};


export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const serviceModifie = await Service.findOneAndUpdate(
      { _id: id, garageId: req.user.garageId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!serviceModifie) {
      return res.status(404).json({ error: 'service non trouvée' });
    }

    console.log("✅ service modifiée:", serviceModifie);
    res.json(serviceModifie);

  } catch (error) {
    console.error("❌ Erreur updateservice:", error);
    res.status(500).json({ error: error.message });
  }
};


export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const serviceSupprimee = await Service.findOneAndDelete({_id: id, garageId: req.user.garageId});

    if (!serviceSupprimee) {
      return res.status(404).json({ error: 'service non trouvée' });
    }

    console.log("🗑️ service supprimée:", serviceSupprimee);
    res.json({ message: "service supprimée avec succès" });

  } catch (error) {
    console.error("❌ Erreur deleteservice:", error);
    res.status(500).json({ error: error.message });
  }
};
