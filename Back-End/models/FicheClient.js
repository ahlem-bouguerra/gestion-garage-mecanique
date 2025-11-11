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
  garagisteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Garagiste",
    required: true
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

FicheClientSchema.index({ nom: 1, garagisteId: 1 }, { unique: true });
FicheClientSchema.index({ email: 1, garagisteId: 1 }, { unique: true });
FicheClientSchema.index({ telephone: 1, garagisteId: 1 }, { unique: true });

export default mongoose.model("FicheClient", FicheClientSchema);
