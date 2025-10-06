import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Client } from '../../models/Client.js';



export const loginClient = async (req, res) => {
  const { email, password } = req.body;

  try {
    const client = await Client.findOne({ email });
    if (!client) return res.status(401).json({ message: "Utilisateur non trouvé" });

    if (!client.isVerified) {
      return res.status(403).json({ message: "Compte non vérifié. Vérifiez votre email." });
    }

    const passwordMatch = await bcrypt.compare(password, client.password);
    if (!passwordMatch) return res.status(401).json({ message: "Mot de passe incorrect" });

    // Générer token JWT ou session ici
    const token = jwt.sign({ clientId: client._id ,email: client.email ,phone: client.phone ,username: client.username}, process.env.JWT_SECRET, { expiresIn: '1d' });


    console.log(`Utilisateur connecté : ${client.email} (token: ${token})`);

    res.json({ 
      message: "Connexion réussie", 
      token,
      user: {
        username: client.username,
        email: client.email,
        phone: client.phone,
        img: client.img || "/images/user/user-03.png"
      }
    });

  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Header Authorization manquant",
      });
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token manquant",
      });
    }

    // Vérification du token (optionnelle ici)
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("✅ Token valide pour utilisateur:", decoded.clientId);
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: "Token invalide",
      });
    }

    // Réponse au client → il doit supprimer le token côté frontend
    res.status(200).json({
      success: true,
      message: "Déconnexion réussie. Supprimez le token côté client.",
    });

  } catch (error) {
    console.error("💥 Erreur dans logout:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la déconnexion",
      error: error.message,
    });
  }
};
