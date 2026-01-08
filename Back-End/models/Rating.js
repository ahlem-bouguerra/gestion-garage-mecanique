// models/Rating.js
import mongoose from 'mongoose';

const RatingSchema = new mongoose.Schema({
  // Référence à l'ordre de travail évalué
  ordreId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OrdreTravail',
    required: true,
    unique: true // Un ordre ne peut avoir qu'une seule évaluation
  },

  // Client qui évalue (utilisateur authentifié)
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },

  // Fiche client dans le garage
  ficheClientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FicheClient',
    required: true
  },

  // Garage évalué
  garageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Garage',
    required: true
  },

  // Note globale (sur 5)
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },

  // Commentaire du client
  comment: {
    type: String,
    maxlength: 500,
    trim: true,
    default: ''
  },

  // Recommandation
  recommande: {
    type: Boolean,
    default: true
  },

  // Réponse du garage (optionnel)
  reponseGarage: {
    texte: {
      type: String,
      maxlength: 500
    },
    date: Date,
    auteurId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Garagiste'
    }
  },

  // Statut de la note
  status: {
    type: String,
    enum: ['active', 'signale', 'masque'],
    default: 'active'
  },

  // Informations sur l'ordre au moment de la notation
  ordreSnapshot: {
    numeroOrdre: String,
    dateCommence: Date,
    dateFinReelle: Date,
    totalHeuresReelles: Number,
    vehiculeNom: String,
    service: String,
  }

}, {
  timestamps: true
});

// Index pour recherche rapide
RatingSchema.index({ garageId: 1, createdAt: -1 });
RatingSchema.index({ clientId: 1, createdAt: -1 });
RatingSchema.index({ ordreId: 1 });
RatingSchema.index({ rating: 1 });

// Méthode pour mettre à jour la moyenne du garage
RatingSchema.statics.updateGarageRating = async function(garageId) {
  const stats = await this.aggregate([
    {
      $match: { 
        garageId: new mongoose.Types.ObjectId(garageId),
        status: 'active'
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 }
      }
    }
  ]);

  const { averageRating = 0, totalRatings = 0 } = stats[0] || {};

  // Mettre à jour le garage
  await mongoose.model('Garage').findByIdAndUpdate(garageId, {
    averageRating: Math.round(averageRating * 10) / 10, // Arrondi à 1 décimale
    totalRatings
  });

  return { averageRating, totalRatings };
};

// Hook après sauvegarde
RatingSchema.post('save', async function() {
  await this.constructor.updateGarageRating(this.garageId);
});

// Hook après suppression
RatingSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    await doc.constructor.updateGarageRating(doc.garageId);
  }
});

export default mongoose.model('Rating', RatingSchema);