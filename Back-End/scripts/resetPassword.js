import mongoose from "mongoose";
import bcrypt from "bcrypt";
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

async function resetPassword() {
  try {
    if (!process.env.MONGO_URI) {
      console.error("❌ Erreur: MONGO_URI n'est pas défini dans le fichier .env");
      process.exit(1);
    }

    // Récupérer les arguments
    const args = process.argv.slice(2);
    if (args.length < 2) {
      console.log("\n📝 Réinitialisation du mot de passe");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("\n❌ Usage: node scripts/resetPassword.js <email> <newPassword> [type]");
      console.log("   type: 'garagiste' (défaut), 'client', ou 'superadmin'");
      console.log("\n📌 Exemples:");
      console.log("   node scripts/resetPassword.js ahlembouguerra@outlook.fr NouveauMotDePasse123!");
      console.log("   node scripts/resetPassword.js client@example.com Password123 client");
      process.exit(1);
    }

    const email = args[0];
    const newPassword = args[1];
    const type = args[2] || 'garagiste';

    console.log("🔄 Connexion à MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connecté à MongoDB\n");
    console.log("=".repeat(70));

    let account = null;
    let accountType = '';

    if (type === 'garagiste' || type === 'garage') {
      account = await Garagiste.findOne({ email });
      accountType = 'Garagiste';
    } else if (type === 'client') {
      account = await Client.findOne({ email });
      accountType = 'Client';
    } else if (type === 'superadmin' || type === 'admin') {
      account = await Users.findOne({ email });
      accountType = 'SuperAdmin';
    } else {
      console.log(`❌ Type invalide: ${type}`);
      console.log(`   Types valides: 'garagiste', 'client', 'superadmin'`);
      await mongoose.disconnect();
      process.exit(1);
    }

    if (!account) {
      console.log(`❌ Aucun compte ${accountType.toLowerCase()} trouvé avec l'email: ${email}`);
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log(`\n👤 ${accountType} trouvé: ${account.username || account.email}`);
    console.log(`   Email: ${account.email}`);
    
    if (accountType === 'Garagiste') {
      console.log(`   isActive: ${account.isActive}`);
      console.log(`   isVerified: ${account.isVerified}`);
    } else {
      console.log(`   isVerified: ${account.isVerified}`);
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    account.password = hashedPassword;
    
    // Activer et vérifier le compte si nécessaire
    if (accountType === 'Garagiste') {
      account.isActive = true;
      account.isVerified = true;
    } else {
      account.isVerified = true;
    }
    
    await account.save();

    console.log("\n✅ Mot de passe réinitialisé avec succès !");
    console.log("✅ Compte activé et vérifié");
    console.log("\n" + "=".repeat(70));
    console.log("📋 NOUVEAUX IDENTIFIANTS:");
    console.log("=".repeat(70));
    console.log(`   📧 Email: ${email}`);
    console.log(`   🔑 Password: ${newPassword}`);
    console.log("=".repeat(70));
    console.log("\n💡 Vous pouvez maintenant vous connecter avec ces identifiants");

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
resetPassword();
