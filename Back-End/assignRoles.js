import mongoose from "mongoose";
import { Client } from "./models/Client.js";
import { Role } from "./models/Role.js";
import { ClientRole } from "./models/ClientRole.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/gestion-de-garage";

async function assignClientRoleToExistingClients() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connecté à MongoDB");
    console.log("📍 Base de données:", mongoose.connection.name);

    // ✅ DIAGNOSTIC COMPLET
    console.log("\n🔍 DIAGNOSTIC:");
    console.log("Collection Role cherche dans:", Role.collection.name);
    
    // Méthode 1: Via le modèle
    const rolesViaModel = await Role.find({});
    console.log(`Via modèle Role: ${rolesViaModel.length} rôles`);
    
    // Méthode 2: Direct dans MongoDB
    const rolesViaMongo = await mongoose.connection.db.collection('roles').find({}).toArray();
    console.log(`Direct MongoDB 'roles': ${rolesViaMongo.length} rôles`);

    console.log("\n📋 Rôles trouvés (MongoDB direct) :");
    rolesViaMongo.forEach(role => {
      console.log(`   - "${role.name}" (ID: ${role._id})`);
    });

    // ✅ UTILISER LES DONNÉES DE MONGODB DIRECTEMENT
    const clientRole = rolesViaMongo.find(role => 
      role.name.toLowerCase().trim().includes('client')
    );

    if (!clientRole) {
      console.error("\n❌ Aucun rôle contenant 'client' trouvé !");
      process.exit(1);
    }

    console.log(`\n✅ Rôle trouvé : "${clientRole.name}" (ID: ${clientRole._id})`);

    // Récupérer tous les clients
    const allClients = await Client.find({});
    console.log(`\n📊 Nombre total de clients : ${allClients.length}`);

    // Récupérer les clients qui ont déjà un rôle
    const clientsWithRoles = await ClientRole.find({}).distinct('clientId');
    console.log(`👥 Clients ayant déjà un rôle : ${clientsWithRoles.length}`);

    // Filtrer les clients sans rôle
    const clientsWithoutRole = allClients.filter(
      client => !clientsWithRoles.some(id => id.equals(client._id))
    );

    console.log(`🔍 Clients SANS rôle : ${clientsWithoutRole.length}`);

    if (clientsWithoutRole.length === 0) {
      console.log("\n✅ Tous les clients ont déjà un rôle !");
      process.exit(0);
    }

    // Attribuer le rôle
    let successCount = 0;
    let errorCount = 0;

    for (const client of clientsWithoutRole) {
      try {
        await ClientRole.create({
          clientId: client._id,
          roleId: clientRole._id  // ✅ Utilise l'ID du rôle trouvé directement
        });
        console.log(`✅ Rôle attribué à : ${client.email}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Erreur pour ${client.email} :`, error.message);
        errorCount++;
      }
    }

    console.log("\n📊 RÉSUMÉ :");
    console.log(`✅ Succès : ${successCount}`);
    console.log(`❌ Erreurs : ${errorCount}`);
    console.log(`📈 Total traité : ${clientsWithoutRole.length}`);

  } catch (error) {
    console.error("❌ Erreur générale :", error);
    console.error("Stack:", error.stack);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Déconnecté de MongoDB");
  }
}

assignClientRoleToExistingClients();