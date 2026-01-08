import mongoose from "mongoose";

const clientSchema = new mongoose.Schema({
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
    verificationToken: {
  type: String,
  default: null
  },
  
  verificationTokenExpiry: {
    type: Date,
    default: null
  },

  isVerified: {
    type: Boolean,
    default: false
  },
  
  // ✅ CORRECTION: googleId avec sparse index
  googleId: {
    type: String,
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
  }
}, {
  timestamps: true
});

// ✅ Index géospatial sparse
clientSchema.index({ location: '2dsphere' }, { sparse: true });

// ✅ FORCER la création de l'index googleId avec sparse
clientSchema.index({ googleId: 1 }, { unique: true, sparse: true });

export const Client = mongoose.model("Client", clientSchema , "clients");