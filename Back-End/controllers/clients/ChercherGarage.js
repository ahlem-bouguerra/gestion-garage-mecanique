import { User } from '../../models/User.js';
import mongoose from 'mongoose';

export const search = async (req, res) => {
  try {
    console.log('=== DEBUG SEARCH API ===');
    console.log('Paramètres reçus:', req.query);

    const { 
      governorate,
      city,
      latitude,
      longitude,
      radius = 10000,
      search 
    } = req.query;

    // Construction de la query de base
    let query = {
      garagenom: { $exists: true, $ne: "", $ne: null }
    };

    // Recherche par texte (nom de garage)
    if (search && search.trim()) {
      query.garagenom = { 
        $exists: true, 
        $ne: "", 
        $ne: null,
        $regex: search.trim(), 
        $options: 'i' 
      };
    }

    // CORRECTION 1: Vérification et conversion des ObjectIds
    if (governorate && governorate.trim()) {
      if (mongoose.Types.ObjectId.isValid(governorate)) {
        query.governorateId = new mongoose.Types.ObjectId(governorate);
        console.log('Filtre gouvernorat (ObjectId):', governorate);
      } else {
        query.governorateName = { $regex: governorate.trim(), $options: 'i' };
        console.log('Filtre gouvernorat (nom):', governorate);
      }
    }

    if (city && city.trim()) {
      if (mongoose.Types.ObjectId.isValid(city)) {
        query.cityId = new mongoose.Types.ObjectId(city);
        console.log('Filtre ville (ObjectId):', city);
      } else {
        query.cityName = { $regex: city.trim(), $options: 'i' };
        console.log('Filtre ville (nom):', city);
      }
    }

    console.log('Query construite:', JSON.stringify(query, null, 2));

    let garages = [];

    // CORRECTION 2: Séparer la recherche géographique des autres filtres
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const maxDistance = parseInt(radius);

      console.log('Recherche géolocalisée:', { lat, lng, maxDistance });

      // Vérification des coordonnées
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new Error('Coordonnées géographiques invalides');
      }

      try {
        // STRATÉGIE MODIFIÉE: 
        // 1. D'abord chercher tous les garages dans le rayon géographique
        const geoGarages = await User.find({
          garagenom: { $exists: true, $ne: "", $ne: null },
          location: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [lng, lat]
              },
              $maxDistance: maxDistance
            }
          }
        })
        .populate('governorateId', 'name')
        .populate('cityId', 'name')
        .select('-password -resetPasswordToken -resetPasswordExpires -googleId')
        .limit(100);

        console.log(`✅ Recherche géolocalisée trouvée: ${geoGarages.length} garages dans le rayon`);

        // 2. Ensuite filtrer par gouvernorat/ville si spécifiés
        garages = geoGarages.filter(garage => {
          // Filtre gouvernorat
          if (governorate && mongoose.Types.ObjectId.isValid(governorate)) {
            const govMatch = garage.governorateId && 
                           garage.governorateId._id.toString() === governorate;
            if (!govMatch) {
              console.log(`❌ Garage ${garage.garagenom} exclu: gouvernorat ne correspond pas`);
              return false;
            }
          }

          // Filtre ville
          if (city && mongoose.Types.ObjectId.isValid(city)) {
            const cityMatch = garage.cityId && 
                             garage.cityId._id.toString() === city;
            if (!cityMatch) {
              console.log(`❌ Garage ${garage.garagenom} exclu: ville ne correspond pas`);
              return false;
            }
          }

          console.log(`✅ Garage ${garage.garagenom} inclus`);
          return true;
        });

        console.log(`Après filtrage gouvernorat/ville: ${garages.length} garages`);

      } catch (geoError) {
        console.error('❌ Erreur géolocalisation:', geoError.message);
        
        // Fallback: recherche normale puis calcul distance
        console.log('🔄 Fallback: recherche sans géolocalisation');
        
        const allGarages = await User.find(query)
          .populate('governorateId', 'name')
          .populate('cityId', 'name')
          .select('-password -resetPasswordToken -resetPasswordExpires -googleId')
          .limit(200);
        
        garages = allGarages.filter(garage => {
          if (!garage.location?.coordinates || !Array.isArray(garage.location.coordinates)) {
            return false;
          }
          
          const [gLng, gLat] = garage.location.coordinates;
          if (isNaN(gLat) || isNaN(gLng)) {
            return false;
          }
          
          const distance = calculateDistance(lat, lng, gLat, gLng);
          return distance <= (maxDistance / 1000);
        });
      }

    } else {
      // Recherche simple sans géolocalisation
      console.log('Recherche simple sans géolocalisation');
      
      garages = await User.find(query)
        .populate('governorateId', 'name')
        .populate('cityId', 'name')
        .select('-password -resetPasswordToken -resetPasswordExpires -googleId')
        .limit(50);
    }

    console.log('=== RÉSULTATS DÉTAILLÉS ===');
    console.log('Nombre de garages trouvés:', garages.length);
    
    // CORRECTION 3: Debug plus détaillé
    if (garages.length > 0) {
      garages.forEach((garage, index) => {
        console.log(`Garage ${index + 1}:`, {
          id: garage._id.toString(),
          nom: garage.garagenom,
          gouvernorat: {
            id: garage.governorateId?._id?.toString(),
            nom: garage.governorateId?.name
          },
          ville: {
            id: garage.cityId?._id?.toString(),
            nom: garage.cityId?.name
          },
          location: garage.location,
          coordonnées: garage.location?.coordinates
        });
      });
    } else {
      console.log('❌ Aucun garage trouvé - Analyse:');
      console.log('- Gouvernorat recherché:', governorate);
      console.log('- Ville recherchée:', city);
      console.log('- Position utilisateur:', { lat: latitude, lng: longitude });
      console.log('- Rayon:', radius, 'mètres');
      
      // Test: chercher tous les garages du gouvernorat sans géolocalisation
      if (governorate && mongoose.Types.ObjectId.isValid(governorate)) {
        const testGarages = await User.find({
          garagenom: { $exists: true, $ne: "", $ne: null },
          governorateId: new mongoose.Types.ObjectId(governorate)
        }).populate('governorateId', 'name').limit(10);
        
        console.log(`🧪 Test: ${testGarages.length} garages dans ce gouvernorat (sans géo)`);
        if (testGarages.length > 0) {
          console.log('Premier garage du gouvernorat:', {
            nom: testGarages[0].garagenom,
            coordonnées: testGarages[0].location?.coordinates,
            gouvernorat: testGarages[0].governorateId?.name
          });
        }
      }
    }

    // Nettoyer la réponse
    const cleanedGarages = garages.map(garage => {
      const garageObj = garage.toObject ? garage.toObject() : garage;
      return {
        ...garageObj,
        governorateName: garage.governorateId?.name || garageObj.governorateName,
        cityName: garage.cityId?.name || garageObj.cityName
      };
    });

    res.json({
      success: true,
      count: cleanedGarages.length,
      garages: cleanedGarages,
      debug: process.env.NODE_ENV === 'development' ? {
        queryUsed: query,
        searchParams: { governorate, city, latitude, longitude, radius, search }
      } : undefined
    });

  } catch (error) {
    console.error('❌ ERREUR dans search:', error);
    console.error('Stack trace:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : 'Erreur interne du serveur'
    });
  }
};

// Fonction utilitaire pour calculer la distance (formule de Haversine)
function calculateDistance(lat1, lng1, lat2, lng2) {
  try {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance en km
  } catch (error) {
    console.error('Erreur calcul distance:', error);
    return Infinity;
  }
}