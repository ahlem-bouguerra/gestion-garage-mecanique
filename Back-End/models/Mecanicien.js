import mongoose from "mongoose";

const mecanicienSchema = new mongoose.Schema({
  // Identité de l'employé
  nom: { 
    type: String, 
    required: [true, 'Le nom est obligatoire'],
    unique: true,
    trim: true,
    minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  dateNaissance: { 
    type: Date, 
    required: [true, 'La date de naissance est obligatoire'],
    validate: {
      validator: function(value) {
        const today = new Date();
        const age = today.getFullYear() - value.getFullYear();
        return age >= 16 && age <= 80;
      },
      message: 'L\'âge doit être entre 16 et 80 ans'
    }
  },
  telephone: { 
    type: String, 
    required: [true, 'Le téléphone est obligatoire'],
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{8}$/.test(v);
      },
      message: 'Le numéro de téléphone doit contenir exactement 8 chiffres'
    }
  },
  email: { 
    type: String,
    required: [true, 'L\'email est obligatoire'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'L\'adresse email n\'est pas valide'
    }
  },

  // Informations professionnelles
  matricule: { type: String, unique: true, default: "" },
  poste: { 
    type: String,
    required: [true, 'Le poste est obligatoire'],
    enum: ["Mécanicien", "Électricien Auto", "Carrossier", "Chef d'équipe", "Apprenti"],
    default: "Mécanicien" 
  },
  dateEmbauche: { 
    type: Date, 
    required: [true, 'La date d\'embauche est obligatoire'],
    default: Date.now,
    validate: {
      validator: function(value) {
        return value <= new Date();
      },
      message: 'La date d\'embauche ne peut pas être dans le futur'
    }
  },
  typeContrat: { 
    type: String, 
    required: [true, 'Le type de contrat est obligatoire'],
    enum: ["CDI", "CDD", "Stage", "Apprentissage"],
    default: "CDI" 
  },
  statut: { 
    type: String,
    required: [true, 'Le statut est obligatoire'],
    enum: ["Actif", "Congé", "Arrêt maladie", "Suspendu", "Démissionné"],
    default: "Actif" 
  },
  salaire: { 
    type: Number,
    required: false,
    min: [200, 'Le salaire minimum est de 200 DT'],
    max: [10000, 'Le salaire maximum est de 10000 DT']
  },

  // Services / compétences
services: [
  {
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    name: { type: String, required: true }
  }
],

  // Expérience
  experience: { 
    type: String,
    required: [true, 'L\'expérience est obligatoire'],
    trim: true,
    maxlength: [500, 'L\'expérience ne peut pas dépasser 500 caractères']
  },

  // Documents administratifs
  permisConduire: { 
    type: String,
    required: [true, 'Le permis de conduire est obligatoire'],
    enum: ["A", "B", "C", "D", "E"],
    default: "B" 
  },
  garagisteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Garagiste",
    required: true
  }

}, {
  timestamps: true
});

// 🔹 Générer matricule auto : EMP001, EMP002, ...
mecanicienSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  try {
    const lastMec = await mongoose.model("Mecanicien").findOne().sort({ matricule: -1 });
    if (!lastMec) {
      this.matricule = "EMP001";
    } else {
      const lastNum = parseInt(lastMec.matricule.replace("EMP", "")) || 0;
      this.matricule = "EMP" + String(lastNum + 1).padStart(3, "0");
    }
    next();
  } catch (err) {
    next(err);
  }
});

// 🔹 Validation avant sauvegarde
mecanicienSchema.pre("save", function(next) {
  const requiredFields = ['nom', 'dateNaissance', 'telephone', 'email', 'poste', 'dateEmbauche', 'typeContrat', 'statut', 'salaire', 'experience', 'permisConduire'];
  
  for (let field of requiredFields) {
    if (!this[field] || (typeof this[field] === 'string' && this[field].trim() === '')) {
      return next(new Error(`Le champ ${field} est obligatoire et ne peut pas être vide`));
    }
  }

  // Vérifier les services
  if (!this.services || this.services.length === 0) {
    return next(new Error('Au moins un service doit être renseigné'));
  }
  for (let serv of this.services) {
    if (!serv.serviceId) {
      return next(new Error('Chaque service doit avoir un serviceId'));
    }
    if (!serv.name || serv.name.trim() === '') {
      return next(new Error('Chaque service doit avoir un nom'));
    }
  }

  next();
});

export default mongoose.model("Mecanicien", mecanicienSchema);
