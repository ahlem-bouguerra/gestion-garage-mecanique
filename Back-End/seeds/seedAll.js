import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function seedAll() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📦 Connexion MongoDB établie\n');

    // Importer et exécuter les seeders
    await import('./seedPermissions.js');
    await import('./seedRoles.js');
    await import('./seedRolePermissions.js');

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

seedAll();