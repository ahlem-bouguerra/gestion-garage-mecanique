import mongoose from "mongoose";

const Atelierchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  localisation: {
    type: String,
    required :true
  },
garageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Garage', required: true }
});

export default mongoose.model("Atelier", Atelierchema);
