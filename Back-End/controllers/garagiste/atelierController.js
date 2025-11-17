import Atelier from '../../models/Atelier.js';


export const getAllAteliers = async (req, res) => {
  try {
    const ateliers = await Atelier.find({garageId: req.user.garageId});
    console.log("✅ aleliers récupérées:", ateliers.length);
    res.json(ateliers);
  } catch (error) {
    console.error("❌ Erreur getAllAteliers:", error);
    res.status(500).json({ error: error.message });
  }
};


export const getAtelierById = async (req, res) => {
  try {
    const { id } = req.params;
    const atelier = await Atelier.findOne({_id:id , garageId: req.user.garageId});

    if (!atelier) {
      return res.status(404).json({ error: 'atelier non trouvée' });
    }

    res.json(atelier);
  } catch (error) {
    console.error("❌ Erreur getAtelierById:", error);
    res.status(500).json({ error: error.message });
  }
};


export const createAtelier = async (req, res) => {
  try {
    const { name ,localisation } = req.body;

    console.log("📝 Création Atelier - Données reçues:", req.body);

    if (!name) {
      return res.status(400).json({ 
        error: 'Les champs nom est obligatoire' 
      });
    }

    const atelier = new Atelier({ name ,localisation ,garageId: req.user.garageId });
    await atelier.save();

    console.log("✅ Atelier créée:", atelier);
    res.status(201).json(atelier);

  } catch (error) {
    console.error("❌ Erreur createAtelier:", error);
    res.status(500).json({ error: error.message });
  }
};


export const updateAtelier = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const atelierModifie = await Atelier.findOneAndUpdate(
      { _id: id, garageId: req.user.garageId},
      updateData,
      { new: true, runValidators: true }
    );

    if (!atelierModifie) {
      return res.status(404).json({ error: 'atelier non trouvée' });
    }

    console.log("✅ atelier modifiée:", atelierModifie);
    res.json(atelierModifie);

  } catch (error) {
    console.error("❌ Erreur updateAtelier:", error);
    res.status(500).json({ error: error.message });
  }
};


export const deleteAtelier = async (req, res) => {
  try {
    const { id } = req.params;

    const atelierSupprimee = await Atelier.findOneAndDelete({_id: id, garageId: req.user.garageId });

    if (!atelierSupprimee) {
      return res.status(404).json({ error: 'atelier non trouvée' });
    }

    console.log("🗑️ atelier supprimée:", atelierSupprimee);
    res.json({ message: "Pièce supprimée avec succès" });

  } catch (error) {
    console.error("❌ Erreur deleteAtelier:", error);
    res.status(500).json({ error: error.message });
  }
};
