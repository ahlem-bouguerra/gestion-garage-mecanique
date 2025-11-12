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
        required: function () {
            return !this.googleId;
        }
    },
    phone: {
        type: String,
        required: function () {
            return !this.googleId;
        }
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
    default: true
  },


}, {
    timestamps: true
});

usersSchema.index({ email: 1 }, { unique: true });

export const Users = mongoose.model("Users", usersSchema);