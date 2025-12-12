
import { Client } from '../../models/Client.js';
import Vehicule from '../../models/Vehicule.js';
import CarnetEntretien from '../../models/CarnetEntretien.js';

// Récupérer tous les clients
export const getAllClients = async (req, res) => {
  try {
    const clients = await Client.find({}).select('-password');
    
    res.status(200).json({
      success: true,
      count: clients.length,
      data: clients
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des clients',
      error: error.message
    });
  }
};

// Récupérer les clients avec pagination
export const getClientsPaginated = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const clients = await Client.find({})
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Client.countDocuments();

    res.status(200).json({
      success: true,
      data: clients,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalClients: total,
        limit: limit
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des clients',
      error: error.message
    });
  }
};


export const searchClients = async (req, res) => {
  try {
    const { query, isVerified, sort } = req.query; // ← Utiliser 'query' au lieu de username, email, phone
    let filter = {};
    
    // Si query est fourni, chercher dans username, email ET phone
    if (query) {
      filter.$or = [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } }
      ];
    }
    
    if (isVerified !== undefined) {
      filter.isVerified = isVerified === 'true';
    }
    
    let sortOption = { createdAt: -1 };
    if (sort === 'username') sortOption = { username: 1 };
    if (sort === 'email') sortOption = { email: 1 };
    
    const clients = await Client.find(filter)
      .select('-password')
      .sort(sortOption);
      
    res.status(200).json({
      success: true,
      count: clients.length,
      data: clients
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche',
      error: error.message
    });
  }
};

// Obtenir les statistiques
export const getClientsStats = async (req, res) => {
  try {
    const totalClients = await Client.countDocuments();
    const verifiedClients = await Client.countDocuments({ isVerified: true });
    const NotverifiedClients = await Client.countDocuments({ isVerified: false });
    const googleClients = await Client.countDocuments({ googleId: { $ne: null } });
    const recentClients = await Client.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.status(200).json({
      success: true,
      data: {
        total: totalClients,
        verified: verifiedClients,
        notverified : NotverifiedClients,
        googleUsers: googleClients,
        recentWeek: recentClients,
        verificationRate: totalClients > 0 ? ((verifiedClients / totalClients) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};




// Récupérer un client par ID
export const getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).select('-password');
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: client
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du client',
      error: error.message
    });
  }
};

// Supprimer un client
export const deleteClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Client supprimé avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression',
      error: error.message
    });
  }
};

// Mettre à jour un client
export const updateClient = async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: client
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour',
      error: error.message
    });
  }
};

// Récupérer tous les véhicules d'un propriétaire
export const getVehiculesByProprietaire = async (req, res) => {
  try {
    const { clientId } = req.params;

    const vehicules = await Vehicule.find({ proprietaireId :clientId })
      .populate('proprietaireId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: vehicules.length,
      data: vehicules
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des véhicules',
      error: error.message
    });
  }
};

// Récupérer un véhicule par ID
export const getVehiculeById = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicule = await Vehicule.findById(id)
      .populate('proprietaireId')
      .populate('historique_garages.garageId');

    if (!vehicule) {
      return res.status(404).json({
        success: false,
        message: 'Véhicule non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: vehicule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du véhicule',
      error: error.message
    });
  }
};

// Récupérer le carnet d'entretien d'un véhicule
export const getCarnetEntretienByVehicule = async (req, res) => {
  try {
    const { vehiculeId } = req.params;

    // Vérifier que le véhicule existe
    const vehicule = await Vehicule.findById(vehiculeId);
    if (!vehicule) {
      return res.status(404).json({
        success: false,
        message: 'Véhicule non trouvé'
      });
    }

    // Récupérer tous les carnets d'entretien
    const carnets = await CarnetEntretien.find({ vehiculeId })
      .populate('devisId' ,'id _id')
      .populate('garageId', 'nom _id')
      .sort({ dateCommencement: -1 });

    res.status(200).json({
      success: true,
      count: carnets.length,
      data: carnets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du carnet d\'entretien',
      error: error.message
    });
  }
};

// Mettre à jour un véhicule
export const updateVehicule = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Empêcher la modification de certains champs sensibles
    delete updateData.proprietaireId;
    delete updateData.proprietaireModel;
    delete updateData.creePar;

    const vehicule = await Vehicule.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('proprietaireId');

    if (!vehicule) {
      return res.status(404).json({
        success: false,
        message: 'Véhicule non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Véhicule mis à jour avec succès',
      data: vehicule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du véhicule',
      error: error.message
    });
  }
};

// Créer un nouveau véhicule
export const createVehicule = async (req, res) => {
  try {
    const vehicule = new Vehicule(req.body);
    await vehicule.save();

    const vehiculePopulated = await Vehicule.findById(vehicule._id)
      .populate('proprietaireId');

    res.status(201).json({
      success: true,
      message: 'Véhicule créé avec succès',
      data: vehiculePopulated
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Cette immatriculation existe déjà',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du véhicule',
      error: error.message
    });
  }
};

// Supprimer un véhicule
export const deleteVehicule = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicule = await Vehicule.findByIdAndDelete(id);

    if (!vehicule) {
      return res.status(404).json({
        success: false,
        message: 'Véhicule non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Véhicule supprimé avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du véhicule',
      error: error.message
    });
  }
};

// Mettre à jour le kilométrage
export const updateKilometrage = async (req, res) => {
  try {
    const { id } = req.params;
    const { kilometrage } = req.body;

    if (!kilometrage || kilometrage < 0) {
      return res.status(400).json({
        success: false,
        message: 'Kilométrage invalide'
      });
    }

    const vehicule = await Vehicule.findById(id);

    if (!vehicule) {
      return res.status(404).json({
        success: false,
        message: 'Véhicule non trouvé'
      });
    }

    // Vérifier que le nouveau kilométrage est supérieur à l'ancien
    if (vehicule.kilometrage && kilometrage < vehicule.kilometrage) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau kilométrage doit être supérieur à l\'ancien'
      });
    }

    vehicule.kilometrage = kilometrage;
    await vehicule.save();

    res.status(200).json({
      success: true,
      message: 'Kilométrage mis à jour avec succès',
      data: vehicule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du kilométrage',
      error: error.message
    });
  }
};

