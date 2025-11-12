import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Garagiste } from "../../models/Garagiste.js";
import { Garage } from "../../models/Garage.js";
import { sendVerificationEmail } from "../../utils/mailer.js";
import { GaragisteRole } from "../../models/GaragisteRole.js";
import { Role } from "../../models/Role.js";

// ========== CRÉER GARAGE + GARAGISTE (Super Admin) ==========
export const createGarageWithGaragiste = async (req, res) => {
  const {
    // Infos Garage
    garagenom,
    matriculefiscal,
    governorateId,
    governorateName,
    cityId,
    cityName,
    streetAddress,
    location,
    description,
    logo,
    horaires,
    services,
    
    // Infos Garagiste
    username,
    email,
    password,
    phone
  } = req.body;

  console.log("📥 Données reçues pour création Garage + Garagiste:", req.body);

  // ✅ Validation des champs obligatoires
  if (!garagenom || !matriculefiscal || !username || !email || !password || !phone) {
    console.warn("⚠️ Champs manquants !");
    return res.status(400).json({ 
      message: "Tous les champs obligatoires doivent être remplis.",
      required: ["garagenom", "matriculefiscal", "username", "email", "password", "phone"]
    });
  }

  try {
    // ✅ 1. Vérifier si l'email existe déjà
    const existingGaragiste = await Garagiste.findOne({ email });
    if (existingGaragiste) {
      console.warn("⚠️ Email déjà utilisé :", email);
      return res.status(400).json({ 
        message: "Cet email est déjà utilisé par un autre garagiste." 
      });
    }

    // ✅ 2. Vérifier si le matricule fiscal existe déjà
    const existingGarage = await Garage.findOne({ matriculeFiscal: matriculefiscal });
    if (existingGarage) {
      console.warn("⚠️ Matricule fiscal déjà utilisé :", matriculefiscal);
      return res.status(400).json({ 
        message: "Ce matricule fiscal est déjà utilisé." 
      });
    }

    // ✅ 3. Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ 4. Créer le GARAGISTE d'abord (temporairement sans garage)
    const newGaragiste = await Garagiste.create({
      username,
      email,
      password: hashedPassword,
      phone,
      isVerified: false,
      garage: null, // Sera mis à jour après création du garage
      createdBy: req.user?.userId || null // ID du super admin
    });

    console.log("✅ Garagiste créé:", {
      id: newGaragiste._id,
      email: newGaragiste.email,
      username: newGaragiste.username
    });

    // ✅ 5. Créer le GARAGE avec le garagiste comme admin
    const newGarage = await Garage.create({
      nom: garagenom,
      matriculeFiscal: matriculefiscal,
      governorateId: governorateId || null,
      governorateName: governorateName || "",
      cityId: cityId || null,
      cityName: cityName || "",
      streetAddress: streetAddress || "",
      location: location || undefined,
      description: description || "",
      logo: logo || "",
      horaires: horaires || "",
      services: services || [],
      garagisteAdmin: newGaragiste._id // Lien avec le garagiste
    });

    console.log("✅ Garage créé:", {
      id: newGarage._id,
      nom: newGarage.nom,
      matriculeFiscal: newGarage.matriculeFiscal,
      admin: newGaragiste._id
    });

    // ✅ 6. Associer le garage au garagiste
    newGaragiste.garage = newGarage._id;
    await newGaragiste.save();

    console.log("✅ Garage associé au garagiste");

    const adminRole = await Role.findOne({ name: "Admin Garage" });
    if (!adminRole) {
      throw new Error("Le rôle 'Admin Garage' n'existe pas en base");
    }
    await GaragisteRole.create({
      garagisteId: newGaragiste._id,
      roleId: adminRole._id
    });

    console.log("✅ Rôle 'Admin Garage' assigné au garagiste");

    // ✅ 7. Envoyer l'email de vérification
    const verificationToken = jwt.sign(
      { 
        userId: newGaragiste._id, 
        purpose: 'email_verification' 
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    await sendVerificationEmail(email, verificationToken);
    console.log("📧 Email de vérification envoyé à:", email);

    // ✅ 8. Réponse de succès
    res.status(201).json({
      message: "Garage et garagiste créés avec succès. Email de vérification envoyé.",
      garage: {
        id: newGarage._id,
        nom: newGarage.nom,
        matriculeFiscal: newGarage.matriculeFiscal,
        governorateName: newGarage.governorateName,
        cityName: newGarage.cityName
      },
      garagiste: {
        id: newGaragiste._id,
        username: newGaragiste.username,
        email: newGaragiste.email,
        phone: newGaragiste.phone,
    
      }
    });

  } catch (err) {
    console.error("❌ Erreur lors de la création Garage + Garagiste:", err.message);
    console.error("❌ Stack trace:", err.stack);
    
    res.status(500).json({
      message: "Erreur serveur lors de la création.",
      error: err.message
    });
  }
};

// ========== OBTENIR TOUS LES GARAGES (Super Admin) ==========
export const getAllGarages = async (req, res) => {
  try {
    const garages = await Garage.find()
      .populate('garagisteAdmin', 'username email phone')
      .sort({ createdAt: -1 });

    res.json({
      count: garages.length,
      garages
    });

  } catch (error) {
    console.error("❌ Erreur getAllGarages:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ========== OBTENIR UN GARAGE PAR ID (Super Admin) ==========
export const getGarageById = async (req, res) => {
  try {
    const { id } = req.params;

    const garage = await Garage.findById(id)
      .populate('garagisteAdmin', 'username email phone isVerified createdAt');

    if (!garage) {
      return res.status(404).json({ message: "Garage non trouvé" });
    }

    // Compter les employés du garage
    const employeesCount = await Garagiste.countDocuments({ 
      garage: id,
      _id: { $ne: garage.garagisteAdmin._id } // Exclure l'admin
    });

    res.json({
      garage,
      employeesCount
    });

  } catch (error) {
    console.error("❌ Erreur getGarageById:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ========== METTRE À JOUR UN GARAGE (Super Admin) ==========
export const updateGarage = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Ne pas permettre de modifier le garagisteAdmin ou le matriculeFiscal
    delete updateData.garagisteAdmin;
    delete updateData.matriculeFiscal;

    const garage = await Garage.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('garagisteAdmin', 'username email phone');

    if (!garage) {
      return res.status(404).json({ message: "Garage non trouvé" });
    }

    console.log("✅ Garage mis à jour:", garage._id);

    res.json({
      message: "Garage mis à jour avec succès",
      garage
    });

  } catch (error) {
    console.error("❌ Erreur updateGarage:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ========== DÉSACTIVER/ACTIVER UN GARAGE (Super Admin) ==========
export const toggleGarageStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const garage = await Garage.findById(id);
    if (!garage) {
      return res.status(404).json({ message: "Garage non trouvé" });
    }

    garage.isActive = !garage.isActive;
    await garage.save();

    // Désactiver/activer aussi tous les garagistes du garage
    await Garagiste.updateMany(
      { garage: id },
      { isActive: garage.isActive }
    );

    console.log(`✅ Garage ${garage.isActive ? 'activé' : 'désactivé'}:`, garage._id);

    res.json({
      message: `Garage ${garage.isActive ? 'activé' : 'désactivé'} avec succès`,
      garage
    });

  } catch (error) {
    console.error("❌ Erreur toggleGarageStatus:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ========== SUPPRIMER UN GARAGE (Super Admin) ==========
export const deleteGarage = async (req, res) => {
  try {
    const { id } = req.params;

    const garage = await Garage.findById(id);
    if (!garage) {
      return res.status(404).json({ message: "Garage non trouvé" });
    }

    // Vérifier s'il y a des données liées (clients, véhicules, etc.)
    const garagistesCount = await Garagiste.countDocuments({ garage: id });
    
    if (garagistesCount > 1) { // Plus que l'admin
      return res.status(400).json({ 
        message: "Impossible de supprimer ce garage. Il contient encore des employés." 
      });
    }

    // Supprimer le garagiste admin
    await Garagiste.deleteOne({ _id: garage.garagisteAdmin });
    
    // Supprimer le garage
    await Garage.deleteOne({ _id: id });

    console.log("✅ Garage supprimé:", id);

    res.json({
      message: "Garage et garagiste admin supprimés avec succès"
    });

  } catch (error) {
    console.error("❌ Erreur deleteGarage:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};