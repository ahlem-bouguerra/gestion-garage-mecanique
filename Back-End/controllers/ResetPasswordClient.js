
import bcrypt from "bcryptjs";
import { Client } from "../models/Client.js";


export const resetPasswordClient = async (req , res )=>{
    try{
        const {email,token,newPassword} = req.body;
        const client = await Client.findOne({email});

        if (!client || !client.resetPasswordToken || !client.resetPasswordExpires){
             return res.status(400).json({message: "Lien invalide ou expiré."});
        }

         // Vérifier expiration
        if (client.resetPasswordExpires < Date.now()) {
        return res.status(400).json({ message: "Lien expiré." });
        }

            // Vérifier token
        const isMatch = await bcrypt.compare(token, client.resetPasswordToken);
        if (!isMatch) {
        return res.status(400).json({ message: "Lien invalide." });
        }


        // Hacher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        client.password = hashedPassword;


        // Supprimer token
        client.resetPasswordToken = null;
        client.resetPasswordExpires = null;


        await client.save();

        res.json({ message: "Mot de passe réinitialisé avec succès." });
        

    }catch (err){
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });

    }
}