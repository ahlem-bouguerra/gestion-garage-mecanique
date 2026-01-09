import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Garagiste } from '../../models/Garagiste.js';
import { Garage } from '../../models/Garage.js';

export const login = async (req, res) => {
  const { email, password } = req.body;
  
  console.log("🔐 Tentative de connexion - Email:", email);
  console.log("🔐 Password reçu:", password ? "***" : "VIDE");
  
  try {
    // ✅ 1. Trouver le garagiste et peupler les infos du garage
    const garagiste = await Garagiste.findOne({ email })
      .populate('garage', 'nom matriculeFiscal governorateName cityName streetAddress location  horaires services isActive');
    
    if (!garagiste) {
      console.log("❌ Garagiste non trouvé pour:", email);
      return res.status(401).json({ message: "Utilisateur non trouvé" });
    }
    
    console.log("✅ Garagiste trouvé:", garagiste.email);
    console.log("   isVerified:", garagiste.isVerified);
    console.log("   isActive:", garagiste.isActive);
    
    // ✅ 2. Vérifier si le compte est vérifié
    if (!garagiste.isVerified) {
      return res.status(403).json({ 
        message: "Compte non vérifié. Vérifiez votre email." 
      });
    }

     if (!garagiste.isActive) {
      return res.status(403).json({ 
        message: "Compte non Active. Contacter votre admin." 
      });
    }
    
    // ✅ 3. Vérifier le mot de passe
    if (!password) {
      console.log("❌ Mot de passe manquant");
      return res.status(401).json({ message: "Mot de passe requis" });
    }
    
    const passwordMatch = await bcrypt.compare(password, garagiste.password);
    if (!passwordMatch) {
      console.log("❌ Mot de passe incorrect pour:", email);
      console.log("   Longueur password reçu:", password?.length);
      console.log("   Premiers caractères:", password?.substring(0, 3));
      // Ne pas exposer le hash complet pour sécurité
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }
    
    console.log("✅ Mot de passe correct");

    // ✅ 4. Vérifier si le garage est actif
    if (garagiste.garage && !garagiste.garage.isActive) {
      return res.status(403).json({ 
        message: "Votre garage est actuellement désactivé. Contactez l'administrateur." 
      });
    }



    // ✅ 6. Créer le token JWT
    const token = jwt.sign(
      { 
        userId: garagiste._id,
        email: garagiste.email,
        garageId: garagiste.garage?._id || null,
        garagenom: garagiste.garage?.nom || null,
        matriculefiscal: garagiste.garage?.matriculeFiscal || null
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    console.log(`✅ Utilisateur connecté : ${garagiste.email} `);
    
    // ✅ 7. Renvoyer la réponse avec token et infos utilisateur
    res.json({ 
      message: "Connexion réussie", 
      token,
    
      user: {
        id: garagiste._id,
        username: garagiste.username,
        email: garagiste.email,
        phone: garagiste.phone,
        img: garagiste.img || "/images/user/user-03.png",
        
        // Infos du garage
        garage: garagiste.garage ? {
          id: garagiste.garage._id,
          nom: garagiste.garage.nom,
          matriculeFiscal: garagiste.garage.matriculeFiscal,
          governorateName: garagiste.garage.governorateName,
          cityName: garagiste.garage.cityName,
          streetAddress: garagiste.garage.streetAddress,
          location: garagiste.garage.location,
          horaires: garagiste.garage.horaires,
          services: garagiste.garage.services,
          isActive: garagiste.garage.isActive
        } : null
      }
    });
  } catch (error) {
    console.error('❌ Erreur login:', error);
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

    // ✅ Vérification du token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("✅ Token valide pour utilisateur:", decoded.userId);
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: "Token invalide",
      });
    }

    // ✅ Réponse au client
    res.status(200).json({
      success: true,
      message: "Déconnexion réussie. Supprimez le token côté client.",
    });

  } catch (error) {
    console.error("❌ Erreur dans logout:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la déconnexion",
      error: error.message,
    });
  }
};