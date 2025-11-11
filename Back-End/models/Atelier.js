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
  garagisteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Garagiste",
    required: true
  }
});

export default mongoose.model("Atelier", Atelierchema);
