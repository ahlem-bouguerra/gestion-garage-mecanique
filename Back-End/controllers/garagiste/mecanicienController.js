import { Garagiste } from '../../models/Garagiste.js';
import { GaragisteRole } from '../../models/GaragisteRole.js';
import { Role } from '../../models/Role.js';
import { validateTunisianPhone } from '../../utils/phoneValidator.js';
import mongoose from "mongoose";

// 📌 Créer un mécanicien avec rôle (SANS TRANSACTION)
import bcrypt from 'bcrypt';

export const createMecanicien = async (req, res) => {
  try {
    // Valider le téléphone
    const phoneValidation = validateTunisianPhone(req.body.telephone);
    if (!phoneValidation.isValid) {
      return res.status(400).json({ error: phoneValidation.message });
    }

    // Vérifier que le rôle existe
    if (!req.body.roleId) {
      return res.status(400).json({ error: "Un rôle doit être sélectionné" });
    }

    const roleExists = await Role.findById(req.body.roleId);
    if (!roleExists) {
      return res.status(404).json({ error: "Rôle introuvable" });
    }

    // Générer un matricule unique
    const matricule = `MEC-${Date.now()}`;

    // ✅ CORRECTION : Générer et hasher le mot de passe temporaire
    const tempPassword = `temp${Date.now()}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    console.log(`🔐 Mot de passe temporaire pour ${req.body.email}: ${tempPassword}`);
    // ⚠️ Pensez à envoyer ce mot de passe par email au mécanicien !

    // Créer l'employé mécanicien dans la table Garagiste
    const mecanicien = new Garagiste({
      username: req.body.nom,
      email: req.body.email,
      phone: phoneValidation.cleanNumber,
      password: hashedPassword, // ✅ Mot de passe hashé
      garage: req.user.garage || req.user.garageId,
      createdBy: req.user._id,
      isVerified: true,
      isActive: true,
      mecanicienData: {
        matricule,
        dateNaissance: req.body.dateNaissance,
        poste: req.body.poste,
        dateEmbauche: req.body.dateEmbauche || new Date(),
        typeContrat: req.body.typeContrat,
        statut: req.body.statut || 'Actif',
        salaire: req.body.salaire,
        services: req.body.services,
        experience: req.body.experience,
        permisConduire: req.body.permisConduire
      }
    });

    await mecanicien.save();

    // Créer l'association GaragisteRole
    const garagisteRole = new GaragisteRole({
      garagisteId: mecanicien._id,
      roleId: req.body.roleId
    });

    await garagisteRole.save();

    // Retourner les données avec le rôle
    const mecanicienWithRole = {
      ...mecanicien.toObject(),
      roleId: req.body.roleId,
      roleName: roleExists.name,
      tempPassword: tempPassword // ✅ Retourner le mot de passe temporaire pour l'afficher/envoyer
    };

    res.status(201).json(mecanicienWithRole);
  } catch (err) {
    console.error("❌ Erreur createMecanicien:", err);
    
    // En cas d'erreur, essayer de nettoyer (rollback manuel)
    if (err.mecanicienId) {
      try {
        await Garagiste.findByIdAndDelete(err.mecanicienId);
      } catch (cleanupErr) {
        console.error("❌ Erreur lors du nettoyage:", cleanupErr);
      }
    }
    
    res.status(400).json({ error: err.message });
  }
};
// 📌 Mettre à jour un mécanicien et son rôle (SANS TRANSACTION)
export const updateMecanicien = async (req, res) => {
  try {
    const { id } = req.params;

    // Valider le téléphone si modifié
    if (req.body.telephone) {
      const phoneValidation = validateTunisianPhone(req.body.telephone);
      if (!phoneValidation.isValid) {
        return res.status(400).json({ error: phoneValidation.message });
      }
      req.body.telephone = phoneValidation.cleanNumber;
    }
        if (!req.body.roleId) {
      return res.status(400).json({ error: "Un rôle doit être sélectionné" });
    }

        const roleExists = await Role.findById(req.body.roleId);
    if (!roleExists) {
      return res.status(404).json({ error: "Rôle introuvable" });
    }

        const mecanicienRole = await GaragisteRole.findOne({
      garagisteId: id,
      roleId: req.body.roleId
    });

        if (!mecanicienRole) {
      return res.status(403).json({
        error: "Ce mécanicien n'a pas accès à ce rôle."
      });
    }

    // Construire l'objet de mise à jour
    const updateData = {
      username: req.body.nom,
      email: req.body.email,
      phone: req.body.telephone,
      'mecanicienData.dateNaissance': req.body.dateNaissance,
      'mecanicienData.poste': req.body.poste,
      'mecanicienData.dateEmbauche': req.body.dateEmbauche,
      'mecanicienData.typeContrat': req.body.typeContrat,
      'mecanicienData.statut': req.body.statut,
      'mecanicienData.salaire': req.body.salaire,
      'mecanicienData.services': req.body.services,
      'mecanicienData.experience': req.body.experience,
      'mecanicienData.permisConduire': req.body.permisConduire
    };

    const mecanicien = await Garagiste.findOneAndUpdate(
      { 
        _id: id, 
        garage: req.user.garage || req.user.garageId
      },
      { $set: updateData },
      { new: true }
    );

    if (!mecanicien) {
      return res.status(404).json({ error: 'Mécanicien non trouvé' });
    }

    // Mettre à jour le rôle si fourni
    if (req.body.roleId) {
      const roleExists = await Role.findById(req.body.roleId);
      if (!roleExists) {
        return res.status(404).json({ error: "Rôle introuvable" });
      }

      // Supprimer l'ancien rôle et créer le nouveau
      await GaragisteRole.findOneAndDelete({ garagisteId: id });

      const newGaragisteRole = new GaragisteRole({
        garagisteId: id,
        roleId: req.body.roleId
      });

      await newGaragisteRole.save();
    }

    // Récupérer le rôle actuel
    const currentRole = await GaragisteRole.findOne({ garagisteId: id }).populate('roleId');

    const mecanicienWithRole = {
      ...mecanicien.toObject(),
      roleId: currentRole?.roleId?._id,
      roleName: currentRole?.roleId?.name
    };

    res.json(mecanicienWithRole);
  } catch (err) {
    console.error("❌ Erreur updateMecanicien:", err);
    res.status(400).json({ error: err.message });
  }
};

// 📌 Supprimer un mécanicien et son rôle (SANS TRANSACTION)
export const deleteMecanicien = async (req, res) => {
  try {
    const { id } = req.params;

    // Supprimer le mécanicien
    const mecanicien = await Garagiste.findOneAndDelete({
      _id: id,
      garage: req.user.garage || req.user.garageId,
      'mecanicienData.matricule': { $exists: true }
    });

    if (!mecanicien) {
      return res.status(404).json({ error: "Mécanicien non trouvé" });
    }

    // Supprimer l'association GaragisteRole
    await GaragisteRole.findOneAndDelete({ garagisteId: id });

    res.json({ message: "Mécanicien supprimé avec succès" });
  } catch (err) {
    console.error("❌ Erreur deleteMecanicien:", err);
    res.status(400).json({ error: err.message });
  }
};

// 📌 Récupérer tous les mécaniciens avec leurs rôles
export const getAllMecaniciens = async (req, res) => {
  try {
    const { garageId } = req.query;
    
    // ⭐ ÉTAPE 1 : Récupérer les IDs des rôles "Mécanicien" et "Employé Garage"
    const rolesRecherches = await Role.find({
      name: { $in: ['Mécanicien', 'Employé Garage'] }
    });
    
    if (!rolesRecherches || rolesRecherches.length === 0) {
      return res.status(404).json({ 
        error: 'Aucun rôle "Mécanicien" ou "Employé Garage" trouvé' 
      });
    }
    
    const roleIds = rolesRecherches.map(r => r._id);
    console.log('🔍 IDs des rôles recherchés:', roleIds);
    
    // ⭐ ÉTAPE 2 : Récupérer tous les garagisteId qui ont ces rôles
    const garagistesAvecRoles = await GaragisteRole.find({
      roleId: { $in: roleIds }
    });
    
    const garagisteIds = garagistesAvecRoles.map(gr => gr.garagisteId);
    console.log('🔍 IDs des garagistes avec ces rôles:', garagisteIds);
    
    if (garagisteIds.length === 0) {
      return res.json([]); // Aucun garagiste avec ces rôles
    }
    
    // ⭐ ÉTAPE 3 : Construire le filtre pour Garagiste
    const filter = {
      _id: { $in: garagisteIds } // ✅ Filtre par les IDs trouvés
    };
    
    // Filtrer par garage selon le rôle de l'utilisateur
    if (req.user.isSuperAdmin && garageId) {
      filter.garage = garageId;
    } else if (!req.user.isSuperAdmin) {
      filter.garage = req.user.garage || req.user.garageId;
    }
    
    // ⭐ ÉTAPE 4 : Récupérer les Garagistes avec ces critères
    const mecaniciens = await Garagiste.find(filter).select('-password');
    
    console.log(`✅ ${mecaniciens.length} mécaniciens/employés trouvés`);

    // ⭐ ÉTAPE 5 : Récupérer les rôles pour affichage
    const mecaniciensIds = mecaniciens.map(m => m._id);
    const roles = await GaragisteRole.find({
      garagisteId: { $in: mecaniciensIds }
    }).populate('roleId');

    // Créer un map pour accès rapide aux rôles
    const roleMap = {};
    roles.forEach(gr => {
      roleMap[gr.garagisteId.toString()] = {
        roleId: gr.roleId._id,
        roleName: gr.roleId.name
      };
    });

    // ⭐ ÉTAPE 6 : Transformer les données
    const formattedMecaniciens = mecaniciens.map(mec => ({
      _id: mec._id,
      matricule: mec.mecanicienData?.matricule || 'N/A',
      nom: mec.username,
      dateNaissance: mec.mecanicienData?.dateNaissance,
      telephone: mec.phone,
      email: mec.email,
      poste: mec.mecanicienData?.poste,
      dateEmbauche: mec.mecanicienData?.dateEmbauche,
      typeContrat: mec.mecanicienData?.typeContrat,
      statut: mec.mecanicienData?.statut || 'Actif',
      salaire: mec.mecanicienData?.salaire,
      services: mec.mecanicienData?.services || [],
      experience: mec.mecanicienData?.experience,
      permisConduire: mec.mecanicienData?.permisConduire,
      roleId: roleMap[mec._id.toString()]?.roleId,
      roleName: roleMap[mec._id.toString()]?.roleName,
      createdAt: mec.createdAt,
      updatedAt: mec.updatedAt
    }));

    res.json(formattedMecaniciens);
    
  } catch (err) {
    console.error("❌ Erreur getAllMecaniciens:", err);
    res.status(400).json({ error: err.message });
  }
};

// 📌 Récupérer un mécanicien par ID avec son rôle
export const getMecanicienById = async (req, res) => {
  try {
    const { id } = req.params;
    const mecanicien = await Garagiste.findOne({
      _id: id,
      garage: req.user.garage || req.user.garageId,
      'mecanicienData.matricule': { $exists: true }
    }).select('-password');

    if (!mecanicien) {
      return res.status(404).json({ error: "Mécanicien non trouvé" });
    }

    // Récupérer le rôle
    const garagisteRole = await GaragisteRole.findOne({ 
      garagisteId: id 
    }).populate('roleId');

    // Formater la réponse
    const formatted = {
      _id: mecanicien._id,
      matricule: mecanicien.mecanicienData.matricule,
      nom: mecanicien.username,
      dateNaissance: mecanicien.mecanicienData.dateNaissance,
      telephone: mecanicien.phone,
      email: mecanicien.email,
      poste: mecanicien.mecanicienData.poste,
      dateEmbauche: mecanicien.mecanicienData.dateEmbauche,
      typeContrat: mecanicien.mecanicienData.typeContrat,
      statut: mecanicien.mecanicienData.statut,
      salaire: mecanicien.mecanicienData.salaire,
      services: mecanicien.mecanicienData.services,
      experience: mecanicien.mecanicienData.experience,
      permisConduire: mecanicien.mecanicienData.permisConduire,
      roleId: garagisteRole?.roleId?._id,
      roleName: garagisteRole?.roleId?.name,
      createdAt: mecanicien.createdAt,
      updatedAt: mecanicien.updatedAt
    };

    res.json(formatted);
  } catch (err) {
    console.error("❌ Erreur getMecanicienById:", err);
    res.status(400).json({ error: err.message });
  }
};

// 📌 Récupérer les mécaniciens par service
export const getMecaniciensByService = async (req, res) => {
  try {
const { serviceId } = req.params;
    const { garageId } = req.query;

    // Toujours utiliser le garage de l'utilisateur connecté si pas fourni
    const targetGarageId = garageId || req.user.garage || req.user.garageId;

    if (!targetGarageId) {
      return res.status(400).json({
        success: false,
        error: "Aucun garageId valide fourni."
      });
    }

    const serviceObjectId = new mongoose.Types.ObjectId(serviceId);

    const mecaniciens = await Garagiste.find({
      garage: targetGarageId,
      'mecanicienData.matricule': { $exists: true },
      'mecanicienData.services.serviceId': serviceObjectId
    }).select('-password');

    if (!mecaniciens || mecaniciens.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Aucun mécanicien trouvé pour le service ${serviceId}.`
      });
    }

    // Récupérer les rôles
    const mecaniciensIds = mecaniciens.map(m => m._id);
    const roles = await GaragisteRole.find({
      garagisteId: { $in: mecaniciensIds }
    }).populate('roleId');

    const roleMap = {};
    roles.forEach(gr => {
      roleMap[gr.garagisteId.toString()] = {
        roleId: gr.roleId._id,
        roleName: gr.roleId.name
      };
    });

    const formatted = mecaniciens.map(mec => ({
      _id: mec._id,
      matricule: mec.mecanicienData.matricule,
      nom: mec.username,
      telephone: mec.phone,
      email: mec.email,
      poste: mec.mecanicienData.poste,
      statut: mec.mecanicienData.statut,
      services: mec.mecanicienData.services,
      roleId: roleMap[mec._id.toString()]?.roleId,
      roleName: roleMap[mec._id.toString()]?.roleName
    }));

    return res.json({
      success: true,
      mecaniciens: formatted
    });

  } catch (error) {
    console.error("❌ Erreur getMecaniciensByService:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};


export const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find({ 
      name: { $nin: ["Super Admin" ,"Admin Garage"] } 
    }).select('_id name description');
    res.json(roles );
  } catch (error) {
    console.error("❌ Erreur getAllRoles:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};