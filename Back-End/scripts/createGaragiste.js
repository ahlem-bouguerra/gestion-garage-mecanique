import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { Garagiste } from "../models/Garagiste.js";
import { Garage } from "../models/Garage.js";
import { GaragisteRole } from "../models/GaragisteRole.js";
import { Role } from "../models/Role.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env") });

async function createGaragiste() {
  try {
    if (!process.env.MONGO_URI) {
      console.error("❌ Erreur: MONGO_URI n'est pas défini");
      process.exit(1);
    }

    const args = process.argv.slice(2);
    if (args.length < 4) {
      console.log("\n📝 Création d'un compte garagiste avec garage");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("\n❌ Usage: node scripts/createGaragiste.js <username> <email> <password> <phone> [garageName]");
      console.log("\n📌 Exemple:");
      console.log("   node scripts/createGaragiste.js admin admin@garage.com password123 20123456 'Mon Garage'");
      process.exit(1);
    }

    const username = args[0];
    const email = args[1];
    const password = args[2];
    const phone = args[3];
    const garageName = args[4] || `Garage de ${username}`;

    console.log("🔄 Connexion à MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connecté à MongoDB\n");

    // Vérifier si le garagiste existe déjà
    const existingGaragiste = await Garagiste.findOne({ email });
    if (existingGaragiste) {
      console.log(`❌ Un garagiste avec l'email ${email} existe déjà`);
      await mongoose.disconnect();
      process.exit(1);
    }

    // Créer le garage
    const garage = await Garage.create({
      nom: garageName,
      matriculeFiscal: `MF${Date.now()}`,
      emailProfessionnel: email,
      telephoneProfessionnel: phone,
      isActive: true
    });
    console.log(`✅ Garage créé: ${garage.nom} (${garage._id})`);

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer le garagiste
    const garagiste = await Garagiste.create({
      username,
      email,
      password: hashedPassword,
      phone,
      garage: garage._id,
      isVerified: true,
      isActive: true
    });
    console.log(`✅ Garagiste créé: ${garagiste.username} (${garagiste.email})`);

    // Ajouter le garagiste aux admins du garage
    garage.garagisteAdmins = [garagiste._id];
    await garage.save();

    // Trouver le rôle "Admin Garage"
    const role = await Role.findOne({ name: "Admin Garage" });
    if (!role) {
      console.log("⚠️ Rôle 'Admin Garage' non trouvé, création du rôle...");
      const newRole = await Role.create({
        name: "Admin Garage",
        description: "Administrateur du garage"
      });
      await GaragisteRole.create({
        garagisteId: garagiste._id,
        roleId: newRole._id
      });
      console.log(`✅ Rôle 'Admin Garage' créé et assigné`);
    } else {
      await GaragisteRole.create({
        garagisteId: garagiste._id,
        roleId: role._id
      });
      console.log(`✅ Rôle 'Admin Garage' assigné`);
    }

    console.log("\n" + "=".repeat(70));
    console.log("📋 COMPTE CRÉÉ AVEC SUCCÈS:");
    console.log("=".repeat(70));
    console.log(`   👤 Username: ${username}`);
    console.log(`   📧 Email: ${email}`);
    console.log(`   📱 Phone: ${phone}`);
    console.log(`   🏢 Garage: ${garageName} (${garage._id})`);
    console.log(`   🎭 Rôle: Admin Garage`);
    console.log(`   ✅ Statut: Actif et vérifié`);
    console.log("=".repeat(70));
    console.log("\n🔑 Vous pouvez maintenant vous connecter avec:");
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);

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

createGaragiste();
