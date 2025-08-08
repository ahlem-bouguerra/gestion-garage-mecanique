import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import session from "express-session";
import "./config/passport.js"; // important : charge la config Google
import passport from "passport";

dotenv.config();

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connecté"))
  .catch((err) => console.error("Erreur MongoDB :", err));



// Sessions (obligatoire pour Passport avec session)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "monSuperSecretUltraSecurise",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // mettre true si HTTPS
  })
);

// Initialisation Passport
app.use(passport.initialize());
app.use(passport.session());

app.use('/api', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});

app.get("/", (req, res) => {
  res.send("API opérationnelle !");
});
