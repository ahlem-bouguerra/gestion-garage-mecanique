import mongoose from "mongoose";
import { Garagiste } from "../models/Garagiste.js";
import { Role } from "../models/Role.js";
import { GaragisteRole } from "../models/GaragisteRole.js";
import dotenv from "dotenv";

dotenv.config();

const migrateRoles = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connecté à MongoDB");

    // 📊 Statistiques
    const stats = {
      total: 0,
      migrated: 0,
      skipped: 0,
      errors: 0
    };

    // Récupérer tous les garagistes
    const garagistes = await Garagiste.find({});
    stats.total = garagistes.length;
    
    console.log(`📊 ${garagistes.length} garagistes trouvés en base`);
    console.log("🔄 Début de la migration...\n");

    for (const garagiste of garagistes) {
      try {
        // Déterminer le nom du rôle basé sur l'ancien champ
        let roleName;
        
        // Si le garagiste a un champ 'role' (ancien système)
        if (garagiste.role) {
          switch (garagiste.role) {
            case 'admin':
              roleName = "Admin Garage";
              break;
            case 'employee':
              roleName = "Employé";
              break;
            case 'mechanic':
              roleName = "Mécanicien";
              break;
            default:
              console.warn(`⚠️ Rôle inconnu "${garagiste.role}" pour ${garagiste.email}, assignation par défaut : Employé`);
              roleName = "Employé";
          }
        } else {
          // Si pas de rôle défini, on assigne "Employé" par défaut
          console.warn(`⚠️ Pas de rôle défini pour ${garagiste.email}, assignation par défaut : Employé`);
          roleName = "Employé";
        }

        // Récupérer le rôle correspondant
        const role = await Role.findOne({ name: roleName });
        if (!role) {
          console.error(`❌ Rôle '${roleName}' introuvable en base !`);
          stats.errors++;
          continue;
        }

        // Vérifier si l'association existe déjà
        const existing = await GaragisteRole.findOne({
          garagisteId: garagiste._id,
          roleId: role._id
        });

        if (existing) {
          console.log(`⏭️ ${garagiste.email} déjà migré (${roleName})`);
          stats.skipped++;
          continue;
        }

        // Créer l'association
        await GaragisteRole.create({
          garagisteId: garagiste._id,
          roleId: role._id
        });

        console.log(`✅ ${garagiste.email} → ${roleName}`);
        stats.migrated++;

      } catch (error) {
        console.error(`❌ Erreur pour ${garagiste.email}:`, error.message);
        stats.errors++;
      }
    }

    // Afficher le résumé
    console.log("\n" + "=".repeat(50));
    console.log("📊 RÉSUMÉ DE LA MIGRATION");
    console.log("=".repeat(50));
    console.log(`Total de garagistes    : ${stats.total}`);
    console.log(`✅ Migrés avec succès  : ${stats.migrated}`);
    console.log(`⏭️ Déjà migrés         : ${stats.skipped}`);
    console.log(`❌ Erreurs             : ${stats.errors}`);
    console.log("=".repeat(50));

    if (stats.errors === 0) {
      console.log("\n🎉 Migration terminée avec succès !");
    } else {
      console.log("\n⚠️ Migration terminée avec des erreurs. Vérifiez les logs ci-dessus.");
    }

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error("❌ Erreur fatale :", error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
};

migrateRoles();