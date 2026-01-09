import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { Garagiste } from "../models/Garagiste.js";
import { Users } from "../models/Users.js";
import { Client } from "../models/Client.js";

// Configuration du chemin pour dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env") });

async function activateAccount() {
  try {
    if (!process.env.MONGO_URI) {
      console.error("❌ Erreur: MONGO_URI n'est pas défini dans le fichier .env");
      process.exit(1);
    }

    // Récupérer l'email depuis les arguments
    const args = process.argv.slice(2);
    if (args.length === 0) {
      console.log("\n📝 Activation d'un compte");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("\n❌ Usage: node scripts/activateAccount.js <email> [type]");
      console.log("   type: 'garagiste' (défaut), 'client', ou 'superadmin'");
      console.log("\n📌 Exemples:");
      console.log("   node scripts/activateAccount.js ahlembouguerra@outlook.fr");
      console.log("   node scripts/activateAccount.js ahlembouguerra@outlook.fr garagiste");
      console.log("   node scripts/activateAccount.js client@example.com client");
      process.exit(1);
    }

    const email = args[0];
    const type = args[1] || 'garagiste';

    console.log("🔄 Connexion à MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connecté à MongoDB\n");
    console.log("=".repeat(70));

    let updated = false;
    let accountInfo = null;

    if (type === 'garagiste' || type === 'garage') {
      const garagiste = await Garagiste.findOne({ email });
      if (!garagiste) {
        console.log(`❌ Aucun garagiste trouvé avec l'email: ${email}`);
        await mongoose.disconnect();
        process.exit(1);
      }

      console.log(`\n👤 Garagiste trouvé: ${garagiste.username}`);
      console.log(`   Email: ${garagiste.email}`);
      console.log(`   Statut actuel: isActive=${garagiste.isActive}, isVerified=${garagiste.isVerified}`);

      if (!garagiste.isActive) {
        garagiste.isActive = true;
        await garagiste.save();
        updated = true;
        console.log(`\n✅ Compte garagiste activé avec succès !`);
      } else {
        console.log(`\nℹ️  Le compte garagiste est déjà actif.`);
      }

      // Activer aussi la vérification si nécessaire
      if (!garagiste.isVerified) {
        garagiste.isVerified = true;
        await garagiste.save();
        console.log(`✅ Compte garagiste vérifié également.`);
      }

      accountInfo = {
        type: 'Garagiste',
        username: garagiste.username,
        email: garagiste.email,
        isActive: garagiste.isActive,
        isVerified: garagiste.isVerified
      };

    } else if (type === 'client') {
      const client = await Client.findOne({ email });
      if (!client) {
        console.log(`❌ Aucun client trouvé avec l'email: ${email}`);
        await mongoose.disconnect();
        process.exit(1);
      }

      console.log(`\n👤 Client trouvé: ${client.username}`);
      console.log(`   Email: ${client.email}`);
      console.log(`   Statut actuel: isVerified=${client.isVerified}`);

      if (!client.isVerified) {
        client.isVerified = true;
        await client.save();
        updated = true;
        console.log(`\n✅ Compte client vérifié avec succès !`);
      } else {
        console.log(`\nℹ️  Le compte client est déjà vérifié.`);
      }

      accountInfo = {
        type: 'Client',
        username: client.username,
        email: client.email,
        isVerified: client.isVerified
      };

    } else if (type === 'superadmin' || type === 'admin') {
      const user = await Users.findOne({ email });
      if (!user) {
        console.log(`❌ Aucun utilisateur SuperAdmin trouvé avec l'email: ${email}`);
        await mongoose.disconnect();
        process.exit(1);
      }

      console.log(`\n👤 SuperAdmin trouvé: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Statut actuel: isSuperAdmin=${user.isSuperAdmin}, isVerified=${user.isVerified}`);

      if (!user.isVerified) {
        user.isVerified = true;
        await user.save();
        updated = true;
        console.log(`\n✅ Compte SuperAdmin vérifié avec succès !`);
      } else {
        console.log(`\nℹ️  Le compte SuperAdmin est déjà vérifié.`);
      }

      if (!user.isSuperAdmin) {
        user.isSuperAdmin = true;
        await user.save();
        console.log(`✅ Compte promu en SuperAdmin.`);
      }

      accountInfo = {
        type: 'SuperAdmin',
        username: user.username,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
        isVerified: user.isVerified
      };
    } else {
      console.log(`❌ Type invalide: ${type}`);
      console.log(`   Types valides: 'garagiste', 'client', 'superadmin'`);
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log("\n" + "=".repeat(70));
    console.log("📋 RÉSUMÉ:");
    console.log("=".repeat(70));
    console.log(`   Type: ${accountInfo.type}`);
    console.log(`   Username: ${accountInfo.username}`);
    console.log(`   Email: ${accountInfo.email}`);
    if (accountInfo.isActive !== undefined) {
      console.log(`   isActive: ${accountInfo.isActive}`);
    }
    if (accountInfo.isSuperAdmin !== undefined) {
      console.log(`   isSuperAdmin: ${accountInfo.isSuperAdmin}`);
    }
    console.log(`   isVerified: ${accountInfo.isVerified}`);
    console.log("=".repeat(70));

    if (updated) {
      console.log("\n🎉 Le compte peut maintenant être utilisé pour se connecter !");
    }

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

// Exécuter le script
activateAccount();
