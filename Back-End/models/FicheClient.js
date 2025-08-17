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
    required: true,
  },
   telephone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  //derniereVisite: String, // ou Date si tu veux
  vehiculeAssocie:{
    type: String,
    required: true,
  },
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

export default mongoose.model("FicheClient", FicheClientSchema);
