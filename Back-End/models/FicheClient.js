// models/Client.js
import mongoose from "mongoose";

const FicheClientSchema = new mongoose.Schema({

  nom: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["particulier", "professionnel"],
    required: true,
  },
  adresse: {
    type: String,
    required: false,
  },
  telephone: {
    type: String,
    required: true,

  },
  email: {
    type: String,
    required: true,
  },

  garageId: {
     type: mongoose.Schema.Types.ObjectId, ref: 'Garage', required: true 
  },

  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: false
  },
  nomSociete: {
    type: String
  },
  telephoneSociete: {
    type: String
  },
  emailSociete: {
    type: String
  },
  adresseSociete: {
    type: String
  }
  //derniereVisite: String, // ou Date si tu veux
  //  vehiculeAssocie:{
  //  type: String,
  //   required: true,
  //  },
  //contactsSecondaires: [
  // {
  //   nom: String,
  //   relation: String,
  //  telephone: String,
  //   email: String
  // }
  // ],
  // historiqueVisites: [
  //  {
  //    date: String, // ou Date
  //    service: String,
  //montant: String
  //  }
  // ]
});

FicheClientSchema.index({ nom: 1, garageId: 1 }, { unique: true });
FicheClientSchema.index({ email: 1, garageId: 1 }, { unique: true });
FicheClientSchema.index({ telephone: 1, garageId: 1 }, { unique: true });

// Virtual pour obtenir le nom effectif du client
FicheClientSchema.virtual('nomEffectif').get(function() {
  // Si clientId existe et est populé, utiliser Client.username
  if (this.clientId && this.clientId.username) {
    return this.clientId.username;
  }
  // Sinon utiliser le nom de FicheClient
  return this.nom;
});

// Pour que les virtuals apparaissent dans JSON
FicheClientSchema.set('toJSON', { virtuals: true });
FicheClientSchema.set('toObject', { virtuals: true });
export default mongoose.model("FicheClient", FicheClientSchema);
