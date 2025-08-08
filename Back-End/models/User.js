// Dans votre modèle User.js, ajoutez le champ isVerified

import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
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
  required: function() {
    return !this.googleId;
  }
  },
  phone: {
  type: String,
  required: function() {
    return !this.googleId;
  }
},
  token: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false  // Par défaut, le compte n'est pas vérifié
  },
  googleId: {
  type: String,
  unique: true,
  sparse: true,  // pour autoriser plusieurs documents sans googleId
  default: null,
},

}, {
  timestamps: true
});

export const User = mongoose.model("User", userSchema);