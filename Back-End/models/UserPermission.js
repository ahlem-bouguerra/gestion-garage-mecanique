import mongoose from "mongoose";

const userPermissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Garagiste", required: true },
  permissionId: { type: mongoose.Schema.Types.ObjectId, ref: "Permission", required: true },
}, { timestamps: true });

userPermissionSchema.index({ userId: 1, permissionId: 1 }, { unique: true });

export const UserPermission = mongoose.model("UserPermission", userPermissionSchema);
