import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { Users } from "../models/Users.js";
import { Garage } from "../models/Garage.js";
import { Client } from "../models/Client.js";

// Configuration du chemin pour dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env") });

async function viewDatabase() {
  try {
    if (!process.env.MONGO_URI) {
      console.error("❌ Erreur: MONGO_URI n'est pas défini dans le fichier .env");
      process.exit(1);
    }

    console.log("🔄 Connexion à MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connecté à MongoDB\n");
    console.log("=".repeat(60));

    // Voir tous les SuperAdmins
    console.log("\n👑 SUPER ADMINS:");
    console.log("-".repeat(60));
    const superAdmins = await Users.find({ isSuperAdmin: true });
    if (superAdmins.length === 0) {
      console.log("  Aucun SuperAdmin trouvé");
    } else {
      superAdmins.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.username}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   📱 Phone: ${user.phone}`);
        console.log(`   ✅ Vérifié: ${user.isVerified ? 'Oui' : 'Non'}`);
        console.log(`   🆔 ID: ${user._id}`);
      });
    }

    // Voir tous les utilisateurs
    console.log("\n\n👥 TOUS LES UTILISATEURS:");
    console.log("-".repeat(60));
    const allUsers = await Users.find();
    console.log(`  Total: ${allUsers.length} utilisateur(s)`);
    allUsers.forEach((user, index) => {
      const role = user.isSuperAdmin ? "👑 SuperAdmin" : "👤 Utilisateur";
      console.log(`  ${index + 1}. ${user.username} (${user.email}) - ${role}`);
    });

    // Voir les garages
    console.log("\n\n🏢 GARAGES:");
    console.log("-".repeat(60));
    const garages = await Garage.find();
    console.log(`  Total: ${garages.length} garage(s)`);
    if (garages.length > 0) {
      garages.slice(0, 5).forEach((garage, index) => {
        console.log(`  ${index + 1}. ${garage.name || 'Sans nom'} (${garage._id})`);
      });
      if (garages.length > 5) {
        console.log(`  ... et ${garages.length - 5} autre(s)`);
      }
    }

    // Voir les clients
    console.log("\n\n👨‍👩‍👧‍👦 CLIENTS:");
    console.log("-".repeat(60));
    const clients = await Client.find();
    console.log(`  Total: ${clients.length} client(s)`);
    if (clients.length > 0) {
      clients.slice(0, 5).forEach((client, index) => {
        console.log(`  ${index + 1}. ${client.nom || 'Sans nom'} ${client.prenom || ''} (${client.email || 'Pas d\'email'})`);
      });
      if (clients.length > 5) {
        console.log(`  ... et ${clients.length - 5} autre(s)`);
      }
    }

    // Statistiques
    console.log("\n\n📊 STATISTIQUES:");
    console.log("-".repeat(60));
    const totalUsers = await Users.countDocuments();
    const totalSuperAdmins = await Users.countDocuments({ isSuperAdmin: true });
    const totalGarages = await Garage.countDocuments();
    const totalClients = await Client.countDocuments();
    
    console.log(`  👥 Utilisateurs: ${totalUsers}`);
    console.log(`  👑 SuperAdmins: ${totalSuperAdmins}`);
    console.log(`  🏢 Garages: ${totalGarages}`);
    console.log(`  👨‍👩‍👧‍👦 Clients: ${totalClients}`);

    console.log("\n" + "=".repeat(60));
    console.log("✅ Affichage terminé\n");

    await mongoose.disconnect();
    console.log("✅ Déconnecté de MongoDB");

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
viewDatabase();
