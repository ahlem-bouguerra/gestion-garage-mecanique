import mongoose from 'mongoose';
import dotenv from 'dotenv';
import seedDatabaseFromAPI from './apiDataFetcher.js';

dotenv.config();

async function runSeed() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');
    
    await seedDatabaseFromAPI();
    
    console.log('🎉 Seed terminé avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur seed:', error);
    process.exit(1);
  }
}

runSeed();
