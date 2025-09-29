import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const sendForgotPasswordMailerClient = async (to, token) => {
  const resetURL = `${process.env.FRONTEND_URL_CLIENT}/auth/reset-password?token=${token}&email=${to}`;
  const mailOptions = {
    from: process.env.MAIL_USER,
    to,
    subject: "Réinitialisation du mot de passe",
    html: `
      <h1>Réinitialisation de votre mot de passe</h1>
      <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous pour continuer.</p>
      <p>⚠️ Ce lien est valable 15 minutes seulement.</p>
      <p><a href="${resetURL}">Réinitialiser mon mot de passe</a></p>
    `,
  };

  try {
    console.log("📤 Envoi de l'email à :", to);
    await transporter.sendMail(mailOptions);
    console.log("✅ Email envoyé !");
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email :", error);
    throw new Error("Erreur lors de l'envoi de l'email");
  }
};
