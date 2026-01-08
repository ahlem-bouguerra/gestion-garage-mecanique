import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // ex: create_employee
  description: { type: String, default: "" },
}, { timestamps: true });

export const Permission = mongoose.model("Permission", permissionSchema);
