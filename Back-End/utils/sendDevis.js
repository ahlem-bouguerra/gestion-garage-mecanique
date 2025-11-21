import nodemailer from 'nodemailer';
import Devis from '../models/Devis.js';
import FicheClient from '../models/FicheClient.js';
import { Garagiste } from '../models/Garagiste.js';
import {Garage} from '../models/Garage.js'; // ⭐ AJOUT DU MODÈLE GARAGE

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export const sendDevisByEmail = async (req, res) => {
  try {
    const { devisId } = req.params;
    const { garageId } = req.body;

    const user = req.user;
    console.log('👤 Utilisateur connecté:', user);

    // ✅ Récupérer le devis (avec _id OU id custom)
    let devis;
    if (devisId.match(/^[0-9a-fA-F]{24}$/)) {
      devis = await Devis.findById(devisId);
    } else {
      devis = await Devis.findOne({ id: devisId });
    }

    if (!devis) {
      return res.status(404).json({ message: 'Devis non trouvé' });
    }

    console.log('📋 Devis trouvé:', {
      id: devis.id,
      _id: devis._id,
      garageId: devis.garageId,
      clientId: devis.clientId,
      clientName: devis.clientName
    });

    // ✅ Récupérer le client
    const client = await FicheClient.findById(devis.clientId);
    if (!client || !client.email) {
      return res.status(400).json({ message: 'Email du client non trouvé' });
    }

    // ✅ Déterminer les infos du garage - Variables déclarées ici pour être accessibles partout
    let garageInfo = null;
    let garagisteInfo = null;
    
    if (user.isSuperAdmin) {
      // SuperAdmin : priorité au garageId du body, sinon celui du devis
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

      // ⭐ Récupérer les infos du GARAGE (pas du garagiste)
      garageInfo = await Garage.findById(targetGarageId);
      
      if (!garageInfo) {
        console.error('❌ Garage non trouvé dans la collection Garage');
        console.error('   ID recherché:', targetGarageId);
        
        return res.status(404).json({ 
          message: 'Garage non trouvé',
          garageIdSearched: targetGarageId.toString(),
          hint: 'Vérifiez que le garage existe dans la base de données'
        });
      }

      // ⭐ Récupérer les infos du garagiste admin pour avoir l'email et le téléphone
      if (garageInfo.garagisteAdmin) {
        garagisteInfo = await Garagiste.findById(garageInfo.garagisteAdmin);
      }

      console.log('✅ SuperAdmin envoie pour le garage:');
      console.log('   🏢 Nom:', garageInfo.nom);
      console.log('   📧 Email:', garagisteInfo?.email || 'Non renseigné');
      console.log('   📱 Téléphone:', garagisteInfo?.phone || 'Non renseigné');
    } else {
      // Garagiste : récupérer ses infos ET les infos du garage
      console.log('👨‍🔧 Garagiste - Récupération des infos');
      console.log('   user._id:', user._id);
      
      garagisteInfo = await Garagiste.findById(user._id);
      
      if (!garagisteInfo) {
        console.error('❌ Garagiste non trouvé avec ID:', user._id);
        return res.status(404).json({ 
          message: 'Informations du garagiste non trouvées' 
        });
      }

      // Récupérer le garage associé au garagiste
      if (garagisteInfo.garage) {
        garageInfo = await Garage.findById(garagisteInfo.garage);
      }
      
      console.log('✅ Garagiste envoie:');
      console.log('   👤 Nom garagiste:', garagisteInfo.username);
      console.log('   🏢 Nom garage:', garageInfo?.nom || 'Non renseigné');
    }

    // ✅ Vérifier que garageInfo a bien toutes les propriétés nécessaires
    console.log('🔍 Vérification des données du garage:', {
      hasGarageInfo: !!garageInfo,
      garageId: garageInfo?._id,
      nom: garageInfo?.nom,
      hasGaragisteInfo: !!garagisteInfo,
      garagisteEmail: garagisteInfo?.email,
      garagistePhone: garagisteInfo?.phone
    });

    if (!garageInfo || !garageInfo.nom) {
      console.error('❌ Données du garage incomplètes');
      console.error('   garageInfo:', JSON.stringify(garageInfo, null, 2));
      return res.status(500).json({ 
        message: 'Données du garage incomplètes',
        details: {
          hasGarageInfo: !!garageInfo,
          hasNom: !!garageInfo?.nom,
          garageData: garageInfo ? {
            _id: garageInfo._id,
            nom: garageInfo.nom,
            garagisteAdmin: garageInfo.garagisteAdmin
          } : null
        }
      });
    }

    // ⭐ Préparer les données pour l'email
    const emailData = {
      username: garageInfo.nom,
      email: garagisteInfo?.email , // Fallback sur email par défaut
      phone: garagisteInfo?.phone || 'Non renseigné'
    };

    console.log('📧 Données email préparées:', emailData);

    // ✅ Générer l'email avec les infos du garage
    const emailContent = generateDevisHTML(devis, emailData);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: client.email,
      subject: `Devis ${devis.id} - ${garageInfo.nom}`,
      html: emailContent,
      replyTo: garagisteInfo?.email || process.env.EMAIL_USER
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
      message: `Devis envoyé à ${client.email}${user.isSuperAdmin ? ` au nom de ${garageInfo.nom}` : ''}` 
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

const generateDevisHTML = (devis, emailData) => {
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
          <h1>🔧 ${emailData.username || 'Atelier Mécanique'}</h1>
          <h2>Devis N° ${devis.id}</h2>
        </div>

        <div class="content">
          <p><strong>👤 Client:</strong> ${devis.clientName}</p>
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
            <p><strong>Temps Estimé </strong> ${devis.estimatedTime} </p>
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
            <p>📧 Email: ${emailData.email}</p>
            <p>📱 Téléphone: ${emailData.phone || 'Non renseigné'}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};