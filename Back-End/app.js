// app.js - Configuration de l'application Express (pour les tests)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importer les routes
import authSuperAdminRoutes from "./routes/authSuperAdmin.js";

// Charger les variables d'environnement
dotenv.config();

const app = express();

// Middlewares globaux
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', authSuperAdminRoutes);

// Route de base pour vérifier que l'API fonctionne
app.get('/', (req, res) => {
  res.json({ message: 'API Garage Management' });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Erreur de validation',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  // Erreur de duplication (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      message: `Le champ ${field} existe déjà`
    });
  }
  
  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Token invalide' });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expiré' });
  }
  
  // Erreur générique
  res.status(err.status || 500).json({
    message: err.message || 'Erreur serveur interne'
  });
});

export default app;