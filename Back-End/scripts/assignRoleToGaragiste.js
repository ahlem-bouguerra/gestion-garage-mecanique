import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { Garagiste } from "../models/Garagiste.js";
import { GaragisteRole } from "../models/GaragisteRole.js";
import { Role } from "../models/Role.js";

// Configuration du chemin pour dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env") });

async function assignRole() {
  try {
    if (!process.env.MONGO_URI) {
      console.error("❌ Erreur: MONGO_URI n'est pas défini");
      process.exit(1);
    }

    const args = process.argv.slice(2);
    if (args.length < 2) {
      console.log("\n📝 Assignation de rôle à un garagiste");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("\n❌ Usage: node scripts/assignRoleToGaragiste.js <email> <roleName>");
      console.log("\n📌 Rôles disponibles: 'Admin Garage', 'Employé Garage', 'Mécanicien'");
      console.log("\n📌 Exemple:");
      console.log("   node scripts/assignRoleToGaragiste.js ahlembouguerra@outlook.fr 'Admin Garage'");
      process.exit(1);
    }

    const email = args[0];
    const roleName = args[1];

    console.log("🔄 Connexion à MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connecté à MongoDB\n");

    // Trouver le garagiste
    const garagiste = await Garagiste.findOne({ email });
    if (!garagiste) {
      console.log(`❌ Garagiste non trouvé: ${email}`);
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log(`👤 Garagiste trouvé: ${garagiste.username} (${garagiste.email})`);

    // Trouver le rôle
    const role = await Role.findOne({ name: roleName });
    if (!role) {
      console.log(`❌ Rôle non trouvé: ${roleName}`);
      console.log(`\n📋 Rôles disponibles:`);
      const allRoles = await Role.find({});
      allRoles.forEach(r => console.log(`   - ${r.name}`));
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log(`🎭 Rôle trouvé: ${role.name}`);

    // Vérifier si une association existe déjà
    let garagisteRole = await GaragisteRole.findOne({ garagisteId: garagiste._id });
    
    if (garagisteRole) {
      garagisteRole.roleId = role._id;
      await garagisteRole.save();
      console.log(`✅ Rôle mis à jour pour le garagiste`);
    } else {
      garagisteRole = await GaragisteRole.create({
        garagisteId: garagiste._id,
        roleId: role._id
      });
      console.log(`✅ Rôle assigné au garagiste`);
    }

    console.log("\n" + "=".repeat(70));
    console.log("📋 RÉSUMÉ:");
    console.log("=".repeat(70));
    console.log(`   Garagiste: ${garagiste.username} (${garagiste.email})`);
    console.log(`   Rôle: ${role.name}`);
    console.log("=".repeat(70));

    await mongoose.disconnect();
    console.log("\n✅ Déconnecté de MongoDB");

  } catch (error) {
    console.error("❌ Erreur:", error.message);
    if (error.stack) {
      console.error("\nStack:", error.stack);
    }
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

assignRole();
