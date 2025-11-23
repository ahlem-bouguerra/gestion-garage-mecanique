// api.tsx - VERSION COMPLÈTE ET CORRIGÉE

import axios from 'axios';

// ========== CONFIGURATION ==========
const API_BASE = 'http://localhost:5000/api';

// ========== HELPER : Récupérer le token ==========
const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// ========== TYPES ==========
export interface Garage {
  _id: string;
  nom: string;
  matriculeFiscal: string;
  phone?: string;
  email?: string;
  address?: string;
  garagisteAdmins?: any[];
  createdAt?: string;
}

export interface OrdreTravail {
  _id: string;
  numeroOrdre: string;
  devisId: any;
  garageId?: any;
  atelierId?: any;
  status: string;
  priorite: string;
  dateCommence: string;
  dateFin?: string;
  taches?: any[];
  clientInfo?: {
    nom: string;
    telephone?: string;
    email?: string;
  };
  vehiculedetails?: {
    nom: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  status?: string;
  atelier?: string;
  priorite?: string;
  dateDebut?: string;
  dateFin?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ========== API GARAGES ==========

/**
 * Récupérer tous les garages (SuperAdmin uniquement)
 */
export const getAllGarages = async () => {
  try {
    const token = getAuthToken();
    
    if (!token || token === 'null' || token === 'undefined') {
      window.location.href = '/auth/sign-in';
      return;
    }

    const response = await axios.get(`${API_BASE}/garages`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Garages récupérés:', response.data);
    return response.data.garages;

  } catch (error: any) {
    console.error('❌ Erreur getAllGarages:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Récupérer les ordres d'un garage spécifique
 * ✅ CORRECTION : Utiliser le bon endpoint
 */
export const getOrdresByGarage = async (garageId: string, params?: PaginationParams) => {
  try {
    const token = getAuthToken();
    
    if (!token || token === 'null' || token === 'undefined') {
      window.location.href = '/auth/sign-in';
      return;
    }

    console.log('🔍 Appel API ordres pour garage:', garageId, 'avec params:', params);

    // ✅ CORRECTION : Route correcte avec /
    const response = await axios.get(`${API_BASE}/`, {
      params: { 
        ...params, 
        garageId 
      },
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Ordres récupérés:', response.data);
    return response.data;

  } catch (error: any) {
    console.error('❌ Erreur getOrdresByGarage:', error.response?.data || error.message);
    console.error('URL appelée:', error.config?.url);
    throw error;
  }
};

/**
 * Récupérer un ordre par ID
 */
export const getOrdreById = async (ordreId: string) => {
  try {
    const token = getAuthToken();
    
    if (!token || token === 'null' || token === 'undefined') {
      window.location.href = '/auth/sign-in';
      return;
    }

    const response = await axios.get(
      `${API_BASE}/getOrdreTravailById/${ordreId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    return response.data;

  } catch (error: any) {
    console.error('❌ Erreur getOrdreById:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Récupérer les statistiques
 */
export const getStatistiques = async (garageId?: string) => {
  try {
    const token = getAuthToken();
    
    if (!token || token === 'null' || token === 'undefined') {
      window.location.href = '/auth/sign-in';
      return;
    }

    const params = garageId ? { garageId } : {};
    
    console.log('🔍 Appel API statistiques avec params:', params);
    
    const response = await axios.get(`${API_BASE}/statistiques`, {
      params,
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Statistiques récupérées:', response.data);
    return response.data;

  } catch (error: any) {
    console.error('❌ Erreur getStatistiques:', error.response?.data || error.message);
    console.error('URL appelée:', error.config?.url);
    throw error;
  }
};

/**
 * Créer un ordre de travail
 */
export const createOrdre = async (ordreData: any) => {
  try {
    const token = getAuthToken();
    
    if (!token || token === 'null' || token === 'undefined') {
      window.location.href = '/auth/sign-in';
      return;
    }

    // ✅ Extraire garageId du body pour le mettre dans l'URL
    const { garageId, ...bodyData } = ordreData;

    // ✅ Construire l'URL avec garageId en query param
    const url = garageId 
      ? `${API_BASE}/createOrdre?garageId=${garageId}`
      : `${API_BASE}/createOrdre`;

    console.log('📤 Envoi vers:', url);
    console.log('📦 Body:', bodyData);

    const response = await axios.post(
      url,
      bodyData, // ⚠️ garageId n'est plus dans le body
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      }
    );

    return response.data;

  } catch (error: any) {
    console.error('❌ Erreur createOrdre:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Mettre à jour un ordre de travail
 */
export const updateOrdre = async (ordreId: string, ordreData: any) => {
  try {
    const token = getAuthToken();
    
    if (!token || token === 'null' || token === 'undefined') {
      window.location.href = '/auth/sign-in';
      return;
    }

    const response = await axios.put(
      `${API_BASE}/modifier/${ordreId}`,
      ordreData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      }
    );

    return response.data;

  } catch (error: any) {
    console.error('❌ Erreur updateOrdre:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Supprimer un ordre de travail (soft delete)
 */
export const deleteOrdre = async (ordreId: string) => {
  try {
    const token = getAuthToken();
    
    if (!token || token === 'null' || token === 'undefined') {
      window.location.href = '/auth/sign-in';
      return;
    }

    const response = await axios.delete(
      `${API_BASE}/${ordreId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      }
    );

    return response.data;

  } catch (error: any) {
    console.error('❌ Erreur deleteOrdre:', error.response?.data || error.message);
    throw error;
  }
};
// api.tsx - AJOUTER CES FONCTIONS

/**
 * Récupérer les services (avec support SuperAdmin)
 */
export const getServices = async (garageId?: string) => {
  try {
    const token = getAuthToken();
    
    if (!token || token === 'null' || token === 'undefined') {
      window.location.href = '/auth/sign-in';
      return;
    }

    const params = garageId ? { garageId } : {};
    
    const response = await axios.get(
      `${API_BASE}/services/available-for-mechanics`,
      {
        params,
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    return response.data;

  } catch (error: any) {
    console.error('❌ Erreur getServices:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Récupérer les ateliers (avec support SuperAdmin)
 */
export const getAteliers = async (garageId?: string) => {
  try {
    const token = getAuthToken();
    
    if (!token || token === 'null' || token === 'undefined') {
      window.location.href = '/auth/sign-in';
      return;
    }

    const params = garageId ? { garageId } : {};
    
    const response = await axios.get(
      `${API_BASE}/getAllAteliers`,
      {
        params,
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    return response.data;

  } catch (error: any) {
    console.error('❌ Erreur getAteliers:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Récupérer les mécaniciens par service (avec support SuperAdmin)
 */
export const getMecaniciensByService = async (serviceId: string, garageId?: string) => {
  try {
    if (!serviceId) return [];
    
    const token = getAuthToken();
    
    if (!token || token === 'null' || token === 'undefined') {
      window.location.href = '/auth/sign-in';
      return;
    }

    const params = garageId ? { garageId } : {};
    
    const response = await axios.get(
      `${API_BASE}/mecaniciens/by-service/${serviceId}`,
      {
        params,
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    return response.data;

  } catch (error: any) {
    console.error('❌ Erreur getMecaniciensByService:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Récupérer un devis par code
 */
export const getDevisByCode = async (devisId: string, garageId?: string) => {
  try {
    const token = getAuthToken();
    
    if (!token || token === 'null' || token === 'undefined') {
      window.location.href = '/auth/sign-in';
      return;
    }

    const params = garageId ? { garageId } : {};
    
    const response = await axios.get(
      `${API_BASE}/ordre-travail/by-devis/${devisId}`,
      {
        params,
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    return response.data;

  } catch (error: any) {
    console.error('❌ Erreur getDevisByCode:', error.response?.data || error.message);
    throw error;
  }
};