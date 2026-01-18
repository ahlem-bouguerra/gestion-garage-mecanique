import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

console.log("🔍 Variables Email :");
console.log("MAIL_USER:", process.env.MAIL_USER || "❌ NON DÉFINI");
console.log("MAIL_PASS:", process.env.MAIL_PASS ? "✅ Défini" : "❌ NON DÉFINI");


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const sendVerificationEmailForCient = async (to, token) => {
  // ✅ CORRIGER L'URL - Pointer directement vers l'API backend
  const verificationUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/client/verify-token/${token}`;
  
  const mailOptions = {
    from: process.env.MAIL_USER,
    to,
    subject: "🔐 Vérification de votre compte",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; color: white; text-align: center;">
          <h1 style="margin: 0 0 20px 0;">🎉 Bienvenue !</h1>
          <p style="font-size: 18px; margin: 0 0 30px 0;">
            Merci de vous être inscrit ! Il ne reste plus qu'une étape.
          </p>
          
          <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <p style="margin: 0 0 20px 0; font-size: 16px;">
              Cliquez sur le bouton ci-dessous pour vérifier votre compte :
            </p>
            
            <a href="${verificationUrl}" 
               style="display: inline-block; background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              ✅ Vérifier mon compte
            </a>
          </div>
          
         
        </div>
        
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>Ce lien expirera dans 1 heure.</p>
          <p>Si vous n'avez pas créé de compte, ignorez cet email.</p>
        </div>
      </div>
    `,
  };

  try {
    console.log("📤 Envoi de l'email à :", to);
    console.log("🔗 URL de vérification :", verificationUrl);
    await transporter.sendMail(mailOptions);
    console.log("✅ Email envoyé !");
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email :", error);
    throw new Error("Erreur lors de l'envoi de l'email");
  }
};
