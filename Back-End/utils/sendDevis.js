import nodemailer from 'nodemailer';
import Devis from '../models/Devis.js';
import FicheClient from '../models/FicheClient.js';
import { Garagiste } from '../models/Garagiste.js';
import {Garage} from '../models/Garage.js'; // ⭐ AJOUT DU MODÈLE GARAGE

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

export const sendDevisByEmail = async (req, res) => {
  try {
    const { devisId } = req.params;
    const { garageId } = req.body;

    const user = req.user;
    console.log('👤 Utilisateur connecté:', user);

    // ✅ Récupérer le devis (avec _id OU id custom) et peupler clientId
    let devis;
     if (devisId.match(/^[0-9a-fA-F]{24}$/)) {
      devis = await Devis.findById(devisId)
        .populate({
          path: 'clientId',
          populate: {
            path: 'clientId', // ⭐ Populate le Client lié à FicheClient
            select: 'username email' // Sélectionner uniquement les champs nécessaires
          }
        });
    } else {
      devis = await Devis.findOne({ id: devisId })
        .populate({
          path: 'clientId',
          populate: {
            path: 'clientId', // ⭐ Populate le Client lié à FicheClient
            select: 'username email'
          }
        });
    }

    if (!devis) {
      return res.status(404).json({ message: 'Devis non trouvé' });
    }


    console.log('📋 Devis trouvé:', {
      id: devis.id,
      _id: devis._id,
      garageId: devis.garageId,
      clientId: devis.clientId,
      clientIdType: devis.clientId?.constructor.name, // ⭐ Voir le type
      hasClientId: !!devis.clientId?.clientId, // ⭐ Vérifier si clientId.clientId existe
      clientIdUsername: devis.clientId?.clientId?.username // ⭐ Voir si username est accessible
    });

    const client = devis.clientId;
    
    if (!client || !client.email) {
      return res.status(400).json({ message: 'Email du client non trouvé' });
    }

    // ⭐ NOUVEAU : Récupérer le nom du client avec logs détaillés
    let clientDisplayName = '';
    
    console.log('🔍 Analyse de la structure client:', {
      hasClient: !!client,
      hasClientId: !!client.clientId,
      clientIdUsername: client.clientId?.username,
      clientNom: client.nom,
      clientEmail: client.email
    });

    // Priorité 1 : Si clientId est un Client avec username (FicheClient -> Client)
    if (client.clientId?.username) {
      clientDisplayName = client.clientId.username;
      console.log('✅ Nom du client trouvé via clientId.username:', clientDisplayName);
    }
    // Priorité 2 : Si clientId est une FicheClient avec nom
    else if (client.nom) {
      clientDisplayName = client.nom;
      console.log('✅ Nom du client trouvé via nom:', clientDisplayName);
    }
    // Priorité 3 : Utiliser l'email comme fallback
    else if (client.email) {
      clientDisplayName = client.email.split('@')[0]; // Prendre la partie avant @
      console.log('⚠️ Nom du client par défaut (email):', clientDisplayName);
    }
    // Priorité 4 : Par défaut
    else {
      clientDisplayName = 'Client';
      console.log('⚠️ Nom du client par défaut: Client');
    }

    console.log('👤 Nom du client final déterminé:', clientDisplayName);

    // ✅ Déterminer les infos du garage
    let garageInfo = null;
    let garagisteInfo = null;
    let garageDisplayName = '';
    
    if (user.isSuperAdmin) {
      console.log('👑 SuperAdmin - Analyse des garageId disponibles:');
      console.log('   - garageId du body:', garageId);
      console.log('   - garageId du devis:', devis.garageId);
      
      const targetGarageId = garageId || devis.garageId;
      
      if (!targetGarageId) {
        console.error('❌ Aucun garageId trouvé');
        return res.status(400).json({ 
          message: 'garageId manquant',
          details: 'Impossible de déterminer le garage pour cet envoi'
        });
      }

      console.log('   ✅ garageId sélectionné:', targetGarageId);

      garageInfo = await Garage.findById(targetGarageId);
      
      if (!garageInfo) {
        console.error('❌ Garage non trouvé dans la collection Garage');
        return res.status(404).json({ 
          message: 'Garage non trouvé',
          garageIdSearched: targetGarageId.toString()
        });
      }

      if (garageInfo.garagisteAdmin) {
        garagisteInfo = await Garagiste.findById(garageInfo.garagisteAdmin);
      }

      garageDisplayName = garageInfo.nom || garagisteInfo?.username || 'Atelier Mécanique';

      console.log('✅ SuperAdmin envoie pour le garage:');
      console.log('   🏢 Nom garage:', garageInfo.nom);
      console.log('   👤 Nom garagiste:', garagisteInfo?.username);
      console.log('   🏷️ Nom d\'affichage:', garageDisplayName);
    } else {
      console.log('👨‍🔧 Garagiste - Récupération des infos');
      
      garagisteInfo = await Garagiste.findById(user._id);
      
      if (!garagisteInfo) {
        console.error('❌ Garagiste non trouvé avec ID:', user._id);
        return res.status(404).json({ 
          message: 'Informations du garagiste non trouvées' 
        });
      }

      if (garagisteInfo.garage) {
        garageInfo = await Garage.findById(garagisteInfo.garage);
      }

      garageDisplayName = garageInfo?.nom || garagisteInfo.username || 'Atelier Mécanique';
      
      console.log('✅ Garagiste envoie:');
      console.log('   👤 Nom garagiste:', garagisteInfo.username);
      console.log('   🏢 Nom garage:', garageInfo?.nom);
      console.log('   🏷️ Nom d\'affichage:', garageDisplayName);
    }

    if (!garageDisplayName) {
      console.error('❌ Impossible de déterminer le nom du garage');
      return res.status(500).json({ 
        message: 'Impossible de déterminer le nom du garage'
      });
    }

    // ⭐ Préparer les données pour l'email
    const emailData = {
      username: garageDisplayName,
      emailProfessionnel: garagisteInfo?.emailProfessionnel || garageInfo?.emailProfessionnel || process.env.EMAIL_USER,
      telephoneProfessionnel: garagisteInfo?.telephoneProfessionnel || garageInfo?.telephoneProfessionnel || 'Non renseigné'
    };

    console.log('📧 Données email préparées:', emailData);

    // ⭐ Générer l'email avec le nom du client récupéré
    const emailContent = generateDevisHTML(devis, emailData, clientDisplayName);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: client.email,
      subject: `Devis ${devis.id} - ${garageDisplayName}`,
      html: emailContent,
      replyTo: emailData.emailProfessionnel
    };

    await transporter.sendMail(mailOptions);

    // ✅ Mettre à jour le statut du devis
    if (devisId.match(/^[0-9a-fA-F]{24}$/)) {
      await Devis.findByIdAndUpdate(devisId, { 
        status: 'envoye',
        sentBy: user._id,
        sentAt: new Date()
      });
    } else {
      await Devis.findOneAndUpdate({ id: devisId }, { 
        status: 'envoye',
        sentBy: user._id,
        sentAt: new Date()
      });
    }

    res.json({ 
      success: true, 
      message: `Devis envoyé à ${client.email}${user.isSuperAdmin ? ` au nom de ${garageDisplayName}` : ''}` 
    });

  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'envoi de l\'email',
      error: error.message
    });
  }
};
// ⭐ MODIFIER la fonction generateDevisHTML pour accepter clientDisplayName
const generateDevisHTML = (devis, emailData, clientDisplayName) => { // ⭐ NOUVEAU PARAMÈTRE
  const servicesHTML = devis.services.map(service => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">${service.piece}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${service.quantity}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${service.unitPrice.toFixed(3)} Dinnar</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${service.total.toFixed(3)} Dinnar</td>
    </tr>
  `).join("");

  const tvaAmount = (devis.totalTTC - devis.totalHT).toFixed(3);
  const piecesTotal = (devis.totalHT - (devis.maindoeuvre || 0)).toFixed(3);

  const baseURL = process.env.BASE_URL || 'http://localhost:5000';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Devis ${devis.id}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; background: white; border: 1px solid #ddd; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th { background-color: #f8f9fa; padding: 12px; border: 1px solid #ddd; text-align: left; }
        .table td { padding: 10px; border: 1px solid #ddd; }
        .total-section { background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .buttons { text-align: center; margin: 30px 0; }
        .btn { 
          display: inline-block; 
          padding: 15px 30px; 
          margin: 0 10px; 
          text-decoration: none; 
          border-radius: 5px; 
          font-weight: bold;
          font-size: 16px;
          color: white !important;
        }
        .btn-accept { background-color: #27ae60; }
        .btn-refuse { background-color: #e74c3c; }
        .btn:hover { opacity: 0.8; }
        .info-box { 
          background-color: #e8f4fd; 
          border: 1px solid #bee5eb; 
          padding: 15px; 
          border-radius: 5px; 
          margin: 20px 0;
          color: #0c5460;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔧 ${emailData.username}</h1>
          <h2>Devis N° ${devis.id}</h2>
        </div>

        <div class="content">
          <p><strong>👤 Client:</strong> ${clientDisplayName}</p>
          <p><strong>🚗 Véhicule:</strong> ${devis.vehicleInfo}</p>
          <p><strong>📅 Date:</strong> ${new Date(devis.inspectionDate).toLocaleDateString("fr-FR")}</p>

          <table class="table">
            <thead>
              <tr>
                <th>Pièce / Service</th>
                <th>Qté</th>
                <th>Prix Unitaire</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${servicesHTML}
            </tbody>
          </table>

          <div class="total-section">
            <p><strong>Total pièces HT:</strong> ${piecesTotal} Dinnar</p>
            <p><strong>Main d'œuvre:</strong> ${(devis.maindoeuvre || 0).toFixed(3)} Dinnar</p>
            <p><strong>Total HT:</strong> ${devis.totalHT.toFixed(3)} Dinnar</p>
            <p><strong>TVA (${devis.tvaRate || 20}%):</strong> ${tvaAmount} Dinnar</p>
            <p><strong>Temps Estimé:</strong> ${devis.estimatedTime}</p>
            <p style="font-size: 20px; color: #2c3e50;"><strong>TOTAL TTC: ${devis.totalTTC.toFixed(3)} Dinnar</strong></p>
          </div>

          <div class="info-box">
            <p><strong>ℹ️ Information importante :</strong></p>
            <p>Cliquez sur l'un des boutons ci-dessous pour confirmer votre décision concernant ce devis.</p>
          </div>

          <div class="buttons">
            <h3>Que souhaitez-vous faire ?</h3>
            <a href="${baseURL}/api/devis/${devis._id}/accept" class="btn btn-accept">
              ✅ Accepter le devis
            </a>
            <a href="${baseURL}/api/devis/${devis._id}/refuse" class="btn btn-refuse">
              ❌ Refuser le devis
            </a>
          </div>
          
          <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
            <p><strong>Contact :</strong></p>
            <p>🏢 Garage: ${emailData.username}</p>
            <p>📧 Email: ${emailData.emailProfessionnel}</p>
            <p>📱 Téléphone: ${emailData.telephoneProfessionnel}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

