import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
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
}, { _id: false });

const devisSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FicheClient', // Référence vers votre modèle Client
    required: true
  },
  clientName: {
    type: String,
    required: true
  },
  vehicleInfo: {
    type: String,
    required: true
  },
  vehiculeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicule', // Référence vers votre modèle Véhicule
    required: true
  },
  factureId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Facture', 
    default: null 
  },
  inspectionDate: {
    type: String,
    required: true
  },
  services: [serviceSchema],
  
  // ✅ CLARIFICATION DES CHAMPS
  totalHT: {
    type: Number,
    required: true,
    min: 0,
    comment: "Total des services HT (sans main d'œuvre)"
  },
  totalServicesHT: {
    type: Number,
    required: true,
    min: 0,
    comment: "Total des services HT (avec main d'œuvre)"

  },
  totalTTC: {
    type: Number,
    required: true,
    min: 0,
    comment: "Total TTC final (services + main d'œuvre + TVA)"
  },
  tvaRate: {
    type: Number,
    required: true,
    default: 20,
    min: 0,
    max: 100
  },
  maindoeuvre: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
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
  status: {
    type: String,
    enum: ['brouillon', 'envoye', 'accepte', 'refuse'],
    default: 'brouillon'
  }
}, {
  timestamps: true
});

// ✅ Méthode pour générer un ID unique
devisSchema.statics.generateDevisId = async function() {
  try {
    const lastDevis = await this.findOne({}, {}, { sort: { 'createdAt': -1 } });
    let nextNumber = 1;
    
    if (lastDevis && lastDevis.id) {
      const match = lastDevis.id.match(/DEV(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    
    return `DEV${String(nextNumber).padStart(3, '0')}`;
  } catch (error) {
    console.error('Erreur génération ID devis:', error);
    // Fallback avec timestamp en cas d'erreur
    return `DEV${Date.now().toString().slice(-6)}`;
  }
};

// ✅ Méthode virtuelle pour calculer le total complet
devisSchema.virtual('totalCompletHT').get(function() {
  return this.totalHT + (this.maindoeuvre || 0);
});

// ✅ Méthode virtuelle pour calculer la TVA
devisSchema.virtual('montantTVA').get(function() {
  const totalHT = this.totalHT + (this.maindoeuvre || 0);
  return totalHT * ((this.tvaRate || 20) / 100);
});

// ✅ Inclure les virtuels dans JSON
devisSchema.set('toJSON', { virtuals: true });
devisSchema.set('toObject', { virtuals: true });

export default mongoose.model('Devis', devisSchema);