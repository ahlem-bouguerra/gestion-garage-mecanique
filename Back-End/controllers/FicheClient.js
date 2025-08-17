import FicheClient from "../models/FicheClient.js";

export const createFicheClient = async (req, res) => {
  try {
    const fiche = new FicheClient(req.body);
    await fiche.save();
    res.status(201).json(fiche);
  } catch (error) {
    // Gestion des erreurs d'unicité
    if (error.code === 11000) {
      return res.status(400).json({ error: "Téléphone ou email ou nom déjà utilisé" });
    }
    res.status(400).json({ error: error.message });
  }
};


export const getFicheClients = async (req, res) => {
  try {
    const fiches = await FicheClient.find();
    res.json(fiches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CORRECTION: Utiliser _id au lieu de id dans la recherche
export const getFicheClientById = async (req, res) => {
  try {
    console.log("🔍 Recherche client avec ID:", req.params._id);
    const fiche = await FicheClient.findById(req.params._id);
    if (!fiche) return res.status(404).json({ error: "client non trouvé" });
    console.log("📋 Client trouvé:", fiche.nom);
    res.json(fiche);
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getFicheClientNoms = async (req, res) => {
  try {
    // GARDER l'_id car le frontend en a besoin !
    const clients = await FicheClient.find({}, { nom: 1, type: 1, _id: 1 }); 
    // Retourne : [ { _id: "abc123", nom: "Ahlem", type: "particulier" }, ... ]
   
    res.json(clients);
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// CORRECTION: Utiliser _id au lieu de id dans la mise à jour
export const updateFicheClient = async (req, res) => {
  try {
    console.log("✏️ Mise à jour client avec ID:", req.params._id);
    console.log("📝 Données:", req.body);
    const fiche = await FicheClient.findByIdAndUpdate(
      req.params._id,
      req.body,
      { new: true }
    );
    if (!fiche) return res.status(404).json({ error: "Client non trouvé" });
    console.log("✅ Client mis à jour:", fiche.nom);
    res.json(fiche);
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    res.status(400).json({ error: error.message });
  }
};

// CORRECTION: Utiliser _id au lieu de id dans la suppression
export const deleteFicheClient = async (req, res) => {
  try {
    console.log("🗑️ Suppression client avec ID:", req.params._id);
    const fiche = await FicheClient.findByIdAndDelete(req.params._id);
    if (!fiche) return res.status(404).json({ error: "Client non trouvé" });
    console.log("✅ Client supprimé:", fiche.nom);
    res.json({ message: "Client supprimé avec succès" });
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    res.status(500).json({ error: error.message });
  }
};