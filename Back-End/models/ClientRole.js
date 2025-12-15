import mongoose from "mongoose";

const clientRoleSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true },
}, { timestamps: true });

clientRoleSchema.index({ clientId: 1, roleId: 1 }, { unique: true });

export const ClientRole = mongoose.model("ClientRole", clientRoleSchema , "clientroles");
