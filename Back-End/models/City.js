// models/City.js
import mongoose from "mongoose";

const CitySchema = new mongoose.Schema({
  name: String,
  nameAr: String,
  governorateId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Governorate'  // ✅ AJOUTEZ CETTE LIGNE
  },
  postalCode: String,
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: [Number] // [longitude, latitude]
  }
});

export default mongoose.model("City", CitySchema);
