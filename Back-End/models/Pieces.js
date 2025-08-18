import mongoose from "mongoose";

const PieceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  prix: {
    type: Number,
    required: true,
    min: 0 // ✅ interdit les prix négatifs
  }
});

export default mongoose.model("Piece", PieceSchema);
