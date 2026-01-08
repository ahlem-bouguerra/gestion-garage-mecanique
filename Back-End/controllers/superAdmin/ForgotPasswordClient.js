import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Users } from "../../models/Users.js";
import { sendForgotPasswordMailerSuperAdmin } from "../../utils/sendForgotPasswordSuperAdmin.js";

export const forgotPasswordSuperAdmin = async(req,res) =>{
    try{
        const {email}= req.body;
        console.log("🔍 Email reçu:", email);
        
        const user = await Users.findOne({email});
        console.log("👤 Client trouvé:", user ? "OUI" : "NON");
        
        if (user) {
            console.log("📧 Email dans DB:", user.email);
            console.log("🆔 ID:", user._id);
        }

        if (!user){
            return res.json({message: "Aucun utilisateur avec cet mail , vérifier votre mail"});
        }

        if (user.googleId  && !user.password){
            return res.json({message : "ce compte utilise google  , Beuillez vous connecter via google"});
        }

        const token = crypto.randomBytes(32).toString('hex');

        const hashedToken = await bcrypt.hash(token,10);
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now()+60*60*1000;
        await user.save();

        await sendForgotPasswordMailerSuperAdmin(email, token);
        console.log("📧 Email de mot de passe oublié envoyé à :", email);
            
        res.status(201).json({ message: "Vérification réussie. Vérifie ton email." });

    }catch (err) {
        console.error("❌ Erreur:", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
}