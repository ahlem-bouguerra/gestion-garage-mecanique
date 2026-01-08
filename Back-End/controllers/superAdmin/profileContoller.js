// controllers/ProfileController.js
import { Users } from "../../models/Users.js";
import bcrypt from "bcryptjs";

import crypto from 'crypto';
import { sendVerificationEmailForCient } from "../../utils/mailerSuperAdmin.js";


export const getProfile = async (req, res) => {
  try {
    console.log('📋 GET Profile - User ID:', req.user._id);

    // Récupérer le profil complet avec les relations
    const profile = await Users.findById(req.user._id)
      .select('-password -resetPasswordToken')
      .lean();

    if (!profile) {
      return res.status(404).json({ 
        success: false,
        message: "Profil non trouvé" 
      });
    }

    console.log('✅ Profil récupéré:', profile.email);

    res.status(200).json({
      success: true,
      data: profile
    });

  } catch (error) {
    console.error('❌ Erreur GET Profile:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du profil",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


export const updateProfile = async (req, res) => {
  try {
    console.log('✏️ UPDATE Profile - User ID:', req.user._id);
    console.log('📝 Données reçues:', req.body);

    const { username, email, phone } = req.body;

    // Validation des champs
    if (!username?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Le nom d'utilisateur est requis"
      });
    }

    // ✅ Récupérer l'ancien email pour comparaison
    const currentUser = await Users.findById(req.user._id);
    const emailHasChanged = email && email.toLowerCase().trim() !== currentUser.email;

    // Vérifier si l'email existe déjà (sauf pour l'utilisateur actuel)
    if (emailHasChanged) {
      const existingUser = await Users.findOne({
        email: email.toLowerCase(),
        _id: { $ne: req.user._id }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Cet email est déjà utilisé par un autre compte"
        });
      }
    }

    // Préparer les données à mettre à jour
    const updateData = {
      username: username.trim()
    };

    // ✅ Variables pour l'envoi d'email
    let verificationToken = null;

    // Ajouter email uniquement s'il est fourni et différent
    if (emailHasChanged) {
      updateData.email = email.toLowerCase().trim();
      // Si l'email change, demander une nouvelle vérification
      updateData.isVerified = false;

      // ✅ Générer un nouveau token de vérification
      verificationToken = crypto.randomBytes(32).toString("hex");
      updateData.verificationToken = verificationToken;
      updateData.verificationTokenExpiry = Date.now() + 3600000; // 1 heure

      console.log('🔄 Changement d\'email détecté:', {
        ancien: currentUser.email,
        nouveau: updateData.email
      });
    }

    // Ajouter phone uniquement s'il est fourni
    if (phone !== undefined) {
      updateData.phone = phone.trim() || null;
    }

    // Mettre à jour le profil
    const updatedProfile = await Users.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .select('-password -resetPasswordToken -verificationToken')
      .lean();

    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        message: "Profil non trouvé"
      });
    }

    console.log('✅ Profil mis à jour:', updatedProfile.email);

    // ✅ Envoyer l'email de vérification si l'email a changé
    if (emailHasChanged && verificationToken) {
      try {
        await sendVerificationEmailForCient(updateData.email, verificationToken);
        console.log('📧 Email de vérification envoyé à:', updateData.email);
        
        // ✅ Informer l'utilisateur dans la réponse
        return res.status(200).json({
          success: true,
          message: "Profil mis à jour avec succès. Un email de vérification a été envoyé à votre nouvelle adresse.",
          emailChanged: true,
          requiresVerification: true,
          data: updatedProfile
        });
      } catch (emailError) {
        console.error('⚠️ Erreur envoi email de vérification:', emailError);
        
        // ✅ Informer l'utilisateur que l'email n'a pas pu être envoyé
        return res.status(200).json({
          success: true,
          message: "Profil mis à jour mais l'email de vérification n'a pas pu être envoyé. Veuillez contacter le support.",
          emailChanged: true,
          emailSendError: true,
          data: updatedProfile
        });
      }
    }

    // ✅ Réponse normale si l'email n'a pas changé
    res.status(200).json({
      success: true,
      message: "Profil mis à jour avec succès",
      emailChanged: false,
      data: updatedProfile
    });

  } catch (error) {
    console.error('❌ Erreur UPDATE Profile:', error);

    // Gestion des erreurs de validation Mongoose
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: "Erreur de validation",
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du profil",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


export const changePassword = async (req, res) => {
  try {
    console.log('🔐 CHANGE Password - User ID:', req.user._id);

    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validations
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs sont requis"
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Les nouveaux mots de passe ne correspondent pas"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Le mot de passe doit contenir au moins 6 caractères"
      });
    }

    // Vérifier que le nouveau mot de passe est différent de l'ancien
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "Le nouveau mot de passe doit être différent de l'ancien"
      });
    }

    // Récupérer l'utilisateur avec le mot de passe
    const user = await Users.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    // Vérifier si l'utilisateur a un mot de passe (pas Google Auth uniquement)
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "Ce compte utilise Google. Impossible de changer le mot de passe."
      });
    }

    // Vérifier le mot de passe actuel
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Mot de passe actuel incorrect"
      });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe
    user.password = hashedPassword;
    
    // Supprimer les tokens de réinitialisation s'ils existent
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    
    await user.save();

    console.log('✅ Mot de passe changé pour:', user.email);

    res.status(200).json({
      success: true,
      message: "Mot de passe changé avec succès"
    });

  } catch (error) {
    console.error('❌ Erreur CHANGE Password:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du changement de mot de passe",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
