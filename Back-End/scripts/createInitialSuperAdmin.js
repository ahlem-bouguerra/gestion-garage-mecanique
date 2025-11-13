// scripts/createInitialSuperAdmin.js
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { Users } from "../models/Users.js";

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const email = process.env.INIT_SUPERADMIN_EMAIL;

  const existing = await Users.findOne({ email });
  if (existing) {
    console.log("SuperAdmin déjà présent :", email);
    process.exit(0);
  }

  const hashed = await bcrypt.hash(process.env.INIT_SUPERADMIN_PASSWORD, 10);
  const user = await Users.create({
    username: process.env.INIT_SUPERADMIN_USERNAME,
    email,
    password: hashed,
    phone: "",
    isVerified: true,
    isSuperAdmin: true
  });

  console.log("SuperAdmin créé :", user.email);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
