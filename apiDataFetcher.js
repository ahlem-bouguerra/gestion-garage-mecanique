// apiDataFetcher.js - Version corrigée avec ObjectI
// apiDataFetcher.js - Version corrigée avec ObjectId
import mongoose from "mongoose";
import Governorate from "./models/Governorate.js";
import City from "./models/City.js";

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
    console.log("🗑️ Collections vidées");

    // Récupérer les données de l'API
    const apiData = await fetchTunisianData();

    let totalCities = 0;

    // Traiter chaque gouvernorat
    for (const govData of apiData) {
      // ✅ Créer le gouvernorat avec new (génère automatiquement un ObjectId)
      const governorate = new Governorate({ 
        name: govData.Name,
        nameAr: govData.NameAr
      });
      await governorate.save();
      
      console.log(`✅ Gouvernorat créé: ${govData.Name} - ID: ${governorate._id}`);

      // Créer les villes/délégations
      for (const delegation of govData.Delegations || []) {
        // ✅ Vérifier que les coordonnées existent
        const hasCoordinates = 
          delegation.Longitude !== undefined && 
          delegation.Latitude !== undefined &&
          !isNaN(delegation.Longitude) &&
          !isNaN(delegation.Latitude);

        const cityData = {
          name: delegation.Name,
          nameAr: delegation.NameAr,
          governorateId: governorate._id, // ✅ Déjà un ObjectId
          postalCode: delegation.PostalCode
        };

        // Ajouter les coordonnées seulement si elles existent
        if (hasCoordinates) {
          cityData.location = {
            type: 'Point',
            coordinates: [
              parseFloat(delegation.Longitude), 
              parseFloat(delegation.Latitude)
            ]
          };
        }

        const city = new City(cityData);
        await city.save();
        
        console.log(`   🏙️ Ville créée: ${delegation.Name} - ID: ${city._id}`);
        totalCities++;
      }
    }

    console.log("🎉 Peuplement terminé avec succès!");
    console.log(`📊 ${apiData.length} gouvernorats créés`);
    console.log(`📊 ${totalCities} villes créées`);

  } catch (error) {
    console.error("❌ Erreur lors du peuplement:", error);
    throw error;
  }
}

// ✅ Fonction d'initialisation complète
async function initializeLocationDatabase() {
  try {
    console.log("🚀 Initialisation de la base de données de localisation...");
    
    // Vérifier si les données existent déjà
    const existingGovernorates = await Governorate.countDocuments();
    
    if (existingGovernorates > 0) {
      console.log("⚠️ Données déjà présentes. Voulez-vous les supprimer et refaire le seed?");
      console.log("💡 Pour forcer le re-seed, appelez seedDatabaseFromAPI() directement");
      return;
    }
    
    await seedDatabaseFromAPI();
    
    // Créer les index pour les performances
    console.log("📊 Création des index...");
    
    await Governorate.collection.createIndex({ name: 1 });
    await Governorate.collection.createIndex({ nameAr: 1 });
    await City.collection.createIndex({ name: 1 });
    await City.collection.createIndex({ nameAr: 1 });
    await City.collection.createIndex({ governorateId: 1 });
    await City.collection.createIndex({ location: '2dsphere' });
    
    console.log("✅ Index créés pour optimiser les performances");
    
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation:", error);
    throw error;
  }
}

// ✅ Route améliorée pour récupérer les villes
async function getCitiesByGovernorate(governorateId) {
  try {
    // Vérifier que l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(governorateId)) {
      throw new Error("ID de gouvernorat invalide");
    }

    const cities = await City.find({ 
      governorateId: new mongoose.Types.ObjectId(governorateId)
    })
    .populate('governorateId', 'name nameAr')
    .sort({ name: 1 });

    return cities;
  } catch (error) {
    console.error("❌ Erreur getCitiesByGovernorate:", error);
    throw error;
  }
}

// ✅ Routes API améliorées - DÉCLARATION AVANT L'EXPORT
const enhancedLocationRoutes = {
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

// ✅ EXPORTS - Tous ensemble à la fin
export { 
  enhancedLocationRoutes,
  initializeLocationDatabase,
  getCitiesByGovernorate
};

export default seedDatabaseFromAPI;
