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
  streetAddress: String,

  // PROBLÈME CORRIGÉ: location optionnel avec structure GeoJSON correcte
  location: {
  type: {
    type: String,
    enum: ['Point']
  },
  coordinates: {
    type: [Number] // [longitude, latitude]
  }
}

}, {
  timestamps: true
});



export const User = mongoose.model("User", userSchema);