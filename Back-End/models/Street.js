
import mongoose from "mongoose";
const StreetSchema = new mongoose.Schema({
  name: String,
  cityId: mongoose.Schema.Types.ObjectId
});
export default mongoose.model("Street", StreetSchema);
