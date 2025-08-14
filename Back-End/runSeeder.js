// runSeeder.js - Fichier pour exécuter le seeding
import mongoose from "mongoose";
import seedDatabaseFromAPI from "./apiDataFetcher.js";

async function main() {
  try {
    console.log("🔌 Connexion à MongoDB...");
    
    // Remplacez par votre URL MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gestion-de-garage';
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log("✅ Connecté à MongoDB");

    // Exécuter le seeding
    await seedDatabaseFromAPI();

    console.log("🎉 Seeding terminé avec succès!");
    
  } catch (error) {
    console.error("❌ Erreur lors du seeding:", error);
    process.exit(1);
  } finally {
    // Fermer la connexion
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log("🔐 Connexion MongoDB fermée");
    }
    process.exit(0);
  }
}

// Exécuter le script
main();