import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Non autorisé, token manquant" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Payload décodé :", decoded);

    // Remplace 'id' si nécessaire par la clé correcte
    const userId = decoded.userId;
//exclut le champ password pour des raisons de sécurité.
    const user = await User.findById(userId).select("-password");
    //Si le token est valide mais que l’utilisateur n’existe pas (supprimé par ex.) → accès refusé.
    if (!user) {
      return res.status(401).json({ message: "Utilisateur non trouvé" });
    }
//Stocke l’objet user dans req.user pour que les routes suivantes y aient accès (profil, etc.).
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token invalide" });
  }
};
