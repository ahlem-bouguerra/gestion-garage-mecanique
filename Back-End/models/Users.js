import mongoose from "mongoose";

const usersSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },

    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    },
     // Super admin a tous les droits
  isSuperAdmin: {
    type: Boolean,
    default: false
  },


}, {
    timestamps: true
});

usersSchema.index({ email: 1 }, { unique: true });

export const Users = mongoose.model("Users", usersSchema);