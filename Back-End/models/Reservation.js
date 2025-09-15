import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
  garageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  
  clientPhone: {
    type: String,
    required: true,
    trim: true
  },
  
  clientEmail: {
    type: String,
    trim: true,
    default: null
  },
  
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  
  // Créneau demandé initialement par le client
  creneauDemande: {
    date: {
      type: Date,
      required: true
    },
    heureDebut: {
      type: String,
      required: true
    }
  },
  
  // Créneau proposé par le garage (contre-proposition)
  creneauPropose: {
    date: {
      type: Date
    },
    heureDebut: {
      type: String
    }
  },
  
  descriptionDepannage: {
    type: String,
    required: true,
    trim: true
  },
  
  status: {
    type: String,
    enum: ['en_attente', 'accepte', 'refuse', 'contre_propose', 'annule'],
    default: 'en_attente'
  },
  
  // Message envoyé par le garage
  messageGarage: {
    type: String,
    trim: true,
    default: null
  },
  
  // Message envoyé par le client
  messageClient: {
    type: String,
    trim: true,
    default: null
  }
  
}, {
  timestamps: true // Ajoute createdAt et updatedAt automatiquement
});

// Index pour améliorer les performances des recherches
reservationSchema.index({ garageId: 1, status: 1 });
reservationSchema.index({ 'creneauDemande.date': 1, 'creneauDemande.heureDebut': 1 });

// Virtuel pour populer les données du service (optionnel)
reservationSchema.virtual('serviceName').get(function() {
  return this.serviceId ? this.serviceId.name : null;
});

// Middleware pre-save pour debugging
reservationSchema.pre('save', function(next) {
  console.log('=== PRE-SAVE MIDDLEWARE ===');
  console.log('Document à sauvegarder:', {
    _id: this._id,
    status: this.status,
    clientName: this.clientName,
    isNew: this.isNew,
    isModified: this.isModified(),
    modifiedPaths: this.modifiedPaths()
  });
  next();
});

// Middleware post-save pour debugging
reservationSchema.post('save', function(doc) {
  console.log('=== POST-SAVE MIDDLEWARE ===');
  console.log('Document sauvegardé:', {
    _id: doc._id,
    status: doc.status,
    clientName: doc.clientName
  });
});

const Reservation = mongoose.model('Reservation', reservationSchema);

export default Reservation;