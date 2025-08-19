// 1. Créer models/Devis.js
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
    ref: 'Client',
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
  inspectionDate: {
    type: String,
    required: true
  },
  services: [serviceSchema],
  totalHT: {
    type: Number,
    required: true,
    min: 0
  },
  totalTTC: {
    type: Number,
    required: true,
    min: 0
  },
  tvaRate: {
    type: Number,
    required: true,
    default: 20
  },
  maindoeuvre:{
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['brouillon', 'envoye', 'accepte', 'refuse'],
    default: 'brouillon'
  }
}, {
  timestamps: true
});

// Générer ID automatique
devisSchema.statics.generateDevisId = async function() {
  const lastDevis = await this.findOne({}, {}, { sort: { 'createdAt': -1 } });
  let nextNumber = 1;
  
  if (lastDevis && lastDevis.id) {
    const lastNumber = parseInt(lastDevis.id.replace('DEV', ''));
    nextNumber = lastNumber + 1;
  }
  
  return `DEV${String(nextNumber).padStart(3, '0')}`;
};

export default mongoose.model('Devis', devisSchema);
