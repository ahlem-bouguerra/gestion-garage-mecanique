// models/GarageService.js
import mongoose from "mongoose";

const GarageServiceSchema = new mongoose.Schema({
  garageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Garage',
    required: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  // Date d'ajout au garage
  addedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Un service par garage une seule fois
GarageServiceSchema.index({ garageId: 1, serviceId: 1 }, { unique: true });

export default mongoose.model("GarageService", GarageServiceSchema);