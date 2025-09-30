
import bcrypt from "bcryptjs";
import { User } from "../../models/User.js";


export const resetPassword = async (req , res )=>{
    try{
        const {email,token,newPassword} = req.body;
        const user = await User.findOne({email});

        if (!user || !user.resetPasswordToken || !user.resetPasswordExpires){
             return res.status(400).json({message: "Lien invalide ou expiré."});
        }

         // Vérifier expiration
        if (user.resetPasswordExpires < Date.now()) {
        return res.status(400).json({ message: "Lien expiré." });
        }

            // Vérifier token
        const isMatch = await bcrypt.compare(token, user.resetPasswordToken);
        if (!isMatch) {
        return res.status(400).json({ message: "Lien invalide." });
        }


        // Hacher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;


        // Supprimer token
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;


        await user.save();

        res.json({ message: "Mot de passe réinitialisé avec succès." });
        

    }catch (err){
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });

    }
}