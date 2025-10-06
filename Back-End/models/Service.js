import mongoose from "mongoose";

const Servicechema = new mongoose.Schema({
  id: {
    type: String, unique: true, default: "" 
},
  name: {
    type: String,
    required :true,
    unique: true,
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
        ref: "User",
        required: true
      }
});

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
