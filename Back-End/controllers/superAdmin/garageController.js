import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Garagiste } from "../../models/Garagiste.js";
import { Garage } from "../../models/Garage.js";
import { sendVerificationEmail } from "../../utils/mailer.js";
import { GaragisteRole } from "../../models/GaragisteRole.js";
import { Role } from "../../models/Role.js";

// ========== CRÉER UNIQUEMENT LE GARAGE (Étape 1) ==========
export const createGarage = async (req, res) => {
  const {
    garagenom,
    matriculefiscal,
    governorateId,
    governorateName,
    cityId,
    cityName,
    streetAddress,
    location,
    description,
    horaires,
    services,
  } = req.body;

  console.log("📥 Création du garage:", req.body);

  // Validation des champs obligatoires
  if (!garagenom || !matriculefiscal) {
    return res.status(400).json({ 
      message: "Le nom et le matricule fiscal sont obligatoires.",
      required: ["garagenom", "matriculefiscal"]
    });
  }

  try {
    // Vérifier si le matricule fiscal existe déjà
    const existingGarage = await Garage.findOne({ matriculeFiscal: matriculefiscal });
    if (existingGarage) {
      return res.status(400).json({ 
        message: "Ce matricule fiscal est déjà utilisé." 
      });
    }

    // Créer le garage SANS garagiste admin pour le moment
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
      horaires: horaires || "",
      services: services || [],
      garagisteAdmins: []  // Seulement les admins seront ici
    });

    console.log("✅ Garage créé:", newGarage._id);

    res.status(201).json({
      message: "Garage créé avec succès. Vous pouvez maintenant ajouter un garagiste.",
      garage: {
        id: newGarage._id,
        nom: newGarage.nom,
        matriculeFiscal: newGarage.matriculeFiscal,
        governorateName: newGarage.governorateName,
        cityName: newGarage.cityName
      }
    });

  } catch (err) {
    console.error("❌ Erreur création garage:", err.message);
    res.status(500).json({
      message: "Erreur serveur lors de la création.",
      error: err.message
    });
  }
};

