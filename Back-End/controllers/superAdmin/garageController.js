import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Garagiste } from "../../models/Garagiste.js";
import { Garage } from "../../models/Garage.js";
import { sendVerificationEmail } from "../../utils/mailer.js";
import { GaragisteRole } from "../../models/GaragisteRole.js";
import { Role } from "../../models/Role.js";
import { RolePermission } from "../../models/RolePermission.js";
import { Permission } from "../../models/Permission.js";

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
    emailProfessionnel,
    telephoneProfessionnel
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
      emailProfessionnel: emailProfessionnel || "",
      telephoneProfessionnel: telephoneProfessionnel || "",
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

    delete updateData.garagisteAdmins;
    delete updateData.matriculeFiscal;

    const garage = await Garage.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('garagisteAdmins', 'username email phone');

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

// ========== SUPPRIMER UN GARAGE AVEC CES GARAGISTES ==========
export const deleteGarage = async (req, res) => {
  try {
    const { id } = req.params;

    const garage = await Garage.findById(id);
    if (!garage) {
      return res.status(404).json({ message: "Garage non trouvé" });
    }

    // ⭐ Récupérer TOUS les garagistes du garage
    const allGaragistes = await Garagiste.find({ garage: id });
    const garagisteIds = allGaragistes.map(g => g._id);

    if (garagisteIds.length > 0) {
      // Supprimer tous les rôles
      await GaragisteRole.deleteMany({ 
        garagisteId: { $in: garagisteIds } 
      });
      
      // Supprimer tous les garagistes
      await Garagiste.deleteMany({ 
        _id: { $in: garagisteIds } 
      });
      
      console.log(`✅ ${garagisteIds.length} garagiste(s) supprimé(s)`);
    }
    
    // Supprimer le garage
    await Garage.deleteOne({ _id: id });

    console.log("✅ Garage supprimé:", id);

    res.json({
      message: "Garage et tous ses garagistes supprimés avec succès",
      deletedGaragistes: garagisteIds.length
    });

  } catch (error) {
    console.error("❌ Erreur deleteGarage:", error);
    res.status(500).json({ 
      message: "Erreur serveur",
      error: error.message 
    });
  }
};


// ========== GET GARAGISTE BY ID AVEC RÔLE ET PERMISSIONS ==========
export const getGaragisteById = async (req, res) => {
  const { garagisteId } = req.params;

  console.log("📥 Récupération du garagiste:", garagisteId);

  try {
    // ✅ D'abord vérifier si garagisteId existe
    if (!garagisteId) {
      return res.status(400).json({ 
        message: "ID de garagiste manquant" 
      });
    }

    // ✅ Ensuite valider le format
    if (!garagisteId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        message: "ID de garagiste invalide" 
      });
    }

    // Le reste de votre code...
    const garagiste = await Garagiste.findById(garagisteId)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .populate('createdBy', 'username email')
      .lean();

    if (!garagiste) {
      return res.status(404).json({ 
        message: "Garagiste non trouvé" 
      });
    }

    console.log("✅ Garagiste trouvé:", garagiste.username);

    const garagisteRole = await GaragisteRole.findOne({ 
      garagisteId: garagiste._id 
    }).lean();

    if (!garagisteRole) {
      return res.status(404).json({ 
        message: "Aucun rôle assigné à ce garagiste" 
      });
    }

    const role = await Role.findById(garagisteRole.roleId).lean();

    if (!role) {
      return res.status(404).json({ 
        message: "Rôle non trouvé dans la base de données" 
      });
    }

    const rolePermissions = await RolePermission.find({ 
      roleId: role._id 
    }).lean();

    const permissionIds = rolePermissions.map(rp => rp.permissionId);
    const permissions = await Permission.find({ 
      _id: { $in: permissionIds } 
    }).lean();

    const formattedPermissions = permissions.map(permission => ({
      id: permission._id,
      name: permission.name,
      description: permission.description || '',
      category: permission.category || '',
      createdAt: permission.createdAt
    }));

    const isAdmin = role.name === "Admin Garage" || 
                    role.name === "Admin" || 
                    role.name.toLowerCase().includes("admin");

    const response = {
      garagiste: {
        id: garagiste._id,
        username: garagiste.username,
        email: garagiste.email,
        phone: garagiste.phone,
        isVerified: garagiste.isVerified,
        isAdmin: isAdmin,
        garageId: garagiste.garage || null,
        createdAt: garagiste.createdAt,
        updatedAt: garagiste.updatedAt,
        createdBy: garagiste.createdBy ? {
          id: garagiste.createdBy._id,
          username: garagiste.createdBy.username,
          email: garagiste.createdBy.email
        } : null
      },
      role: {
        id: role._id,
        name: role.name,
        description: role.description || '',
        createdAt: role.createdAt
      },
      permissions: formattedPermissions,
      stats: {
        totalPermissions: formattedPermissions.length,
        isAdmin: isAdmin,
        hasGarage: !!garagiste.garage,
        accountStatus: garagiste.isVerified ? 'Vérifié' : 'En attente de vérification'
      }
    };

    console.log("✅ Réponse complète construite");

    res.status(200).json({
      message: "Garagiste récupéré avec succès",
      data: response
    });

  } catch (err) {
    console.error("❌ Erreur récupération garagiste:", err.message);
    res.status(500).json({
      message: "Erreur serveur lors de la récupération",
      error: err.message
    });
  }
};


