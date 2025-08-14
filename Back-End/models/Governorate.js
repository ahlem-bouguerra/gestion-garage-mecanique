// models/Governorate.js
import mongoose from "mongoose";
const GovernorateSchema = new mongoose.Schema({ 
  name: String,
  nameAr: String // Nom en arabe pour support multilingue
});
export default mongoose.model("Governorate", GovernorateSchema);

