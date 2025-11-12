import mongoose from "mongoose";

const garagisteRoleSchema = new mongoose.Schema({
  garagisteId: { type: mongoose.Schema.Types.ObjectId, ref: "Garagiste", required: true },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true },
}, { timestamps: true });

garagisteRoleSchema.index({ garagisteId: 1, roleId: 1 }, { unique: true });

export const GaragisteRole = mongoose.model("GaragisteRole", garagisteRoleSchema);
