import mongoose from 'mongoose';

const carnetEntretienSchema = new mongoose.Schema({
  // Référence au véhicule
  vehiculeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicule',
    required: true
  },
  
  // Référence au devis (optionnel)
  devisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Devis',
    required: false
  },
  
  // Dates
  dateCommencement: {
    type: Date,
    required: true
  },
  
  dateFinCompletion: {
    type: Date,
    required: false
  },
  
  // Statut
  statut: {
    type: String,
    enum: ['en_cours', 'termine', 'annule'],
    default: 'en_cours'
  },
  
  // Coûts
  totalTTC: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Kilométrage au moment de l'entretien
  kilometrageEntretien: {
    type: Number,
    required: false,
    min: 0
  },
  
  // Notes/commentaires
  notes: {
    type: String,
    maxlength: 1000
  },
  
  // Services/travaux effectués
  services: [{
    nom: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    quantite: {
      type: Number,
      default: 1,
      min: 0
    },
    prix: {
      type: Number,
      min: 0
    }
  }],
  
  // Pièces utilisées (optionnel)
  pieces: [{
    nom: {
      type: String
    },
    reference: {
      type: String
    },
    quantite: {
      type: Number,
      default: 1
    },
    prix: {
      type: Number,
      min: 0
    }
  }],
  
  // Mécanicien/technicien responsable
  technicien: {
    type: String
  },
  garagisteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
  }
  
}, {
  timestamps: true // Ajoute automatiquement createdAt et updatedAt
});

// Index pour améliorer les performances
carnetEntretienSchema.index({ vehiculeId: 1, dateCommencement: -1 });
carnetEntretienSchema.index({ statut: 1 });

// Méthode statique pour créer un carnet depuis un devis
carnetEntretienSchema.statics.creerDepuisDevis = async function(devisId) {
  try {
    const Devis = mongoose.model('Devis');
    
    // Récupérer le devis
    const devis = await Devis.findOne({ 
      $or: [
        { _id: devisId },
        { id: devisId }
      ]
    }).populate('vehiculeId');
    
    if (!devis) {
      throw new Error('Devis non trouvé');
    }
    
    if (devis.status !== 'accepte') {
      throw new Error('Le devis doit être accepté pour créer un carnet d\'entretien');
    }
    
    // Vérifier si un carnet existe déjà pour ce devis
    const carnetExistant = await this.findOne({ devisId: devis._id });
    if (carnetExistant) {
      throw new Error('Un carnet d\'entretien existe déjà pour ce devis');
    }
    
    // Créer le carnet
    const carnet = new this({
      vehiculeId: devis.vehiculeId,
      devisId: devis._id,
      dateCommencement: new Date(),
      typeEntretien: determinerTypeEntretien(devis.services),
      totalTTC: devis.totalTTC,
      services: devis.services.map(service => ({
        nom: service.nom,
        description: service.description,
        quantite: service.quantite || 1,
        prix: service.prix
      })),
      notes: `Créé depuis le devis ${devis.id}`
    });
    
    await carnet.save();
    return carnet;
    
  } catch (error) {
    throw new Error(`Erreur création carnet: ${error.message}`);
  }
};

// Méthode d'instance pour marquer comme terminé
carnetEntretienSchema.methods.marquerTermine = function(options = {}) {
  this.statut = 'termine';
  this.dateFinCompletion = options.dateFinCompletion || new Date();
  
  if (options.kilometrageEntretien) {
    this.kilometrageEntretien = options.kilometrageEntretien;
  }
  
  if (options.notes) {
    this.notes = this.notes ? `${this.notes}\n${options.notes}` : options.notes;
  }
  
  return this.save();
};

// Méthode virtuelle pour calculer la durée
carnetEntretienSchema.virtual('dureeEntretien').get(function() {
  if (!this.dateFinCompletion) return null;
  
  const debut = new Date(this.dateCommencement);
  const fin = new Date(this.dateFinCompletion);
  const diffMs = fin - debut;
  
  return {
    jours: Math.floor(diffMs / (1000 * 60 * 60 * 24)),
    heures: Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  };
});



// Configuration pour inclure les virtuals dans JSON
carnetEntretienSchema.set('toJSON', { virtuals: true });
carnetEntretienSchema.set('toObject', { virtuals: true });

const CarnetEntretien = mongoose.model('CarnetEntretien', carnetEntretienSchema);

export default CarnetEntretien;