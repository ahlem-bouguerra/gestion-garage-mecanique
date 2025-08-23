import mongoose from "mongoose";

const mecanicienSchema = new mongoose.Schema({
  // Identité de l'employé
  nom: { type: String, required: true ,unique: true},
  dateNaissance: { type: Date },
  telephone: { type: String, required: true ,unique: true },
  email: { type: String ,required: true  ,unique: true},

  // Informations professionnelles
  matricule: { type: String, unique: true, default: "" }, // ex: EMP001
  poste: { 
    type: String, 
    enum: ["Mécanicien", "Électricien Auto", "Carrossier", "Chef d'équipe", "Apprenti"], 
    default: "Mécanicien" 
  },
  dateEmbauche: { type: Date, default: Date.now },
  typeContrat: { type: String, enum: ["CDI", "CDD", "Stage", "Apprentissage"], default: "CDI" },
  statut: { 
    type: String, 
    enum: ["Actif", "Congé", "Arrêt maladie", "Suspendu", "Démissionné"], 
    default: "Actif" 
  },
  salaire: { type: Number }, // salaire de base ou taux horaire

  // Compétences
  competences: [
    {
      domaine: { 
        type: String, 
        enum: [
          "Moteur",
          "Transmission",
          "Freinage",
          "Suspension",
          "Électricité",
          "Diagnostic électronique",
          "Climatisation",
          "Carrosserie"
        ] 
      },
      niveau: { type: String, enum: ["Débutant", "Confirmé", "Expert"], default: "Débutant" },
    },
  ],

  // Expérience
  experience: { type: String }, // ex: "5 ans dans un garage Peugeot"

  // Documents administratifs
  permisConduire: { 
    type: String, 
    enum: ["A", "B", "C", "D", "E"], 
    default: "B" 
  }, // catégories classiques de permis
  visiteMedicale: { type: Date }, // date de dernière visite médicale

  // Équipements
  equipementsAttribues: [{ 
    type: String, 
    enum: [
      "Clé dynamométrique",
      "Valise diagnostic",
      "Pont élévateur",
      "Compresseur",
      "Outils manuels",
      "Multimètre",
      "Appareil de climatisation",
      "Ordinateur de diagnostic"
    ] 
  }]}, {
  timestamps: true // Ajoute createdAt et updatedAt automatiquement
});



  // 🔹 Générer matricule auto : EMP001, EMP002, ...
mecanicienSchema.pre("save", async function (next) {
  if (!this.isNew) return next(); // ne pas régénérer si déjà existant

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



export default mongoose.model("Mecanicien", mecanicienSchema);