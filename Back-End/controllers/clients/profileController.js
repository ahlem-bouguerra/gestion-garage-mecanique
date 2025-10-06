import { Client } from "../../models/Client.js";

export const getClientProfile = async (req, res) => {
  try {
    console.log('👤 GetProfile appelé pour:', req.client.email);

    // Récupérer l'utilisateur avec populate pour governorate et city
    const client = await Client.findById(req.client._id)

    if (!client) {
      console.log('❌ Utilisateur non trouvé pour ID:', req.client._id);
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const clientProfile = {
      _id: client._id,
      username: client.username || "",
      email: client.email || "",
      phone: client.phone || "",
      isVerified: client.isVerified,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt
    };
    console.log('📤 Profil retourné:', {
      email: clientProfile.email,
      Username: clientProfile.username,
      Phone: clientProfile.phone,
    });

    res.json(clientProfile);

  } catch (error) {
    console.error('❌ Erreur getProfile:', error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};