// ========== ACTIVER UN GARAGE (PROTÉGÉ) ==========
export const ActiveGarageAccount = async (req, res) => {
  try {
    // ✅ Vérifier que l'utilisateur est SuperAdmin
    if (!req.user?.isSuperAdmin) {
      console.warn("⚠️ Tentative d'activation par non-SuperAdmin:", req.user?.email);
      return res.status(403).json({ 
        message: "Accès refusé. Vous devez être SuperAdmin." 
      });
    }

    const { id } = req.params;
    
    const garage = await Garage.findById(id);
    if (!garage) {
      return res.status(404).json({ message: "Garage introuvable" });
    }

    // ✅ Vérifier si déjà activé
    if (garage.isActive) {
      return res.status(400).json({ 
        message: "Ce garage est déjà activé" 
      });
    }

    // ✅ Activer le garage
    garage.isActive = true;
    await garage.save();

    console.log("✅ Garage activé:", {
      activatedBy: req.user.email,
      activatedGarage: garage.email // ✅ CORRECTION ICI
    });

    res.json({ 
      message: "Garage activé avec succès",
      garage: {
        id: garage._id,
        nom: garage.nom,
        email: garage.email,
        isActive: garage.isActive
      }
    });
    
  } catch (err) {
    console.error("❌ Erreur activation:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ========== DÉSACTIVER UN GARAGE (PROTÉGÉ) ==========
export const DésactiveGarageAccount = async (req, res) => {
  try {
    // ✅ Vérifier que l'utilisateur est SuperAdmin
    if (!req.user?.isSuperAdmin) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const { id } = req.params;
    
    const garage = await Garage.findById(id);
    if (!garage) {
      return res.status(404).json({ message: "Garage introuvable" });
    }

    // ✅ Vérifier si déjà désactivé (AJOUTÉ)
    if (!garage.isActive) {
      return res.status(400).json({ 
        message: "Ce garage est déjà désactivé" 
      });
    }

    // ✅ Désactiver le garage
    garage.isActive = false;
    await garage.save();

    console.log("✅ Garage désactivé:", {
      deactivatedBy: req.user.email,
      deactivatedGarage: garage.email // ✅ CORRECTION ICI
    });

    res.json({ 
      message: "Garage désactivé avec succès",
      garage: {
        id: garage._id,
        nom: garage.nom,
        email: garage.email,
        isActive: garage.isActive
      }
    });
    
  } catch (err) {
    console.error("❌ Erreur désactivation:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};


// ========== RÉCUPÉRER LES GARAGISTES D'UN GARAGE ==========
export const getGaragistesByGarage = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est SuperAdmin
    if (!req.user?.isSuperAdmin) {
      return res.status(403).json({ 
        message: "Accès refusé. Vous devez être SuperAdmin." 
      });
    }

    const { id } = req.params; // ID du garage
    
    // Vérifier que le garage existe
    const garage = await Garage.findById(id);
    if (!garage) {
      return res.status(404).json({ message: "Garage introuvable" });
    }

    // Récupérer tous les garagistes liés à ce garage
    const garagistes = await Garagiste.find({ garage: id })
      .select('-password') // Ne pas retourner le mot de passe
      .populate('createdBy', 'username email') // Populer qui a créé le garagiste
      .sort({ createdAt: -1 }); // Trier par date de création décroissante

    console.log(`✅ ${garagistes.length} garagiste(s) récupéré(s) pour le garage:`, garage.nom);

    res.json({
      garagistes,
      total: garagistes.length,
      garage: {
        id: garage._id,
        nom: garage.nom,
        email: garage.email
      }
    });
    
  } catch (err) {
    console.error("❌ Erreur récupération garagistes:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ========== ACTIVER UN GARAGISTE ==========
export const activateGaragiste = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est SuperAdmin
    if (!req.user?.isSuperAdmin) {
      console.warn("⚠️ Tentative d'activation par non-SuperAdmin:", req.user?.email);
      return res.status(403).json({ 
        message: "Accès refusé. Vous devez être SuperAdmin." 
      });
    }

    const { id } = req.params; // ID du garagiste
    
    const garagiste = await Garagiste.findById(id).populate('garage', 'nom email');
    if (!garagiste) {
      return res.status(404).json({ message: "Garagiste introuvable" });
    }

    // Vérifier si déjà actif
    if (garagiste.isActive) {
      return res.status(400).json({ 
        message: "Ce garagiste est déjà activé" 
      });
    }

    // Activer le garagiste
    garagiste.isActive = true;
    await garagiste.save();

    console.log("✅ Garagiste activé:", {
      activatedBy: req.user.email,
      garagiste: garagiste.username,
      email: garagiste.email,
      garage: garagiste.garage?.nom
    });

    res.json({ 
      message: "Garagiste activé avec succès",
      garagiste: {
        id: garagiste._id,
        username: garagiste.username,
        email: garagiste.email,
        isActive: garagiste.isActive,
        garage: garagiste.garage
      }
    });
    
  } catch (err) {
    console.error("❌ Erreur activation garagiste:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ========== DÉSACTIVER UN GARAGISTE ==========
export const deactivateGaragiste = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est SuperAdmin
    if (!req.user?.isSuperAdmin) {
      return res.status(403).json({ 
        message: "Accès refusé. Vous devez être SuperAdmin." 
      });
    }

    const { id } = req.params; // ID du garagiste
    
    const garagiste = await Garagiste.findById(id).populate('garage', 'nom email');
    if (!garagiste) {
      return res.status(404).json({ message: "Garagiste introuvable" });
    }

    // Vérifier si déjà inactif
    if (!garagiste.isActive) {
      return res.status(400).json({ 
        message: "Ce garagiste est déjà désactivé" 
      });
    }

    // Désactiver le garagiste
    garagiste.isActive = false;
    await garagiste.save();

    console.log("✅ Garagiste désactivé:", {
      deactivatedBy: req.user.email,
      garagiste: garagiste.username,
      email: garagiste.email,
      garage: garagiste.garage?.nom
    });

    res.json({ 
      message: "Garagiste désactivé avec succès",
      garagiste: {
        id: garagiste._id,
        username: garagiste.username,
        email: garagiste.email,
        isActive: garagiste.isActive,
        garage: garagiste.garage
      }
    });
    
  } catch (err) {
    console.error("❌ Erreur désactivation garagiste:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

