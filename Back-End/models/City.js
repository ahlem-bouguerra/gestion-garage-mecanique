// models/City.js
import mongoose from "mongoose";

const CitySchema = new mongoose.Schema({
  name: String,
  nameAr: String,
  governorateId: mongoose.Schema.Types.ObjectId,
  postalCode: String,
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: [Number] // [longitude, latitude]
  }
});

export default mongoose.model("City", CitySchema);
