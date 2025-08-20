import nodemailer from 'nodemailer';
import Devis from '../models/Devis.js';
import FicheClient from '../models/FicheClient.js';
import { User } from '../models/User.js';


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

    // Récupérer l'utilisateur depuis le token
    const user = req.user; // <-- ici req.user contient les infos décodées du token + l'objet complet User depuis la DB
    console.log('👤 Utilisateur connecté:', user.username);
    console.log('📱 Téléphone depuis token:', user.phone);
    console.log('🆔 ID utilisateur depuis token:', user._id);

    const devis = await Devis.findOne({ id: devisId });
    if (!devis) return res.status(404).json({ message: 'Devis non trouvé' });

    const client = await FicheClient.findById(devis.clientId);
    if (!client || !client.email)
      return res.status(400).json({ message: 'Email du client non trouvé' });

    const emailContent = generateDevisHTML(devis, user);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: client.email,
      subject: `Devis ${devis.id} - Atelier Mécanique`,
      html: emailContent,
      replyTo: user.email
    };

    await transporter.sendMail(mailOptions);

    await Devis.findOneAndUpdate({ id: devisId }, { 
      status: 'envoye',
      sentBy: user._id,
      sentAt: new Date()
    });

    res.json({ 
      success: true, 
      message: `Devis envoyé à ${client.email} par ${user.username}` 
    });

  } catch (error) {
    console.error('Erreur envoi email:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi de l\'email' });
  }
};



const generateDevisHTML = (devis ,user) => {
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
          <h1>🔧 Atelier Mécanique</h1>
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
            <p style="font-size: 20px; color: #2c3e50;"><strong>TOTAL TTC: ${devis.totalTTC.toFixed(3)} Dinnar</strong></p>
          </div>

          <div class="info-box">
            <p><strong>ℹ️ Information importante :</strong></p>
            <p>Cliquez sur l'un des boutons ci-dessous pour confirmer votre décision concernant ce devis.</p>
          </div>

          <div class="buttons">
            <h3>Que souhaitez-vous faire ?</h3>
            <!-- ✅ URLS CORRIGÉES - correspond aux routes -->
            <a href="${baseURL}/api/devis/${devis._id}/accept" class="btn btn-accept">
              ✅ Accepter le devis
            </a>
            <a href="${baseURL}/api/devis/${devis._id}/refuse" class="btn btn-refuse">
              ❌ Refuser le devis
            </a>
          </div>
          <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
  <p><strong>Contact :</strong></p>
  ${user ? `
    <p>📧 Email: ${user.email}</p>
    <p>📱 Téléphone: ${user.phone || 'Non renseigné'}</p>

  ` : ''}
</div>


        
        </div>
      </div>
    </body>
    </html>
  `;
};


