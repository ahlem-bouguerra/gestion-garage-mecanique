import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
  garageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  vehiculeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicule',
    default: null
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
      required: true,
      validate: {
        validator: function(v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Format d\'heure invalide (HH:MM attendu)'
      }
    }
  },
  
  // Créneau proposé par le garage (contre-proposition)
  creneauPropose: {
    date: {
      type: Date,
      default: undefined // Explicitement undefined si pas défini
    },
    heureDebut: {
      type: String,
      default: undefined,
      validate: {
        validator: function(v) {
          // Validation seulement si la valeur est définie
          return v === undefined || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Format d\'heure invalide (HH:MM attendu)'
      }
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
  },
  clientId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Client",
        required: true
   },
}, {
  timestamps: true,
  // Assure-t-il que les champs undefined ne sont pas sauvés comme null
  minimize: false
});

// Index pour améliorer les performances
reservationSchema.index({ garageId: 1, status: 1 });
reservationSchema.index({ 'creneauDemande.date': 1, 'creneauDemande.heureDebut': 1 });

// Virtuel pour populer les données du service
reservationSchema.virtual('serviceName').get(function() {
  return this.serviceId ? this.serviceId.name : null;
});

// Middleware pre-save pour validation et debugging
reservationSchema.pre('save', function(next) {
  console.log('=== PRE-SAVE MIDDLEWARE ===');
  console.log('Document à sauvegarder:', {
    _id: this._id,
    status: this.status,
    clientName: this.clientName,
    creneauDemande: this.creneauDemande,
    creneauPropose: this.creneauPropose,
    isNew: this.isNew,
    isModified: this.isModified(),
    modifiedPaths: this.modifiedPaths()
  });

  // Validation customisée pour les contre-propositions
  if (this.status === 'contre_propose' && this.isModified('status')) {
    if (!this.creneauPropose || !this.creneauPropose.date || !this.creneauPropose.heureDebut) {
      const error = new Error('creneauPropose requis quand status = contre_propose');
      return next(error);
    }
  }

  // Nettoyer creneauPropose si status n'est plus contre_propose
  if (this.status === 'accepte' && this.creneauPropose) {
    this.creneauPropose = undefined;
    this.markModified('creneauPropose');
  }

  next();
});

// Middleware post-save pour debugging
reservationSchema.post('save', function(doc) {
  console.log('=== POST-SAVE MIDDLEWARE ===');
  console.log('Document sauvegardé:', {
    _id: doc._id,
    status: doc.status,
    clientName: doc.clientName,
    creneauDemande: doc.creneauDemande,
    creneauPropose: doc.creneauPropose
  });
});

// Middleware pour les erreurs de validation
reservationSchema.post('save', function(error, doc, next) {
  if (error) {
    console.log('=== ERREUR SAVE ===');
    console.log('Erreur:', error);
    console.log('Document:', doc);
  }
  next(error);
});

const Reservation = mongoose.model('Reservation', reservationSchema);

export default Reservation;