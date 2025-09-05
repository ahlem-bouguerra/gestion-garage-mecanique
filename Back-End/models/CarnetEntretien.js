// models/CarnetEntretien.js
import mongoose from 'mongoose';

const carnetEntretienSchema = new mongoose.Schema({
  vehiculeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicule',
    required: true
  },
  ordreId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ordre', // Si vous avez un modèle Ordre
    required: false
  },
  devisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Devis',
    required: true
  },
  dateCommencement: {
    type: Date,
    required: true
  },
  dateFinCompletion: {
    type: Date,
    required: false // Peut être null si l'entretien n'est pas terminé
  },
  tachesService: [{
    pieceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Piece',
      required: true
    },
    piece: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  totalTTC: {
    type: Number,
    required: true,
    min: 0
  },
  kilometrageEntretien: {
    type: Number,
    min: 0
  },
  statut: {
    type: String,
    enum: ['planifie', 'en_cours', 'termine', 'annule'],
    default: 'planifie'
  },
  notes: {
    type: String,
    trim: true
  },
  typeEntretien: {
    type: String,
    enum: ['revision', 'reparation', 'maintenance_preventive', 'diagnostic', 'autre'],
    default: 'revision'
  }
}, {
  timestamps: true
});

// Index pour optimiser les requêtes par véhicule
carnetEntretienSchema.index({ vehiculeId: 1, dateCommencement: -1 });

// Méthode virtuelle pour calculer la durée de l'entretien
carnetEntretienSchema.virtual('dureeEntretien').get(function() {
  if (this.dateFinCompletion && this.dateCommencement) {
    const diffTime = new Date(this.dateFinCompletion) - new Date(this.dateCommencement);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  return null;
});

// Méthode statique pour créer un carnet d'entretien depuis un devis accepté
carnetEntretienSchema.statics.creerDepuisDevis = async function(devisId) {
  try {
    const Devis = mongoose.model('Devis');
    const devis = await Devis.findById(devisId).populate('vehiculeId');
    
    if (!devis || devis.status !== 'accepte') {
      throw new Error('Devis non trouvé ou non accepté');
    }

    // Vérifier si un carnet existe déjà pour ce devis
    const existant = await this.findOne({ devisId });
    if (existant) {
      throw new Error('Un carnet d\'entretien existe déjà pour ce devis');
    }

    const carnetData = {
      vehiculeId: devis.vehiculeId._id,
      devisId: devis._id,
      dateCommencement: new Date(),
      tachesService: devis.services,
      totalTTC: devis.totalTTC,
      kilometrageEntretien: devis.vehiculeId.kilometrage,
      statut: 'planifie'
    };

    return await this.create(carnetData);
  } catch (error) {
    throw new Error(`Erreur création carnet: ${error.message}`);
  }
};

// Inclure les virtuels dans JSON
carnetEntretienSchema.set('toJSON', { virtuals: true });
carnetEntretienSchema.set('toObject', { virtuals: true });

export default mongoose.model('CarnetEntretien', carnetEntretienSchema);