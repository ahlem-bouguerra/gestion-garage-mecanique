import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Configuration du chemin pour dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env") });

async function runScript(scriptPath, scriptName) {
  try {
    console.log(`\n🔄 Exécution de ${scriptName}...`);
    console.log("-".repeat(70));
    
    const { stdout, stderr } = await execAsync(`node ${scriptPath}`, {
      cwd: join(__dirname, ".."),
      env: { ...process.env, MONGO_URI: process.env.MONGO_URI }
    });
    
    if (stdout) console.log(stdout);
    if (stderr && !stderr.includes('warning')) console.error(stderr);
    
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors de l'exécution de ${scriptName}:`, error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    return false;
  }
}

async function migrateAll() {
  try {
    if (!process.env.MONGO_URI) {
      console.error("❌ Erreur: MONGO_URI n'est pas défini dans le fichier .env");
      process.exit(1);
    }

    console.log("=".repeat(70));
    console.log("🚀 MIGRATION COMPLÈTE DE TOUTES LES TABLES");
    console.log("=".repeat(70));
    console.log(`📡 Connexion: ${process.env.MONGO_URI.replace(/:[^:@]+@/, ':****@')}`);

    // Test de connexion
    console.log("\n🔄 Test de connexion à MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connecté à MongoDB");
    await mongoose.disconnect();

    const scripts = [
      {
        path: "seeds/seedRoles.js",
        name: "1️⃣ Seed des Rôles",
        description: "Création des rôles de base (Super Admin, Admin Garage, Employé, Mécanicien)"
      },
      {
        path: "seeds/seedPermissions.js",
        name: "2️⃣ Seed des Permissions",
        description: "Création de toutes les permissions du système"
      },
      {
        path: "seeds/seedRolePermissions.js",
        name: "3️⃣ Seed des Associations Rôle-Permissions",
        description: "Association des permissions aux rôles"
      },
      {
        path: "seeds/import-data.js",
        name: "4️⃣ Import des Données",
        description: "Import de toutes les données depuis les fichiers JSON"
      },
      {
        path: "migrations/migrateRoles.js",
        name: "5️⃣ Migration des Rôles Garagistes",
        description: "Migration des rôles des garagistes existants"
      }
    ];

    const results = [];
    
    for (const script of scripts) {
      console.log(`\n${script.name}`);
      console.log(`   ${script.description}`);
      
      const success = await runScript(script.path, script.name);
      results.push({ script: script.name, success });
      
      if (!success) {
        console.log(`\n⚠️  ${script.name} a échoué, mais on continue...`);
      }
      
      // Petite pause entre les scripts
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Résumé final
    console.log("\n" + "=".repeat(70));
    console.log("📊 RÉSUMÉ DE LA MIGRATION");
    console.log("=".repeat(70));
    
    results.forEach((result, index) => {
      const status = result.success ? "✅" : "❌";
      console.log(`${status} ${result.script}`);
    });
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    console.log("\n" + "-".repeat(70));
    console.log(`📈 ${successCount}/${totalCount} script(s) exécuté(s) avec succès`);
    
    if (successCount === totalCount) {
      console.log("\n🎉 Migration complète terminée avec succès !");
    } else {
      console.log(`\n⚠️  Migration terminée avec ${totalCount - successCount} erreur(s)`);
    }

    // Vérification finale des collections
    console.log("\n" + "=".repeat(70));
    console.log("🔍 VÉRIFICATION FINALE DES COLLECTIONS");
    console.log("=".repeat(70));
    
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name).sort();
    
    console.log(`\n📦 Collections créées: ${collectionNames.length}`);
    collectionNames.forEach((name, index) => {
      console.log(`   ${(index + 1).toString().padStart(2, ' ')}. ${name}`);
    });
    
    await mongoose.disconnect();
    console.log("\n✅ Déconnecté de MongoDB");
    console.log("=".repeat(70));

  } catch (error) {
    console.error("\n❌ Erreur fatale:", error.message);
    if (error.stack) {
      console.error("\nStack:", error.stack);
    }
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

// Exécuter la migration complète
migrateAll();
