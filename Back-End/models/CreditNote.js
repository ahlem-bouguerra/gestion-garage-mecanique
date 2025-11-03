import mongoose from 'mongoose';

const creditNoteSchema = new mongoose.Schema({
  creditNumber: {
    type: String,
    unique: true,
    required: true
  },

  // Référence à la facture annulée
  originalFactureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facture',
    required: true
  },
  originalFactureNumber: {
    type: String,
    required: true
  },

  // Informations client (copie de la facture originale)
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FicheClient',
    required: true
  },
  realClientId: {  // ← NOUVEAU : vrai compte Client
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: false  // false car anciennes factures n'ont pas ça
  },
  clientInfo: {
    nom: String,
    telephone: String,
    email: String,
    adresse: String
  },

  // Informations véhicule
  vehicleInfo: {
    type: String,
    required: true
  },

  // Date d'intervention originale
  inspectionDate: {
    type: Date,
    required: true
  },

  // Services annulés (copie exacte de la facture originale)
  services: [{
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
      required: true
    }
  }],

  // Montants annulés (en négatif pour comptabilité)
  maindoeuvre: {
    type: Number,
    default: 0
  },
  tvaRate: {
    type: Number,
    required: true
  },
  totalHT: {
    type: Number,
    required: true
  },
  totalTVA: {
    type: Number,
    required: true
  },
  totalTTC: {
    type: Number,
    required: true
  },
    totalHT: {
    type: Number,
    required: true,
    min: 0
  },
  totalTVA: {
    type: Number,
    required: true,
    min: 0
  },
  totalRemise: {
  type: Number,
  required: true,
  default: 0,
  min: 0,
  comment: "Montant exact de remise appliquée"
},

  finalTotalTTC: {
    type: Number,
    required: true,
    min: 0,
    comment: "Total TTC final avec remise (services + main d'œuvre + TVA + remise)"
  },

  // Raison de l'avoir
  reason: {
    type: String,
    required: true,
    maxlength: 500
  },

  // Date d'émission de l'avoir
  creditDate: {
    type: Date,
    default: Date.now
  },

  // Métadonnées
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  garagisteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
  }
}, {
  timestamps: true
});

// Génération automatique du numéro d'avoir
creditNoteSchema.statics.generateCreditNumber = async function() {
  try {
    const currentYear = new Date().getFullYear();
    const lastCredit = await this.findOne({
      creditNumber: new RegExp(`^AV-${currentYear}-`)
    }).sort({ creditNumber: -1 });
    
    let nextNumber = 1;
    if (lastCredit) {
      const match = lastCredit.creditNumber.match(/AV-\d+-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    
    return `AV-${currentYear}-${String(nextNumber).padStart(6, '0')}`;
  } catch (error) {
    console.error('Erreur génération numéro avoir:', error);
    return `AV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  }
};

export default mongoose.model('CreditNote', creditNoteSchema);