import mongoose from "mongoose";
import { Role } from "../models/Role.js";
import dotenv from "dotenv";

dotenv.config();

const roles = [
  {
    name: "Admin Garage",
    description: "Administrateur principal du garage, accès complet"
  },
  {
    name: "Employé",
    description: "Employé avec accès limité"
  },
  {
    name: "Mécanicien",
    description: "Mécanicien avec accès aux réparations"
  }
];

const seedRoles = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connecté à MongoDB");

    // Vérifier si les rôles existent déjà
    const existingRoles = await Role.find({});
    if (existingRoles.length > 0) {
      console.log("ℹ️ Les rôles existent déjà :", existingRoles.map(r => r.name));
      process.exit(0);
    }

    // Créer les rôles
    const createdRoles = await Role.insertMany(roles);
    console.log("✅ Rôles créés avec succès :");
    createdRoles.forEach(role => {
      console.log(`  - ${role.name} (ID: ${role._id})`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur :", error.message);
    process.exit(1);
  }
};

seedRoles();