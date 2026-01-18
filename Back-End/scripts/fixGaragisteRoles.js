import mongoose from "mongoose";
import { GaragisteRole } from "../models/GaragisteRole.js";
import dotenv from "dotenv";

dotenv.config();

async function fixGaragisteRoles() {
  try {
    console.log("🔌 Connexion à MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connecté à MongoDB");

    const roles = await GaragisteRole.find({});
    console.log(`📋 ${roles.length} rôles trouvés`);

    for (const role of roles) {
      console.log(`🔄 Migration du rôle ${role._id}...`);
      
      await GaragisteRole.updateOne(
        { _id: role._id },
        {
          $set: {
            garagisteId: new mongoose.Types.ObjectId(role.garagisteId),
            roleId: new mongoose.Types.ObjectId(role.roleId)
          }
        }
      );
      
      console.log(`  ✅ Rôle ${role._id} migré`);
    }

    console.log("🎉 Migration terminée avec succès");

  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Connexion fermée");
    process.exit(0);
  }
}

fixGaragisteRoles();
