import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  garagenom: {
    type: String,
    required: true,
        required: function() {
      return !this.googleId;
    }
  },
  matriculefiscal:{
    type: String,
    required: true,
        required: function() {
      return !this.googleId;
    }
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
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // ✅ CORRECTION: googleId avec sparse index
  googleId: {
    type: String,
    unique: true,
    sparse: true, // ✅ IMPORTANT: Permet plusieurs valeurs null
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
  }

}, {
  timestamps: true
});

// ✅ Index géospatial sparse
userSchema.index({ location: '2dsphere' }, { sparse: true });

// ✅ FORCER la création de l'index googleId avec sparse
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });

export const User = mongoose.model("User", userSchema);