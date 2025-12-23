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

  garage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Garage",
    default: null,
  },

   isActive: {
    type: Boolean,
    default: false
  },

  // 🔗 Créé par qui ? (utile pour savoir quel admin a créé l’employé)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Garagiste",
    default: null,
  },
  mecanicienData: {
  dateNaissance: { type: Date },
  poste: {
    type: String,
    enum: ["Mécanicien", "Électricien Auto", "Carrossier", "Chef d'équipe", "Apprenti"]
  },
  dateEmbauche: { type: Date },
  typeContrat: {
    type: String,
    enum: ["CDI", "CDD", "Stage", "Apprentissage"]
  },
  statut: {
    type: String,
    enum: ["Actif", "Congé", "Arrêt maladie", "Suspendu", "Démissionné"],
    default: "Actif"
  },
  salaire: { type: Number },
  services: [{
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
    name: { type: String }
  }],
  experience: { type: String },
  permisConduire: {
    type: String,
    enum: ["A", "B", "C", "D", "E"]
  },
  matricule: { type: String, unique: true, sparse: true } // sparse permet NULL
}

}, {
  timestamps: true
});


export const Garagiste = mongoose.model("Garagiste", garagisteSchema);