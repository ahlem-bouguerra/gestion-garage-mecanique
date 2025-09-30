import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
//import authRoutes from "./routes/auth.js";
import passportGarage from "./config/passportGarage.js";
import passportClient from "./config/passportClient.js";
import authGarageRoutes from "./routes/authGarage.js";
import authClientRoutes from "./routes/authClient.js";
import session from "express-session";
// ❌ SUPPRIMEZ cette ligne qui charge l'ancien passport
// import "./config/passport.js";
// ❌ SUPPRIMEZ aussi cet import
// import passport from "passport";

dotenv.config();

const app = express();

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
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

// ❌ SUPPRIMEZ ces deux lignes (ancien passport)
// app.use(passport.initialize());
// app.use(passport.session());

// ✅ Garder uniquement les nouvelles instances Passport
app.use(passportGarage.initialize());
app.use(passportClient.initialize());

// Routes
//app.use('/api', authRoutes);
app.use("/api", authGarageRoutes);
app.use("/api", authClientRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});

app.get("/", (req, res) => {
  res.send("API opérationnelle !");
});