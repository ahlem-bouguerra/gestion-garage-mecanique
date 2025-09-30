import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Client } from "../../models/Client.js";
import { sendForgotPasswordMailerClient } from "../../utils/sendForgotPasswordMailerClient.js";

export const forgotPasswordClient = async(req,res) =>{
    try{
        const {email}= req.body;
        console.log("🔍 Email reçu:", email);
        
        const client = await Client.findOne({email});
        console.log("👤 Client trouvé:", client ? "OUI" : "NON");
        
        if (client) {
            console.log("📧 Email dans DB:", client.email);
            console.log("🆔 ID:", client._id);
        }

        if (!client){
            return res.json({message: "Aucun utilisateur avec cet mail , vérifier votre mail"});
        }

        if (client.googleId  && !client.password){
            return res.json({message : "ce compte utilise google  , Beuillez vous connecter via google"});
        }

        const token = crypto.randomBytes(32).toString('hex');

        const hashedToken = await bcrypt.hash(token,10);
        client.resetPasswordToken = hashedToken;
        client.resetPasswordExpires = Date.now()+60*60*1000;
        await client.save();

        await sendForgotPasswordMailerClient(email, token);
        console.log("📧 Email de mot de passe oublié envoyé à :", email);
            
        res.status(201).json({ message: "Vérification réussie. Vérifie ton email." });

    }catch (err) {
        console.error("❌ Erreur:", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
}