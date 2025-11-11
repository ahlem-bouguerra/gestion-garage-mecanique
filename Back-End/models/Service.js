import mongoose from "mongoose";

const Servicechema = new mongoose.Schema({
  id: {
    type: String, unique: true, default: "" 
},
  name: {
    type: String,
    required :true,
    enum: {
      values: ["Entretien et révision", "Réparation mécanique", "Pneumatiques et suspension", "Électricité et électronique","Freinage et sécurité","Carrosserie et peinture","Services complémentaires"],
      message: 'Service non disponible'
    }
  },
  description: {
    type: String,
    required :true,
  },
  statut: { 
    type: String,
    required: [true, 'Le statut est obligatoire'],
    enum: {
      values: ["Actif", "Désactivé"],
      message: 'Le statut sélectionné n\'est pas valide'
    },
    default: "Actif" 
  },

      garagisteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Garagiste",
        required: true
      }
});
// À la fin de ton schema, AVANT export default
Servicechema.index({ name: 1, garagisteId: 1 }, { unique: true });

// 🔹 Générer matricule auto : EMP001, EMP002, ...
Servicechema.pre("save", async function (next) {
  if (!this.isNew) return next();

  try {
    const lastService = await mongoose.model("Service").findOne().sort({ id: -1 });
    if (!lastService) {
      this.id = "SERV001";
    } else {
      const lastNum = parseInt(lastService.id.replace("SERV", "")) || 0;
      this.id = "SERV" + String(lastNum + 1).padStart(3, "0");
    }
    next();
  } catch (err) {
    next(err);
  }
});


export default mongoose.model("Service", Servicechema);
