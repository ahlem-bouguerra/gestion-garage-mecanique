import mongoose from 'mongoose';

const factureSchema = new mongoose.Schema({
  // Référence unique de la facture
  numeroFacture: {   // ← renommé pour correspondre à ton index unique
    type: String,
    unique: true,
    required: true
  },


  // Référence au devis original
  devisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Devis',
    required: true
  },

  clientId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'FicheClient',
  required: true
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

  // Dates importantes
  invoiceDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 jours
    }
  },
  inspectionDate: {
    type: Date,
    required: true
  },

  // Services/Pièces (snapshot des données du devis)
  services: [{
    pieceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Piece'
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
      default: function() {
        return this.quantity * this.unitPrice;
      }
    }
  }],

  // Calculs financiers
  maindoeuvre: {
    type: Number,
    default: 0,
    min: 0
  },
  tvaRate: {
    type: Number,
    default: 20,
    min: 0,
    max: 100
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
  totalTTC: {
    type: Number,
    required: true,
    min: 0
  },

  // Statut de paiement
  paymentStatus: {
    type: String,
    enum: ['en_attente', 'partiellement_paye', 'paye', 'en_retard', 'annule'],
    default: 'en_attente'
  },

  // Informations de paiement
  paymentDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['especes', 'cheque', 'virement', 'carte', 'autre']
  },
  paymentAmount: {
    type: Number,
    default: 0,
    min: 0
  },

  // Temps estimé (copie du devis)
  estimatedTime: {
    days: {
      type: Number,
      default: 0,
      min: 0
    },
    hours: {
      type: Number,
      default: 0,
      min: 0,
      max: 23
    },
    minutes: {
      type: Number,
      default: 0,
      min: 0,
      max: 59
    }
  },

  // Notes et observations
  notes: {
    type: String,
    maxlength: 1000
  },

  // Métadonnées
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
    status: {
    type: String,
    enum: ['active', 'cancelled'],
    default: 'active'
  },
    // Référence à l'avoir qui annule cette facture (si applicable)
  creditNoteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CreditNote'
  },
  // Référence à la facture qui remplace celle-ci (si applicable)
  replacedByFactureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facture'
  },

  // Date d'annulation
  cancelledAt: {
    type: Date
  }
}, {
  timestamps: true
});




factureSchema.statics.generateFactureId = async function () {
  try {
    const lastFacture = await this.findOne({}, {}, { sort: { createdAt: -1 } });
    let nextNumber = 1;

    if (lastFacture && lastFacture.numeroFacture) {
      // Accepte FAC-001 ou Fac001
      const match = lastFacture.numeroFacture.match(/FAC[-]?(\d+)/i);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    // Format unique : FAC-XXX
    return `FAC-${String(nextNumber).padStart(3, "0")}`;
  } catch (error) {
    console.error("Erreur génération ID facture:", error);
    return `FAC-${String(Date.now()).slice(-3)}`;
  }
};



// Méthodes statiques utiles
factureSchema.statics.findByDevis = function(devisId) {
  return this.findOne({ devisId: devisId });
};

factureSchema.statics.findByClient = function(clientId, options = {}) {
  const query = this.find({ clientId: clientId });
  
  if (options.paymentStatus) {
    query.where({ paymentStatus: options.paymentStatus });
  }
  
  if (options.dateFrom) {
    query.where({ invoiceDate: { $gte: new Date(options.dateFrom) } });
  }
  
  if (options.dateTo) {
    query.where({ invoiceDate: { $lte: new Date(options.dateTo) } });
  }
  
  return query.sort({ invoiceDate: -1 });
};

// Méthodes d'instance
factureSchema.methods.markAsPaid = function(newPaymentAmount, paymentMethod, paymentDate = new Date()) {
  // ACCUMULER les paiements, ne pas remplacer
  this.paymentAmount = (this.paymentAmount || 0) + parseFloat(newPaymentAmount);
  this.paymentMethod = paymentMethod;
  this.paymentDate = paymentDate;
  
  if (this.paymentAmount >= this.totalTTC) {
    this.paymentStatus = 'paye';
  } else if (this.paymentAmount > 0) {
    this.paymentStatus = 'partiellement_paye';
  }
  
  return this.save();
};
factureSchema.methods.isOverdue = function() {
  return new Date() > this.dueDate && this.paymentStatus !== 'paye';
};

// Middleware pour mettre à jour automatiquement le statut des factures en retard
factureSchema.pre(['find', 'findOne', 'findOneAndUpdate', 'aggregate'], async function() {
  try {
    const currentDate = new Date();
    
    // Mettre à jour les factures en retard (non payées ET partiellement payées)
    await this.model.updateMany(
      { 
        dueDate: { $lt: currentDate },
        paymentStatus: { $in: ['en_attente', 'partiellement_paye'] }
      },
      { 
        paymentStatus: 'en_retard' 
      }
    );
    
    console.log('✅ Mise à jour automatique des statuts de factures effectuée');
    
  } catch (error) {
    console.error('❌ Erreur mise à jour statut en retard:', error);
  }
});

export default mongoose.model('Facture', factureSchema);
