import mongoose from "mongoose";

const garageSchema = new mongoose.Schema({

    nom: { type: String, required: true },

    matriculeFiscal: { type: String, required: true, unique: true },

    // Localisation
    governorateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Governorate",
        default: null
    },
    governorateName: {
        type: String,
        default: ""
    },
    cityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "City",
        default: null
    },
    cityName: {
        type: String,
        default: ""
    },
    streetAddress: {
        type: String,
        default: ""
    },

    // Location optionnelle
    location: {
        type: {
            type: String,
            enum: ['Point']
        },
        coordinates: {
            type: [Number] // [longitude, latitude]
        }
    },
  garagisteAdmins: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Garagiste" 
  }],
      // Informations supplémentaires
  description: {
    type: String,
    default: ""
  },

  horaires: {
    type: String,
    default: ""
  },
  services: [{
    type: String
  }],
  // Statut du garage
  isActive: {
    type: Boolean,
    default: true
  }

}, {
    timestamps: true
});

// ✅ Index géospatial sparse
garageSchema.index({ location: '2dsphere' }, { sparse: true });
garageSchema.index({ matriculeFiscal: 1 }, { unique: true });

export const Garage = mongoose.model("Garage", garageSchema);