import mongoose from "mongoose";

const userRoleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true },
}, { timestamps: true });

// Empêcher la duplication (un user ne peut pas avoir deux fois le même rôle)
userRoleSchema.index({ userId: 1, roleId: 1 }, { unique: true });

export const UserRole = mongoose.model("UserRole", userRoleSchema);
