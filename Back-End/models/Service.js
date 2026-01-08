// models/Service.js
import mongoose from "mongoose";

const ServiceSchema = new mongoose.Schema({
  id: {
    type: String, 
    unique: true, 
    default: "" 
  },
  name: {
    type: String,
    required: true,
    unique: true, // Service unique globalement
    trim: true
  },
  description: {
    type: String,
    required: true,
  },
  statut: { 
    type: String,
    required: true,
    enum: ["Actif", "Désactivé"],
    default: "Actif" 
  },
  // Service créé par Super Admin
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  }
}, {
  timestamps: true
});

// Auto-génération ID
ServiceSchema.pre("save", async function (next) {
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

export default mongoose.model("Service", ServiceSchema);