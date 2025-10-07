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
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  garagisteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
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

export default mongoose.model("FicheClient", FicheClientSchema);
