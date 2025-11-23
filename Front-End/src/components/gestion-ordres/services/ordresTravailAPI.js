import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// ========== HELPERS ==========
const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

const getAuthHeaders = () => {
  const token = getAuthToken();
  if (!token || token === 'null' || token === 'undefined') {
    window.location.href = '/auth/sign-in';
    throw new Error("Token invalide");
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

// ========== API ORDRES DE TRAVAIL ==========
export const ordresTravailAPI = {
  // ✅ RÉCUPÉRER TOUS LES ORDRES
  async getOrdres({ page = 1, limit = 10, filters = {} }) {
    try {
      const params = {
        page: page.toString(),
        limit: limit.toString(),
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      if (filters.status) params.status = filters.status;
      if (filters.atelier) params.atelier = filters.atelier;
      if (filters.priorite) params.priorite = filters.priorite;
      if (filters.garageId) params.garageId = filters.garageId;

      // Route backend: router.get('/', ...) montée sur /api
      const response = await axios.get(`${API_BASE_URL}/`, {
        params,
        ...getAuthHeaders()
      });

      return {
        ordres: response.data.ordres || [],
        pagination: response.data.pagination || {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          totalPages: 0
        }
      };
    } catch (error) {
      console.error('❌ Erreur getOrdres:', error);
      throw error;
    }
  },

  // ✅ RÉCUPÉRER UN ORDRE PAR ID
  async getOrdreDetails(ordreId) {
    try {
      // Route backend: router.get('/getOrdreTravailById/:id', ...)
      const response = await axios.get(
        `${API_BASE_URL}/getOrdreTravailById/${ordreId}`,
        getAuthHeaders()
      );
      
      if (response.data.success && response.data.ordre) {
        return response.data.ordre;
      }
      return response.data.ordre || response.data;
    } catch (error) {
      console.error('❌ Erreur getOrdreDetails:', error);
      throw error;
    }
  },

  // ✅ CRÉER UN ORDRE
  async createOrdre(ordreData) {
    try {
      // Route backend: router.post('/createOrdre', ...)
      const response = await axios.post(
        `${API_BASE_URL}/createOrdre`,
        ordreData,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('❌ Erreur createOrdre:', error);
      throw error;
    }
  },

  // ✅ MODIFIER UN ORDRE
  async updateOrdre(ordreId, updateData) {
    try {
      // Route backend: router.put('/modifier/:id', ...)
      const response = await axios.put(
        `${API_BASE_URL}/modifier/${ordreId}`,
        updateData,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('❌ Erreur updateOrdre:', error);
      throw error;
    }
  },

  // ✅ DÉMARRER UN ORDRE
  async demarrerOrdre(ordreId) {
    try {
      // Route backend: router.put('/ordre-travail/:id/demarrer', ...)
      const response = await axios.put(
        `${API_BASE_URL}/ordre-travail/${ordreId}/demarrer`,
        {},
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('❌ Erreur demarrerOrdre:', error);
      throw error;
    }
  },

  // ✅ TERMINER UN ORDRE
  async terminerOrdre(ordreId) {
    try {
      // Route backend: router.put('/ordre-travail/:id/terminer', ...)
      const response = await axios.put(
        `${API_BASE_URL}/ordre-travail/${ordreId}/terminer`,
        {},
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('❌ Erreur terminerOrdre:', error);
      throw error;
    }
  },

  // ✅ SUPPRIMER UN ORDRE
  async deleteOrdre(ordreId) {
    try {
      // Route backend: router.delete('/:id', ...)
      const response = await axios.delete(
        `${API_BASE_URL}/${ordreId}`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('❌ Erreur deleteOrdre:', error);
      throw error;
    }
  },

  // ✅ RÉCUPÉRER LES STATISTIQUES
  async getStatistiques(garageId = null) {
    try {
      const params = garageId ? { garageId } : {};
      // Route backend: router.get('/statistiques', ...)
      const response = await axios.get(`${API_BASE_URL}/statistiques`, {
        params,
        ...getAuthHeaders()
      });
      
      if (response.data.success && response.data.statistiques) {
        return response.data.statistiques;
      }
      return response.data.statistiques || response.data;
    } catch (error) {
      console.error('❌ Erreur getStatistiques:', error);
      throw error;
    }
  },

  // ✅ RÉCUPÉRER UN DEVIS PAR CODE
  async getDevisByCode(devisId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/devis/code/${devisId}`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getDevisByCode:', error);
      throw error;
    }
  },

  // ✅ RÉCUPÉRER ORDRES PAR DEVIS ID
  async getOrdresParDevisId(devisId) {
    try {
      // Route backend: router.get('/ordre-travail/by-devis/:devisId', ...)
      const response = await axios.get(
        `${API_BASE_URL}/ordre-travail/by-devis/${devisId}`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getOrdresParDevisId:', error);
      throw error;
    }
  },

  // ✅ RÉCUPÉRER ORDRES PAR STATUT
  async getOrdresByStatus(status, page = 1, limit = 10) {
    try {
      const params = { page: page.toString(), limit: limit.toString() };
      // Route backend: router.get("/ordres/status/:status", ...)
      const response = await axios.get(
        `${API_BASE_URL}/ordres/status/${status}`,
        {
          params,
          ...getAuthHeaders()
        }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getOrdresByStatus:', error);
      throw error;
    }
  },

  // ✅ RÉCUPÉRER ORDRES SUPPRIMÉS
  async getOrdresSupprimes(page = 1, limit = 10) {
    try {
      const params = { page: page.toString(), limit: limit.toString() };
      // Route backend: router.get('/ordres/status/supprime', ...)
      const response = await axios.get(
        `${API_BASE_URL}/ordres/status/supprime`,
        {
          params,
          ...getAuthHeaders()
        }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getOrdresSupprimes:', error);
      throw error;
    }
  },

  // ✅ RÉCUPÉRER ORDRES PAR ATELIER
  async getOrdresByAtelier(atelierId, page = 1, limit = 10) {
    try {
      const params = { page: page.toString(), limit: limit.toString() };
      // Route backend: router.get("/ordres/atelier/:atelierId", ...)
      const response = await axios.get(
        `${API_BASE_URL}/ordres/atelier/${atelierId}`,
        {
          params,
          ...getAuthHeaders()
        }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getOrdresByAtelier:', error);
      throw error;
    }
  },

  // ========== SERVICES AUXILIAIRES ==========

  async getServices() {
    try {
      const response = await axios.get(
        'http://localhost:5000/api/services/available-for-mechanics',
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getServices:', error);
      throw error;
    }
  },

async getAteliers() {
  try {
    const response = await axios.get(
      'http://localhost:5000/api/getAllAteliers',
      getAuthHeaders()
    );
    // ✅ Retourner le tableau d'ateliers, pas l'objet complet
    return response.data.ateliers || [];
  } catch (error) {
    console.error('❌ Erreur getAteliers:', error);
    throw error;
  }
},

  async getMecaniciensByService(serviceId) {
    try {
      if (!serviceId) return [];
      
      const response = await axios.get(
        `http://localhost:5000/api/mecaniciens/by-service/${serviceId}`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getMecaniciensByService:', error);
      throw error;
    }
  }
};

// ========== INTERCEPTEURS AXIOS ==========

axios.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token && token !== 'null' && token !== 'undefined') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ Erreur API:', error);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      window.location.href = '/auth/sign-in';
      return Promise.reject({ message: 'Session expirée, veuillez vous reconnecter' });
    }
    
    if (error.response) {
      const message = error.response.data?.error || 
                     error.response.data?.message || 
                     'Erreur serveur';
      error.message = message;
    } else if (error.request) {
      error.message = 'Impossible de contacter le serveur';
    }
    
    return Promise.reject(error);
  }
);

export default ordresTravailAPI;