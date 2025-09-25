import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Fonction pour récupérer le token d'authentification
const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// Fonction pour créer les headers d'authentification
const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${getAuthToken()}`
  }
});

export const ordresTravailAPI = {
  // Récupérer un devis par code avec vérification d'ordres existants
  async getDevisByCode(devisId) {
    const response = await axios.get(`${API_BASE_URL}/devis/code/${devisId}`, getAuthHeaders());
    return response.data;
  },

  // Créer un nouvel ordre de travail
  async createOrdre(ordreData) {
    const response = await axios.post(`${API_BASE_URL}/createOrdre`, ordreData, getAuthHeaders());
    return response.data;
  },

  // Récupérer tous les ordres avec pagination et filtres
  async getOrdres({ page = 1, limit = 10, filters = {} }) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });

    let baseUrl = API_BASE_URL;
    let response;

    // Construire l'URL selon les filtres
    if (filters.status) {
      baseUrl = `${API_BASE_URL}/ordres/status/${filters.status}`;
      const statusParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      response = await axios.get(`${baseUrl}?${statusParams}`, getAuthHeaders());
    } else if (filters.atelier) {
      baseUrl = `${API_BASE_URL}/ordres/atelier/${filters.atelier}`;
      const atelierParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      response = await axios.get(`${baseUrl}?${atelierParams}`, getAuthHeaders());
    } else {
      response = await axios.get(`${baseUrl}?${params}`, getAuthHeaders());
    }

    // Normaliser la structure de réponse
    if (response.data.ordres) {
      return {
        ordres: response.data.ordres,
        pagination: {
          page: response.data.page || page,
          limit: response.data.limit || limit,
          total: response.data.total || 0,
          totalPages: Math.ceil((response.data.total || 0) / limit)
        }
      };
    } else {
      // Si c'est un tableau direct
      const ordres = Array.isArray(response.data) ? response.data : [];
      return {
        ordres,
        pagination: {
          page,
          limit,
          total: ordres.length,
          totalPages: Math.ceil(ordres.length / limit)
        }
      };
    }
  },

  // Récupérer les ordres par statut
  async getOrdresByStatus(status, page = 1, limit = 10) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    const response = await axios.get(`${API_BASE_URL}/ordres/status/${status}?${params}`, getAuthHeaders());
    return response.data;
  },

  // Récupérer les ordres par atelier
  async getOrdresByAtelier(atelierId, page = 1, limit = 10) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    const response = await axios.get(`${API_BASE_URL}/ordres/atelier/${atelierId}?${params}`, getAuthHeaders());
    return response.data;
  },

  // Récupérer les détails d'un ordre
  async getOrdreDetails(ordreId) {
    const response = await axios.get(`${API_BASE_URL}/getOrdreTravailById/${ordreId}`, getAuthHeaders());
    
    // Normaliser la réponse - certaines APIs retournent { success: true, ordre: {} }
    if (response.data.success && response.data.ordre) {
      return response.data.ordre;
    } else if (response.data.ordre) {
      return response.data.ordre;
    } else {
      return response.data;
    }
  },

  // Démarrer un ordre
  async demarrerOrdre(ordreId) {
    const response = await axios.put(`${API_BASE_URL}/ordre-travail/${ordreId}/demarrer`, {}, getAuthHeaders());
    return response.data;
  },

  // Terminer un ordre
  async terminerOrdre(ordreId) {
    const response = await axios.put(`${API_BASE_URL}/ordre-travail/${ordreId}/terminer`, {}, getAuthHeaders());
    return response.data;
  },

  // Modifier le statut d'un ordre
  async updateStatusOrdre(ordreId, status) {
    const response = await axios.put(`${API_BASE_URL}/${ordreId}/status`, { status }, getAuthHeaders());
    return response.data;
  },

  // Modifier un ordre
  async updateOrdre(ordreId, updateData) {
    const response = await axios.put(`${API_BASE_URL}/modifier/${ordreId}`, updateData, getAuthHeaders());
    return response.data;
  },

  // Supprimer un ordre (soft delete)
  async deleteOrdre(ordreId) {
    const response = await axios.delete(`${API_BASE_URL}/${ordreId}`, getAuthHeaders());
    return response.data;
  },

  // Récupérer les ordres supprimés
  async getOrdresSupprimes(page = 1, limit = 10) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    const response = await axios.get(`${API_BASE_URL}/ordres/status/supprime?${params}`, getAuthHeaders());
    return response.data;
  },

  // Vérifier si un ordre existe pour un devis
  async getOrdresParDevisId(devisId) {
    const response = await axios.get(`${API_BASE_URL}/ordre-travail/by-devis/${devisId}`, getAuthHeaders());
    return response.data;
  },

  // Récupérer les statistiques
  async getStatistiques() {
    const response = await axios.get(`${API_BASE_URL}/statistiques`, getAuthHeaders());
    
    // Normaliser la réponse
    if (response.data.success && response.data.statistiques) {
      return response.data.statistiques;
    } else if (response.data.statistiques) {
      return response.data.statistiques;
    } else {
      return response.data;
    }
  },

  // Services auxiliaires
  async getServices() {
    const response = await axios.get('http://localhost:5000/api/getAllServices', getAuthHeaders());
    return response.data;
  },

  async getAteliers() {
    const response = await axios.get('http://localhost:5000/api/getAllAteliers', getAuthHeaders());
    return response.data;
  },

  async getMecaniciensByService(serviceId) {
    if (!serviceId) {
      return [];
    }
    const response = await axios.get(`http://localhost:5000/api/mecaniciens/by-service/${serviceId}`, getAuthHeaders());
    return response.data;
  }
};

// Configuration par défaut d'Axios pour gérer les erreurs
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Erreur API:', error);
    
    // Gérer les erreurs d'authentification
    if (error.response?.status === 401) {
      // Token expiré ou invalide - rediriger vers login
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject({ message: 'Session expirée, veuillez vous reconnecter' });
    }
    
    // Personnaliser les messages d'erreur
    if (error.response) {
      const message = error.response.data?.error || error.response.data?.message || 'Erreur serveur';
      error.message = message;
    } else if (error.request) {
      error.message = 'Impossible de contacter le serveur';
    }
    
    return Promise.reject(error);
  }
);

// Intercepteur pour ajouter automatiquement le token à toutes les requêtes
axios.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);