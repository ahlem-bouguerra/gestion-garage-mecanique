import axios from 'axios';

// Configuration de base
export const API_BASE = 'http://localhost:5000/api';

// Créer une instance Axios personnalisée
const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter automatiquement le token à chaque requête
axiosInstance.interceptors.request.use(
  (config) => {
    // Récupérer le token depuis localStorage ou sessionStorage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Token ajouté à la requête:', config.url);
    } else {
      console.warn('⚠️ Aucun token trouvé pour:', config.url);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Erreur intercepteur request:', error);
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Erreurs HTTP (401, 403, 500, etc.)
      const status = error.response.status;
      const message = error.response.data?.message || 'Erreur serveur';
      
      console.error(`❌ Erreur ${status}:`, message);
      
      // Gérer l'expiration du token
      if (status === 401) {
        console.warn('🔒 Token expiré ou invalide - Redirection vers login');
        
        // Nettoyer le localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        
        // Rediriger vers la page de connexion (ajustez selon votre routing)
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      
      // Gérer les accès refusés
      if (status === 403) {
        console.warn('🚫 Accès refusé:', message);
      }
    } else if (error.request) {
      // La requête a été envoyée mais pas de réponse
      console.error('❌ Pas de réponse du serveur:', error.request);
    } else {
      // Erreur lors de la configuration de la requête
      console.error('❌ Erreur configuration:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;