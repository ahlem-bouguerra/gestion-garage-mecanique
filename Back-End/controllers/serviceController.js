import Service from '../models/Service.js';


export const getAllServices = async (req, res) => {
  try {
    const services = await Service.find({});
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
    const service = await Service.findById(id);

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
    const {name,description,statut} = req.body;

    console.log("📝 Création Service - Données reçues:", req.body);

    if (!name || !description ) {
      return res.status(400).json({ 
        error: 'Les champs nom est obligatoire' 
      });
    }

    const service = new Service({ name ,description,statut});
    await service.save();

    console.log("✅ service créée:", service);
    res.status(201).json(service);

  } catch (error) {
    console.error("❌ Erreur createservice:", error);
    res.status(500).json({ error: error.message });
  }
};


export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const serviceModifie = await Service.findByIdAndUpdate(
      id,
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

    const serviceSupprimee = await Service.findByIdAndDelete(id);

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
