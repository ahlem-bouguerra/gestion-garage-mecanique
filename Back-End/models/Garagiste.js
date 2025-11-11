import mongoose from "mongoose";

const garagisteSchema = new mongoose.Schema({
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
    required: function () {
      return !this.googleId;
    }
  },
  phone: {
    type: String,
    required: function () {
      return !this.googleId;
    }
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  // 🔗 Rôle de l'utilisateur (admin, employé, etc.)
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
    required: true,
  },

  // 🔗 Lien avec le garage
  garage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Garage",
    default: null,
  },

  // 🔗 Créé par qui ? (utile pour savoir quel admin a créé l’employé)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Garagiste",
    default: null,
  },

}, {
  timestamps: true
});


export const Garagiste = mongoose.model("Garagiste", garagisteSchema);