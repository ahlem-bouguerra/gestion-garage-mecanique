


// ════════════════════════════════════════════════════════════════════════
// Script de Migration : Convertir tous les String IDs en ObjectId
// Fichier : scripts/migrateToObjectId.js
// ════════════════════════════════════════════════════════════════════════

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Configuration MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/garage';

async function migrateIdsToObjectId() {
  try {
    console.log('🚀 Démarrage de la migration...\n');
    
    // Connexion à MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB\n');

    const db = mongoose.connection.db;
    const ficheClientsCollection = db.collection('ficheclients');

    // ═══════════════════════════════════════════════════════════════
    // ÉTAPE 1 : Vérifier les données avant migration
    // ═══════════════════════════════════════════════════════════════
    
    console.log('📊 ANALYSE DES DONNÉES :');
    console.log('═'.repeat(50));
    
    const totalClients = await ficheClientsCollection.countDocuments();
    console.log(`Total clients : ${totalClients}`);
    
    // Compter les clients avec _id en String
    const clientsWithStringId = await ficheClientsCollection.countDocuments({
      _id: { $type: 'string' }
    });
    console.log(`Clients avec _id String : ${clientsWithStringId}`);
    
    // Compter les clients avec garageId en String
    const clientsWithStringGarageId = await ficheClientsCollection.countDocuments({
      garageId: { $type: 'string' }
    });
    console.log(`Clients avec garageId String : ${clientsWithStringGarageId}`);
    
    // Compter les clients avec clientId en String (si existe)
    const clientsWithStringClientId = await ficheClientsCollection.countDocuments({
      clientId: { $type: 'string', $exists: true }
    });
    console.log(`Clients avec clientId String : ${clientsWithStringClientId}\n`);

    if (clientsWithStringId === 0 && clientsWithStringGarageId === 0 && clientsWithStringClientId === 0) {
      console.log('✨ Aucune migration nécessaire ! Toutes les IDs sont déjà en ObjectId.');
      await mongoose.connection.close();
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // ÉTAPE 2 : Migration des données
    // ═══════════════════════════════════════════════════════════════
    
    console.log('🔄 MIGRATION EN COURS :');
    console.log('═'.repeat(50));

    let migratedCount = 0;
    let errorCount = 0;

    // Récupérer tous les clients
    const allClients = await ficheClientsCollection.find({}).toArray();

    for (const client of allClients) {
      try {
        const updates = {};
        let needsUpdate = false;

        // Convertir _id si c'est un String
        if (typeof client._id === 'string' && mongoose.Types.ObjectId.isValid(client._id)) {
          const newObjectId = new mongoose.Types.ObjectId(client._id);
          
          // Insérer avec le nouvel _id
          const newClient = { ...client, _id: newObjectId };
          
          // Convertir garageId si nécessaire
          if (typeof newClient.garageId === 'string' && mongoose.Types.ObjectId.isValid(newClient.garageId)) {
            newClient.garageId = new mongoose.Types.ObjectId(newClient.garageId);
          }
          
          // Convertir clientId si nécessaire
          if (newClient.clientId && typeof newClient.clientId === 'string' && mongoose.Types.ObjectId.isValid(newClient.clientId)) {
            newClient.clientId = new mongoose.Types.ObjectId(newClient.clientId);
          }
          
          // Supprimer l'ancien document
          await ficheClientsCollection.deleteOne({ _id: client._id });
          
          // Insérer le nouveau document
          await ficheClientsCollection.insertOne(newClient);
          
          console.log(`✅ Migré client : ${client._id} → ${newObjectId}`);
          migratedCount++;
          continue;
        }

        // Si _id est déjà ObjectId, vérifier seulement garageId et clientId
        
        // Convertir garageId
        if (typeof client.garageId === 'string' && mongoose.Types.ObjectId.isValid(client.garageId)) {
          updates.garageId = new mongoose.Types.ObjectId(client.garageId);
          needsUpdate = true;
        }

        // Convertir clientId
        if (client.clientId && typeof client.clientId === 'string' && mongoose.Types.ObjectId.isValid(client.clientId)) {
          updates.clientId = new mongoose.Types.ObjectId(client.clientId);
          needsUpdate = true;
        }

        // Appliquer les mises à jour si nécessaire
        if (needsUpdate) {
          await ficheClientsCollection.updateOne(
            { _id: client._id },
            { $set: updates }
          );
          console.log(`✅ Mis à jour : ${client._id}`);
          migratedCount++;
        }

      } catch (error) {
        console.error(`❌ Erreur pour client ${client._id}:`, error.message);
        errorCount++;
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // ÉTAPE 3 : Vérification post-migration
    // ═══════════════════════════════════════════════════════════════
    
    console.log('\n📊 VÉRIFICATION POST-MIGRATION :');
    console.log('═'.repeat(50));
    
    const finalStringIds = await ficheClientsCollection.countDocuments({
      _id: { $type: 'string' }
    });
    const finalStringGarageIds = await ficheClientsCollection.countDocuments({
      garageId: { $type: 'string' }
    });
    const finalStringClientIds = await ficheClientsCollection.countDocuments({
      clientId: { $type: 'string', $exists: true }
    });
    
    console.log(`_id restant en String : ${finalStringIds}`);
    console.log(`garageId restant en String : ${finalStringGarageIds}`);
    console.log(`clientId restant en String : ${finalStringClientIds}`);

    // ═══════════════════════════════════════════════════════════════
    // RÉSUMÉ
    // ═══════════════════════════════════════════════════════════════
    
    console.log('\n🎉 RÉSUMÉ DE LA MIGRATION :');
    console.log('═'.repeat(50));
    console.log(`✅ Documents migrés : ${migratedCount}`);
    console.log(`❌ Erreurs : ${errorCount}`);
    console.log(`📦 Total documents : ${totalClients}`);
    
    if (finalStringIds === 0 && finalStringGarageIds === 0 && finalStringClientIds === 0) {
      console.log('\n🎊 Migration réussie ! Tous les IDs sont maintenant en ObjectId.');
    } else {
      console.log('\n⚠️ Attention : Il reste des IDs en String à vérifier manuellement.');
    }

    await mongoose.connection.close();
    console.log('\n✅ Connexion MongoDB fermée.');
    
  } catch (error) {
    console.error('\n❌ ERREUR CRITIQUE :', error);
    process.exit(1);
  }
}

// Exécuter la migration
migrateIdsToObjectId();
