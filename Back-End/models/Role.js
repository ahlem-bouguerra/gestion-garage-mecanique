import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // ex: Admin, Mécanicien
  description: { type: String, default: "" },
}, { timestamps: true });

export const Role = mongoose.model("Role", roleSchema , "roles");
