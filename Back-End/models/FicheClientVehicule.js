// models/FicheClientVehicule.js
import mongoose from 'mongoose';

const ficheClientVehiculeSchema = new mongoose.Schema({
  ficheClientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FicheClient',
    required: true
  },
  vehiculeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicule',
    required: true
  },
  dateAssociation: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  },
  // ✅ Pour éviter les doublons
  garageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// ✅ Index composé : une ficheClient ne peut avoir qu'une seule fois le même véhicule
ficheClientVehiculeSchema.index({ ficheClientId: 1, vehiculeId: 1 }, { unique: true });

export default mongoose.model('FicheClientVehicule', ficheClientVehiculeSchema);