import mongoose from "mongoose";
import { Garagiste } from "./Garagiste.js";
import { Permission } from "./Permission.js";

const GaragistePermissionSchema = new mongoose.Schema({
  GaragisteId: { type: mongoose.Schema.Types.ObjectId, ref: "Garagiste", required: true },
  permissionId: { type: mongoose.Schema.Types.ObjectId, ref: "Permission", required: true },
}, { timestamps: true });

GaragistePermissionSchema.index({ GaragisteId: 1, permissionId: 1 }, { unique: true });

export const GaragistePermission = mongoose.model("GaragistePermission", GaragistePermissionSchema);
