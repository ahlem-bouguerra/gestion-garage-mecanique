import nodemailer from 'nodemailer';
import Devis from '../models/Devis.js';
import FicheClient from '../models/FicheClient.js';


// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,      // ton email
    pass: process.env.EMAIL_PASSWORD   // mot de passe d'application Gmail
  }
});

export const sendDevisByEmail = async (req, res) => {
  try {
    const { devisId } = req.params;

    // Récupérer le devis
    const devis = await Devis.findOne({ id: devisId });
    if (!devis) return res.status(404).json({ message: 'Devis non trouvé' });

    // Récupérer l'email du client
    const client = await FicheClient.findById(devis.clientId);
    if (!client || !client.email)
      return res.status(400).json({ message: 'Email du client non trouvé' });

    // Construire le contenu HTML du devis
    const emailContent = generateDevisHTML(devis);

    // Options de l'email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: client.email,
      subject: `Devis ${devis.id} - Atelier Mécanique`,
      html: emailContent
    };

    // Envoyer l'email
    await transporter.sendMail(mailOptions);

    // Mettre à jour le statut du devis
    await Devis.findOneAndUpdate({ id: devisId }, { status: 'envoye' });

    res.json({ success: true, message: `Devis envoyé à ${client.email}` });
  } catch (error) {
    console.error('Erreur envoi email:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi de l\'email' });
  }
};

// utils/sendDevis.js


// ⚡ Définir la fonction ici
// utils/sendDevis.js

const generateDevisHTML = (devis) => {
  const servicesHTML = devis.services.map(service => `
    <tr>
      <td>${service.piece}</td>
      <td>${service.quantity}</td>
      <td>${service.unitPrice.toFixed(3)} Dinnar</td>
      <td>${service.total.toFixed(3)} Dinnar</td>
    </tr>
  `).join("");

  const tvaAmount = (devis.totalTTC - devis.totalHT).toFixed(3);
  const piecesTotal = (devis.totalHT - (devis.maindoeuvre || 0)).toFixed(3);

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Devis ${devis.id}</h2>
      <p><strong>Client:</strong> ${devis.clientName}</p>
      <p><strong>Véhicule:</strong> ${devis.vehicleInfo}</p>
      <p><strong>Date d'inspection:</strong> ${new Date(devis.inspectionDate).toLocaleDateString("fr-FR")}</p>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="border: 1px solid #ddd; padding: 8px;">Pièce</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Qté</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Prix Unit.</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${servicesHTML}
        </tbody>
      </table>

      <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa;">
        <p><strong>Total pièces HT:</strong> ${piecesTotal} Dinnar</p>
        <p><strong>Main d'œuvre:</strong> ${(devis.maindoeuvre || 0).toFixed(3)} Dinnar</p>
        <p><strong>Total HT:</strong> ${devis.totalHT.toFixed(3)} Dinnar</p>
        <p><strong>TVA (${devis.tvaRate || 20}%):</strong> ${tvaAmount} Dinnar</p>
        <p style="font-size: 18px;"><strong>Total TTC: ${devis.totalTTC.toFixed(3)} Dinnar</strong></p>
      </div>

      <div style="font-family: Arial, sans-serif; color: #333;">
      <h2>Votre devis est prêt</h2>
      <p>Veuillez choisir une option :</p>
      <a href="http://localhost:5000/api/${devis._id}/accept" 
   style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
  ✅ Accepter
</a>

      &nbsp;
      <a href="http://localhost:5000/api/devis/${devis.id}/reject" 
         style="padding: 10px 20px; background-color: #f44336; color: white; text-decoration: none; border-radius: 5px;">
        ❌ Refuser
      </a>
    </div>

      <p style="margin-top: 20px; color: #666;">
        Merci de nous faire confiance. 
      </p>
    </div>
  `;
};


