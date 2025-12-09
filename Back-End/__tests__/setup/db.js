// __tests__/setup/db.js
import mongoose from 'mongoose';

mongoose.set('strictQuery', false);

const getTestUri = () => {
  // 1️⃣ d'abord, on prend MONGO_URI_TEST si défini (env.js ou .env)
  if (process.env.MONGO_URI_TEST) {
    return process.env.MONGO_URI_TEST;
  }

  // 2️⃣ fallback local par défaut
  return 'mongodb://127.0.0.1:27017/garage_app_test';
};

export const connectDB = async () => {
  try {
    const mongoUri = getTestUri();

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Base de données de test connectée sur', mongoUri);
  } catch (error) {
    console.error('❌ Erreur connexion DB test:', error);
    throw error;
  }
};

export const clearDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
};

export const closeDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    console.log('✅ Base de données de test fermée (connexion coupée, données conservées)');
  } catch (error) {
    console.error('❌ Erreur fermeture DB test:', error);
    throw error;
  }
};
