
import CarnetEntretien from '../models/CarnetEntretien.js';
import Devis from '../models/Devis.js';
import Vehicule from '../models/Vehicule.js';


// GET /api/carnet-entretien/vehicule/:vehiculeId
// Récupérer l'historique d'entretien d'un véhicule
export const getCarnetByVehiculeId = async (req, res) => {
  try {
    const { vehiculeId } = req.params;

    // Méthode 1: Récupérer depuis la table CarnetEntretien si elle existe
    const carnetsExistants = await CarnetEntretien.find({ vehiculeId })
      .populate({
        path: 'devisId',
        select: 'id inspectionDate services totalTTC status'
      })
      .sort({ dateCommencement: -1 });

    // Méthode 2: Si pas de carnets, récupérer depuis les devis acceptés
    let historique = [];
    
    if (carnetsExistants.length > 0) {
      // Utiliser les données de CarnetEntretien
      historique = carnetsExistants.map(carnet => ({
        _id: carnet._id,
        dateCommencement: carnet.dateCommencement,
        dateFinCompletion: carnet.dateFinCompletion,
        tachesService: carnet.tachesService,
        totalTTC: carnet.totalTTC,
        statut: carnet.statut,
        typeEntretien: carnet.typeEntretien,
        notes: carnet.notes,
        kilometrageEntretien: carnet.kilometrageEntretien,
        devisInfo: carnet.devisId ? {
          id: carnet.devisId.id,
          inspectionDate: carnet.devisId.inspectionDate,
          status: carnet.devisId.status
        } : null,
        source: 'carnet'
      }));
    } else {
      // Fallback: récupérer depuis les devis acceptés
      const devisAcceptes = await Devis.find({ 
        vehiculeId, 
        status: 'accepte' 
      })
      .select('id inspectionDate services totalTTC status createdAt')
      .sort({ createdAt: -1 });

      historique = devisAcceptes.map(devis => ({
        _id: devis._id,
        dateCommencement: new Date(devis.inspectionDate),
        dateFinCompletion: null,
        tachesService: devis.services,
        totalTTC: devis.totalTTC,
        statut: 'termine', // Supposer terminé si c'est un devis accepté
        typeEntretien: 'revision',
        notes: null,
        kilometrageEntretien: null,
        devisInfo: {
          id: devis.id,
          inspectionDate: devis.inspectionDate,
          status: devis.status
        },
        source: 'devis'
      }));
    }

    // Récupérer les infos du véhicule
    const vehicule = await Vehicule.findById(vehiculeId)
      .populate('proprietaireId', 'nom type telephone');

    if (!vehicule) {
      return res.status(404).json({ error: 'Véhicule non trouvé' });
    }


    res.json({
      vehicule: {
        _id: vehicule._id,
        marque: vehicule.marque,
        modele: vehicule.modele,
        immatriculation: vehicule.immatriculation,
        annee: vehicule.annee,
        proprietaire: vehicule.proprietaireId
      },
      historique,
    });

  } catch (error) {
    console.error('Erreur récupération carnet:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération du carnet d\'entretien',
      details: error.message 
    });
  }
};

// POST /api/carnet-entretien/creer-depuis-devis
// Créer un carnet d'entretien depuis un devis accepté
export const creerCarnet = async (req, res) => {
  try {
    const { devisId } = req.body;

    if (!devisId) {
      return res.status(400).json({ error: 'ID devis requis' });
    }

    const carnet = await CarnetEntretien.creerDepuisDevis(devisId);
    
    res.status(201).json({
      message: 'Carnet d\'entretien créé avec succès',
      carnet
    });

  } catch (error) {
    console.error('Erreur création carnet:', error);
    res.status(400).json({ 
      error: error.message 
    });
  }
};

// PUT /api/carnet-entretien/:id/terminer
// Marquer un entretien comme terminé
export const marquerCarnettermine = async (req, res) => {
  try {
    const { id } = req.params;
    const { dateFinCompletion, notes, kilometrageEntretien } = req.body;

    const carnet = await CarnetEntretien.findByIdAndUpdate(
      id,
      {
        statut: 'termine',
        dateFinCompletion: dateFinCompletion || new Date(),
        notes,
        kilometrageEntretien
      },
      { new: true }
    );

    if (!carnet) {
      return res.status(404).json({ error: 'Carnet d\'entretien non trouvé' });
    }

    res.json({
      message: 'Entretien marqué comme terminé',
      carnet
    });

  } catch (error) {
    console.error('Erreur mise à jour carnet:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour du carnet',
      details: error.message 
    });
  }
};

// GET /api/carnet-entretien/stats/vehicule/:vehiculeId
// Statistiques détaillées pour un véhicule
export const Statistiques = async (req, res) => {
  try {
    const { vehiculeId } = req.params;

    const carnets = await CarnetEntretien.find({ vehiculeId })
      .sort({ dateCommencement: -1 });

    if (carnets.length === 0) {
      return res.json({
        stats: {
          totalEntretiens: 0,
          totalDepense: 0,
          moyenneParEntretien: 0,
          dernierEntretien: null,
          prochainEntretien: null
        }
      });
    }

    const totalDepense = carnets.reduce((sum, carnet) => sum + carnet.totalTTC, 0);
    const moyenneParEntretien = totalDepense / carnets.length;

    // Estimation du prochain entretien (tous les 6 mois ou 10000 km)
    const dernierCarnet = carnets[0];
    const estimationProchainEntretien = new Date(dernierCarnet.dateCommencement);
    estimationProchainEntretien.setMonth(estimationProchainEntretien.getMonth() + 6);

    const stats = {
      totalEntretiens: carnets.length,
      totalDepense,
      moyenneParEntretien,
      dernierEntretien: dernierCarnet.dateCommencement,
      prochainEntretien: estimationProchainEntretien,
      repartitionParType: getRepartitionParType(carnets),
      evolutionDepenses: getEvolutionDepenses(carnets)
    };

    res.json({ stats });

  } catch (error) {
    console.error('Erreur récupération stats:', error);
    res.status(500).json({ 
      error: 'Erreur lors du calcul des statistiques',
      details: error.message 
    });
  }
};


