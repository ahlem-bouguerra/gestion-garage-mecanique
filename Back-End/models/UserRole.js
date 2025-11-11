import mongoose from "mongoose";

const userRoleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true },
}, { timestamps: true });

userRoleSchema.index({ userId: 1, roleId: 1 }, { unique: true });

export const UserRole = mongoose.model("UserRole", userRoleSchema);
