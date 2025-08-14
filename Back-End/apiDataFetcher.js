// apiDataFetcher.js - Utiliser l'API Tunisienne pour remplir la base
import mongoose from "mongoose";
import Governorate from "./models/Governorate.js";
import City from "./models/City.js";
import Street from "./models/Street.js";

const TUNISIA_API_URL = "https://tn-municipality-api.vercel.app/api/municipalities";

async function fetchTunisianData() {
  try {
    console.log("📡 Récupération des données depuis l'API tunisienne...");
    
    const response = await fetch(TUNISIA_API_URL);
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ ${data.length} gouvernorats récupérés`);
    
    return data;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des données:", error);
    throw error;
  }
}

async function seedDatabaseFromAPI() {
  try {
    console.log("🌱 Début du peuplement via API...");

    // Vider les collections existantes
    await Governorate.deleteMany({});
    await City.deleteMany({});
    await Street.deleteMany({});
    console.log("🗑️ Collections vidées");

    // Récupérer les données de l'API
    const apiData = await fetchTunisianData();

    let totalCities = 0;

    // Traiter chaque gouvernorat
    for (const govData of apiData) {
      // Créer le gouvernorat
      const governorate = new Governorate({ 
        name: govData.Name,
        nameAr: govData.NameAr // Nom en arabe si besoin
      });
      await governorate.save();
      console.log(`✅ Gouvernorat créé: ${govData.Name} (${govData.NameAr})`);

      // Créer les villes/délégations
      for (const delegation of govData.Delegations || []) {
        const city = new City({
          name: delegation.Name,
          nameAr: delegation.NameAr,
          governorateId: governorate._id,
          postalCode: delegation.PostalCode,
          // Coordonnées GPS pour la géolocalisation
          location: {
            type: 'Point',
            coordinates: [delegation.Longitude, delegation.Latitude]
          }
        });
        await city.save();
        console.log(`   🏙️ Ville créée: ${delegation.Name}`);
        totalCities++;
      }
    }

    console.log("🎉 Peuplement terminé avec succès!");
    console.log(`📊 ${apiData.length} gouvernorats créés`);
    console.log(`📊 ${totalCities} villes créées`);

  } catch (error) {
    console.error("❌ Erreur lors du peuplement:", error);
  }
}

// Modèles mis à jour pour supporter les données enrichies
export const EnhancedCitySchema = new mongoose.Schema({
  name: String,
  nameAr: String, // Nom en arabe
  governorateId: mongoose.Schema.Types.ObjectId,
  postalCode: String,
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: undefined
    }
  }
});

export const EnhancedGovernorateSchema = new mongoose.Schema({
  name: String,
  nameAr: String // Nom en arabe
});

// Routes API améliorées
export const enhancedLocationRoutes = {
  // Récupérer tous les gouvernorats avec comptage des villes
  async getAllGovernoratesWithCount(req, res) {
    try {
      const governorates = await Governorate.aggregate([
        {
          $lookup: {
            from: 'cities',
            localField: '_id',
            foreignField: 'governorateId',
            as: 'cities'
          }
        },
        {
          $project: {
            name: 1,
            nameAr: 1,
            cityCount: { $size: '$cities' }
          }
        },
        { $sort: { name: 1 } }
      ]);
      
      res.json(governorates);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Recherche intelligente par nom (français ou arabe)
  async searchLocations(req, res) {
    try {
      const { query } = req.params;
      
      const searchRegex = new RegExp(query, 'i');
      
      // Rechercher dans gouvernorats et villes
      const [governorates, cities] = await Promise.all([
        Governorate.find({
          $or: [
            { name: searchRegex },
            { nameAr: searchRegex }
          ]
        }),
        City.find({
          $or: [
            { name: searchRegex },
            { nameAr: searchRegex }
          ]
        }).populate('governorateId', 'name nameAr')
      ]);

      res.json({
        governorates,
        cities
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Récupérer villes avec coordonnées pour la carte
  async getCitiesWithCoordinates(req, res) {
    try {
      const { governorateId } = req.params;
      
      const cities = await City.find({ 
        governorateId,
        'location.coordinates': { $exists: true, $ne: [] }
      })
      .populate('governorateId', 'name nameAr')
      .sort({ name: 1 });
      
      res.json(cities);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Auto-complétion pour le frontend
  async autocomplete(req, res) {
    try {
      const { term, type = 'all' } = req.query;
      const searchRegex = new RegExp(term, 'i');
      
      let results = [];
      
      if (type === 'all' || type === 'governorate') {
        const governorates = await Governorate.find({
          $or: [{ name: searchRegex }, { nameAr: searchRegex }]
        }).limit(5);
        
        results.push(...governorates.map(g => ({
          type: 'governorate',
          id: g._id,
          name: g.name,
          nameAr: g.nameAr
        })));
      }
      
      if (type === 'all' || type === 'city') {
        const cities = await City.find({
          $or: [{ name: searchRegex }, { nameAr: searchRegex }]
        })
        .populate('governorateId', 'name')
        .limit(10);
        
        results.push(...cities.map(c => ({
          type: 'city',
          id: c._id,
          name: c.name,
          nameAr: c.nameAr,
          governorate: c.governorateId.name
        })));
      }
      
      res.json(results.slice(0, 15)); // Limiter à 15 résultats
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

// Fonction d'initialisation complète
export async function initializeLocationDatabase() {
  try {
    console.log("🚀 Initialisation de la base de données de localisation...");
    
    // Vérifier si les données existent déjà
    const existingGovernorates = await Governorate.countDocuments();
    
    if (existingGovernorates > 0) {
      console.log("ℹ️ Données déjà présentes, mise à jour...");
      // Optionnel: logique de mise à jour
    } else {
      await seedDatabaseFromAPI();
    }
    
    // Créer les index pour les performances
    await Governorate.collection.createIndex({ name: 1 });
    await Governorate.collection.createIndex({ nameAr: 1 });
    await City.collection.createIndex({ name: 1 });
    await City.collection.createIndex({ nameAr: 1 });
    await City.collection.createIndex({ governorateId: 1 });
    await City.collection.createIndex({ location: '2dsphere' });
    
    console.log("📊 Index créés pour optimiser les performances");
    
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation:", error);
    throw error;
  }
}

export default seedDatabaseFromAPI;