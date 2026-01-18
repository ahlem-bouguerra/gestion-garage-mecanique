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
    name: "Employé Garage",
    description: "Employé avec accès limité"
  },
  {
    name: "Mécanicien",
    description: "Mécanicien avec accès aux réparations"
  },
  {
    name: "Super Admin",
    description: "Administrateur principal de toute l'application, accès complet"
  },
  {
    name: "Client",
    description: "Client du garage"
  }
];

const seedRoles = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connecté à MongoDB");

    let created = 0;
    let updated = 0;

    for (const role of roles) {
      const result = await Role.findOneAndUpdate(
        { name: role.name },   // clé unique
        { $set: role },        // données à créer / mettre à jour
        { upsert: true, new: true }
      );

      if (result) {
        created++; // MongoDB ne dit pas directement créé vs update, on compte logiquement
      }
    }

    console.log(`✅ Seeder terminé : ${roles.length} rôles vérifiés / créés`);

    // Affichage final
    const allRoles = await Role.find({});
    console.log("📋 Rôles en base :");
    allRoles.forEach(r => console.log(`  - ${r.name}`));

    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur :", error);
    process.exit(1);
  }
};

seedRoles();
