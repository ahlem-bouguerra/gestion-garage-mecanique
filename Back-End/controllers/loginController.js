import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Utilisateur non trouvé" });

    if (!user.isVerified) {
      return res.status(403).json({ message: "Compte non vérifié. Vérifiez votre email." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ message: "Mot de passe incorrect" });

    // Générer token JWT ou session ici
    const token = jwt.sign({ userId: user._id ,email: user.email ,phone: user.phone ,username: user.username}, process.env.JWT_SECRET, { expiresIn: '1d' });


    console.log(`Utilisateur connecté : ${user.email} (token: ${token})`);

    res.json({ message: "Connexion réussie", token });

  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};
