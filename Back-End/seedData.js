import mongoose from "mongoose";
import dotenv from "dotenv";
import { initializeDefaultData } from './utils/initializeData.js';

dotenv.config();

const runSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connecté pour le seeding");
    
    await initializeDefaultData();
    
    console.log("✅ Seeding terminé avec succès");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors du seeding:", error);
    process.exit(1);
  }
};

runSeed();


//fait just cette commmande: npm run seed   , et data sera dans la base (garage ,garagite,services,garageService)