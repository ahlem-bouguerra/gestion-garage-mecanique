import { User } from '../models/User.js';

export const search = async (req, res) => {
  try {
    const { 
      governorate, 
      city, 
      latitude, 
      longitude, 
      radius = 10000,
      search 
    } = req.query;

    let query = {};
    
    // Recherche par texte (nom de garage)
    if (search) {
      query.garagenom = { $regex: search, $options: 'i' };
    }

    // ✅ CORRECTION: Recherche flexible par gouvernorat (ObjectId OU nom)
    if (governorate) {
      // Vérifier si c'est un ObjectId valide ou un nom
      if (governorate.match(/^[0-9a-fA-F]{24}$/)) {
        query.governorateId = governorate; // ObjectId
      } else {
        query.governorateName = { $regex: governorate, $options: 'i' }; // Nom
      }
    }

    // ✅ CORRECTION: Recherche flexible par ville (ObjectId OU nom)
    if (city) {
      if (city.match(/^[0-9a-fA-F]{24}$/)) {
        query.cityId = city; // ObjectId
      } else {
        query.cityName = { $regex: city, $options: 'i' }; // Nom
      }
    }

    let garages;

    if (latitude && longitude) {
      garages = await User.find({
        ...query,
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            $maxDistance: parseInt(radius)
          }
        }
      })
      .populate('governorateId', 'name')
      .populate('cityId', 'name')
      .select('-password -resetPasswordToken -resetPasswordExpires -googleId')
      .limit(50);
    } else {
      garages = await User.find(query)
        .populate('governorateId', 'name')
        .populate('cityId', 'name')
        .select('-password -resetPasswordToken -resetPasswordExpires -googleId')
        .limit(50);
    }

    // ✅ OPTIONNEL: Nettoyer la réponse pour inclure les noms
    const cleanedGarages = garages.map(garage => ({
      ...garage.toObject(),
      // S'assurer que les noms sont disponibles même si populate échoue
      governorateName: garage.governorateId?.name || garage.governorateName,
      cityName: garage.cityId?.name || garage.cityName
    }));

    res.json({
      success: true,
      count: cleanedGarages.length,
      garages: cleanedGarages
    });

  } catch (error) {
    console.error('Erreur recherche garages:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche'
    });
  }
};