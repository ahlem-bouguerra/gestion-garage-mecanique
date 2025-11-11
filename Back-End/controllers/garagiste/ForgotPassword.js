import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Garagiste } from "../../models/Garagiste.js";
import { sendForgotPasswordMailer } from "../../utils/sendForgotPasswordMailer.js";

export const forgotPassword = async(req,res) =>{
    try{
        const {email}= req.body;
        const user = await Garagiste.findOne({email});

        if (!user){
            return res.json({message: "Aucun utilisateur avec cet mail , vérifier votre mail"});
        }

        if (user.googleId  && !user.password){
            return res.json({message : "ce compte utilise google  , Beuillez vous connecter via google"});

        }

        const token = crypto.randomBytes(32).toString('hex');

        const hashedToken = await bcrypt.hash(token,10);
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now()+60*60*1000; //15 min
        await user.save();



        // Envoyer l'e-mail de vérification
        await sendForgotPasswordMailer(email, token);
        console.log("📧 Email de mot de passe oublié  envoyé à :", email);
            
        res.status(201).json({ message: "Vérification réussie. Vérifie ton email." });

    }catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }


}