// ========== CRÉER GARAGISTE ET L'ASSOCIER AU GARAGE (Étape 2) ==========
export const createGaragisteForGarage = async (req, res) => {
  const { garageId } = req.params;
  const {
    username,
    email,
    password,
    phone,
    roleId
  } = req.body;

  console.log("📥 Création garagiste pour garage:", garageId);

  // Validation
  if (!username || !email || !password || !phone) {
    return res.status(400).json({ 
      message: "Tous les champs du garagiste sont obligatoires.",
      required: ["username", "email", "password", "phone"]
    });
  }

  try {
    // Vérifier que le garage existe
    const garage = await Garage.findById(garageId);
    if (!garage) {
      return res.status(404).json({ message: "Garage non trouvé" });
    }

    // Vérifier si l'email existe déjà
    const existingGaragiste = await Garagiste.findOne({ email });
    if (existingGaragiste) {
      return res.status(400).json({ 
        message: "Cet email est déjà utilisé." 
      });
    }

    // Vérifier le rôle
    let selectedRole;
    if (roleId) {
      selectedRole = await Role.findById(roleId);
      if (!selectedRole) {
        return res.status(400).json({ 
          message: "Le rôle sélectionné n'existe pas." 
        });
      }
    } else {
      // Par défaut : Admin Garage
      selectedRole = await Role.findOne({ name: "Admin Garage" });
      if (!selectedRole) {
        return res.status(500).json({ 
          message: "Le rôle 'Admin Garage' n'existe pas en base" 
        });
      }
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer le garagiste
    const newGaragiste = await Garagiste.create({
      username,
      email,
      password: hashedPassword,
      phone,
      isVerified: false,
      garage: garage._id,
      createdBy: req.user?.userId || null
    });

    console.log("✅ Garagiste créé:", newGaragiste._id);

    // **CORRECTION: Ajouter à garagisteAdmins SEULEMENT si c'est un admin**
    const isAdminRole = selectedRole.name === "Admin Garage" || 
                        selectedRole.name === "Admin" || 
                        selectedRole.name.toLowerCase().includes("admin");

    if (isAdminRole) {
      if (!garage.garagisteAdmins) {
        garage.garagisteAdmins = [];
      }
      garage.garagisteAdmins.push(newGaragiste._id);
      await garage.save();
      console.log("✅ Admin ajouté au garage:", garage._id);
    } else {
      console.log("ℹ️ Employé créé (non ajouté à garagisteAdmins)");
    }

    // Créer l'association GaragisteRole
    await GaragisteRole.create({
      garagisteId: newGaragiste._id,
      roleId: selectedRole._id
    });

    console.log(`✅ Rôle '${selectedRole.name}' assigné`);

    // Envoyer l'email de vérification
    const verificationToken = jwt.sign(
      { 
        userId: newGaragiste._id, 
        purpose: 'email_verification' 
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    await sendVerificationEmail(email, verificationToken);
    console.log("📧 Email de vérification envoyé");

    res.status(201).json({
      message: `${isAdminRole ? 'Admin' : 'Employé'} créé et associé au garage avec succès. Email de vérification envoyé.`,
      garagiste: {
        id: newGaragiste._id,
        username: newGaragiste.username,
        email: newGaragiste.email,
        phone: newGaragiste.phone,
        role: selectedRole.name,
        isAdmin: isAdminRole
      },
      garage: {
        id: garage._id,
        nom: garage.nom
      }
    });

  } catch (err) {
    console.error("❌ Erreur création garagiste:", err.message);
    res.status(500).json({
      message: "Erreur serveur lors de la création.",
      error: err.message
    });
  }
};


// ========== OBTENIR TOUS LES GARAGES ==========
export const getAllGarages = async (req, res) => {
  try {
    const garages = await Garage.find()
      .populate('garagisteAdmins', 'username email phone isVerified') // ✅ Pluriel + ajouter isVerified
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

// ========== OBTENIR UN GARAGE PAR ID ==========
export const getGarageById = async (req, res) => {
  try {
    const { id } = req.params;
    const garage = await Garage.findById(id);
    
    if (!garage) {
      return res.status(404).json({ message: "Garage non trouvé" });
    }

    // Tous les garagistes du garage
    const garagistes = await Garagiste.find({ garage: id });
    
    // Peupler chaque garagiste avec ses rôles
    const garagistesWithRoles = await Promise.all(
      garagistes.map(async (g) => {
        const roleRelations = await GaragisteRole.find({ garagisteId: g._id })
          .populate('roleId', 'name');
        
        return {
          _id: g._id,
          username: g.username,
          email: g.email,
          phone: g.phone,
          isVerified: g.isVerified,
          createdAt: g.createdAt,
          roles: roleRelations.map(r => r.roleId)
        };
      })
    );

    // Retourner le garage avec les garagistes intégrés
    res.json({
      ...garage.toObject(),
      garagistes: garagistesWithRoles,
      employeesCount: garagistesWithRoles.length
    });
    
  } catch (error) {
    console.error("❌ getGarageById error:", error.message, error.stack);
    res.status(500).json({ 
      message: "Erreur serveur",
      error: error.message 
    });
  }
};

// ========== METTRE À JOUR UN GARAGE ==========
export const updateGarage = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

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

// ========== DÉSACTIVER/ACTIVER UN GARAGE ==========
export const toggleGarageStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const garage = await Garage.findById(id);
    if (!garage) {
      return res.status(404).json({ message: "Garage non trouvé" });
    }

    garage.isActive = !garage.isActive;
    await garage.save();

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

// ========== SUPPRIMER UN GARAGE ==========
export const deleteGarage = async (req, res) => {
  try {
    const { id } = req.params;

    const garage = await Garage.findById(id);
    if (!garage) {
      return res.status(404).json({ message: "Garage non trouvé" });
    }

    const garagistesCount = await Garagiste.countDocuments({ garage: id });
    
    if (garagistesCount > 1) {
      return res.status(400).json({ 
        message: "Impossible de supprimer ce garage. Il contient encore des employés." 
      });
    }

    if (garage.garagisteAdmin) {
      await GaragisteRole.deleteMany({ garagisteId: garage.garagisteAdmin });
      await Garagiste.deleteOne({ _id: garage.garagisteAdmin });
    }
    
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