import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import passportGarage from "./config/passportGarage.js";
import passportClient from "./config/passportClient.js";
import authGarageRoutes from "./routes/authGarage.js";
import authClientRoutes from "./routes/authClient.js";
import authSuperAdminRoutes from "./routes/authSuperAdmin.js";
import session from "express-session";


dotenv.config();

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000", 
    "http://localhost:3001",
    "http://localhost:3002",
    "http://frontend-admin:3000",
    "http://frontend-client:3001"
  ],
  credentials: true,
}));

app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connecté"))
  .catch((err) => console.error("Erreur MongoDB :", err));

// Sessions (obligatoire pour Passport)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "monSuperSecretUltraSecurise",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  })
);

// ✅ Garder uniquement les nouvelles instances Passport
app.use(passportGarage.initialize());
app.use(passportClient.initialize());

// Routes
app.use("/api", authGarageRoutes);
app.use("/api", authClientRoutes);
app.use("/api", authSuperAdminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});

app.get("/", (req, res) => {
  res.send("API opérationnelle !");
});
