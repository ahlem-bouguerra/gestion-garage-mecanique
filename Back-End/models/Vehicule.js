// models/Vehicule.js
import mongoose from 'mongoose';

const vehiculeSchema = new mongoose.Schema({
  proprietaireId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FicheClient', // Référence vers votre modèle Client
    required: true
  },
  marque: {
    type: String,
    required: true,
    trim: true
  },
  modele: {
    type: String,
    required: true,
    trim: true
  },
  immatriculation: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  annee: {
    type: Number,
    min: 1900,
    max: new Date().getFullYear() + 1
  },
  couleur: {
    type: String,
    trim: true
  },
  typeCarburant: {
    type: String,
    enum: ['essence', 'diesel', 'hybride', 'electrique', 'gpl'],
    default: 'essence'
  },
  kilometrage: {
    type: Number,
    min: 0
  },
  statut: {
    type: String,
    enum: ['actif', 'inactif'],
    default: 'actif'
  }
}, {
  timestamps: true // Ajoute createdAt et updatedAt automatiquement
});

// Index pour améliorer les performances
vehiculeSchema.index({ proprietaireId: 1 });
vehiculeSchema.index({ immatriculation: 1 });

export default mongoose.model('Vehicule', vehiculeSchema);