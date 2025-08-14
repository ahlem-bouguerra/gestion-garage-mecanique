import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId;
    }
  },
  phone: {
    type: String,
    required: function() {
      return !this.googleId;
    }
  },
  token: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
    default: null,
  },
  resetPasswordToken: { 
    type: String, 
    default: null 
  },
  resetPasswordExpires: { 
    type: Date, 
    default: null 
  },

    // Localisation
  governorateId: { type: mongoose.Schema.Types.ObjectId, ref: "Governorate" },
  cityId: { type: mongoose.Schema.Types.ObjectId, ref: "City" },
  streetId: { type: mongoose.Schema.Types.ObjectId, ref: "Street", default: null },

  // PROBLÈME CORRIGÉ: location optionnel avec structure GeoJSON correcte
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: undefined
    }
  }
}, {
  timestamps: true
});

// Index géospatial pour les requêtes de géolocalisation
userSchema.index({ location: '2dsphere' });

export const User = mongoose.model("User", userSchema);