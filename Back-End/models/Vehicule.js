// models/Vehicule.js
import mongoose from 'mongoose';

const vehiculeSchema = new mongoose.Schema({
  // ✅ MODIFIÉ : proprietaireId peut pointer vers Client OU FicheClient
  proprietaireId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'proprietaireModel', // Dynamique !
    required: true
  },
  
  // ✅ NOUVEAU : Indique si c'est un Client plateforme ou FicheClient
  proprietaireModel: {
    type: String,
    required: true,
    enum: ['Client', 'FicheClient']
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
    unique: true, // ✅ GLOBAL : une immatriculation = unique dans tout le système
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
  },
  
  // ✅ NOUVEAU : Pour tracer qui l'a créé
  creePar: {
    type: String,
    enum: ['client', 'garagiste'],
    required: true
  },
  
  // ✅ MODIFIÉ : garagisteId devient OPTIONNEL (seulement si créé par garage)
  garagisteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Garagiste",
    required: false // ✅ Nullable si créé par client
  },
  paysImmatriculation: {
  type: String,
  enum: ['tunisie', 'autre'],
  default: 'tunisie'
},
  
  // ✅ NOUVEAU : Historique des garages qui ont travaillé sur ce véhicule
  historique_garages: [{
    garageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Garagiste"
    },
    datePremiereVisite: {
      type: Date,
      default: Date.now
    }
  }],
  carteGrise: {
  // Identifiants
  numeroCG: { type: String, required: true, trim: true, uppercase: true },
  numeroChassis: { type: String, required: true, trim: true, uppercase: true },
  
  // Infos techniques
  dateMiseCirculation: { type: Date, required: true },
  puissanceFiscale: { type: Number, required: true },
  genre: { type: String, enum: ['VP', 'VU', 'MOTO'], default: 'VP' },
  nombrePlaces: { type: Number, default: 5 },
  
  // Contrôle technique (important pour légalité)
  dateVisite: { type: Date },
  dateProchaineVisite: { type: Date }
}
  
}, {
  timestamps: true
});

// ✅ Index pour recherche rapide
vehiculeSchema.index({ immatriculation: 1 });
vehiculeSchema.index({ proprietaireId: 1 });

export default mongoose.model('Vehicule', vehiculeSchema);