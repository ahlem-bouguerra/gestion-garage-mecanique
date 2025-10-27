import { User } from '../../models/User.js';
import mongoose from 'mongoose';
import axios from 'axios';

// Fonction Haversine pour distance à vol d'oiseau
function calculateStraightDistance(lat1, lng1, lat2, lng2) {
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

// Fonction pour calculer la distance routière avec OSRM
async function calculateDrivingDistance(userLat, userLng, garageLat, garageLng) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${garageLng},${garageLat}?overview=false`;
    
    const response = await axios.get(url, { timeout: 5000 });
    
    if (response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      return {
        distance: route.distance / 1000, // Convertir en km
        duration: Math.round(route.duration / 60) // Convertir en minutes
      };
    }
  } catch (error) {
    console.error('Erreur OSRM:', error.message);
  }
  return null;
}

// Fonction pour formater le temps
function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}min`;
  }
  return `${mins} min`;
}

export const search = async (req, res) => {
  try {
    console.log('=== RECHERCHE DE GARAGES ===');
    console.log('Paramètres:', req.query);

    const { 
      governorate,
      city,
      latitude,
      longitude,
      radius = 100000, // Défaut 100km
      search 
    } = req.query;

    // Construction de la query de base
    let query = {
      garagenom: { $exists: true, $ne: "", $ne: null }
    };

    // Recherche par nom
    if (search && search.trim()) {
      query.garagenom = { 
        $exists: true, 
        $ne: "", 
        $ne: null,
        $regex: search.trim(), 
        $options: 'i' 
      };
    }

    // Filtre par gouvernorat
    if (governorate && governorate.trim()) {
      if (mongoose.Types.ObjectId.isValid(governorate)) {
        query.governorateId = new mongoose.Types.ObjectId(governorate);
      } else {
        query.governorateName = { $regex: governorate.trim(), $options: 'i' };
      }
    }

    // Filtre par ville
    if (city && city.trim()) {
      if (mongoose.Types.ObjectId.isValid(city)) {
        query.cityId = new mongoose.Types.ObjectId(city);
      } else {
        query.cityName = { $regex: city.trim(), $options: 'i' };
      }
    }

    console.log('Query MongoDB:', JSON.stringify(query, null, 2));

    // Récupération des garages
    let garages = await User.find(query)
      .populate('governorateId', 'name')
      .populate('cityId', 'name')
      .select('-password -resetPasswordToken -resetPasswordExpires -googleId')
      .limit(500)
      .lean(); // Utiliser lean() pour de meilleures performances

    console.log(`✅ ${garages.length} garages trouvés dans la base`);

    // Si géolocalisation activée
    if (latitude && longitude) {
      const userLat = parseFloat(latitude);
      const userLng = parseFloat(longitude);
      const maxDistanceKm = parseInt(radius) / 1000;

      console.log(`📍 Filtrage par distance: rayon ${maxDistanceKm}km`);

      // Calcul des distances pour tous les garages
      const garagesWithDistances = [];

      for (const garage of garages) {
        if (!garage.location?.coordinates) {
          console.log(`⚠️ ${garage.garagenom}: pas de coordonnées`);
          continue;
        }

        const [gLng, gLat] = garage.location.coordinates;
        
        // Distance à vol d'oiseau
        const straightDistance = calculateStraightDistance(userLat, userLng, gLat, gLng);
        
        // Filtrer par rayon
        if (straightDistance > maxDistanceKm) {
          console.log(`❌ ${garage.garagenom}: ${straightDistance.toFixed(1)}km (hors rayon)`);
          continue;
        }

        // Ajouter la distance à vol d'oiseau
        garage.distance = straightDistance;

        // Calculer la distance routière pour les garages proches
        if (straightDistance < 100) { // Limite à 100km pour éviter trop d'appels API
          const drivingData = await calculateDrivingDistance(userLat, userLng, gLat, gLng);
          
          if (drivingData) {
            garage.drivingDistance = drivingData.distance;
            garage.estimatedTime = formatDuration(drivingData.duration);
            console.log(`✅ ${garage.garagenom}: ${drivingData.distance.toFixed(1)}km en ${garage.estimatedTime}`);
          } else {
            console.log(`⚠️ ${garage.garagenom}: ${straightDistance.toFixed(1)}km (route non calculée)`);
          }
        }

        garagesWithDistances.push(garage);
      }

      // Trier par distance (privilégier distance routière si disponible)
      garagesWithDistances.sort((a, b) => {
        const distA = a.drivingDistance || a.distance || Infinity;
        const distB = b.drivingDistance || b.distance || Infinity;
        return distA - distB;
      });

      garages = garagesWithDistances;
      console.log(`✅ ${garages.length} garages dans le rayon de ${maxDistanceKm}km`);
    }

    // Formater la réponse
    const formattedGarages = garages.map(garage => ({
      ...garage,
      governorateName: garage.governorateId?.name || garage.governorateName,
      cityName: garage.cityId?.name || garage.cityName,
      // Arrondir les distances pour l'affichage
      distance: garage.distance ? Number(garage.distance.toFixed(1)) : undefined,
      drivingDistance: garage.drivingDistance ? Number(garage.drivingDistance.toFixed(1)) : undefined
    }));

    res.json({
      success: true,
      count: formattedGarages.length,
      garages: formattedGarages,
      searchInfo: {
        hasGeolocation: !!(latitude && longitude),
        radius: parseInt(radius) / 1000,
        filters: {
          governorate: !!governorate,
          city: !!city,
          search: !!search
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur recherche:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};