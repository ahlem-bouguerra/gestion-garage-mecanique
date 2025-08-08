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

export const sendVerificationEmail = async (to, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify?token=${token}`;
  const mailOptions = {
    from: process.env.MAIL_USER,
    to,
    subject: "Vérification de votre compte",
    html: `<h3>Bienvenue !</h3><p>Clique ici pour vérifier ton compte : <a href="${verificationUrl}">Vérifier</a></p>`,
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
