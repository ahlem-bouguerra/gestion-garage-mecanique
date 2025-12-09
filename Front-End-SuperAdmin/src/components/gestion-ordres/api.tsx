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
    // ✅ Gérer les deux formats possibles
const garages = Array.isArray(response.data) 
  ? response.data 
  : (response.data.garages || []);

console.log('📦 Garages à retourner:', garages);
return garages;

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
export const deleteOrdre = async (ordreId: string, garageId?: string) => {
  try {
    const token = getAuthToken();
    
    if (!token || token === 'null' || token === 'undefined') {
      window.location.href = '/auth/sign-in';
      throw new Error("Token invalide");
    }

    console.log('🗑️ Suppression ordre:', ordreId);

    const response = await axios.delete(
      `${API_BASE}/Delete-definitif/${ordreId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: garageId ? { garageId } : {} // Pour SuperAdmin
      }
    );

    console.log('✅ Ordre supprimé:', response.data);
    return response.data;
    
  } catch (error: any) {
    console.error('❌ Erreur deleteOrdre:', error.response?.data || error.message);
    
    if (error.response?.status === 403) {
      throw new Error("Accès refusé : Vous n'avez pas la permission");
    }
    
    if (error.response?.status === 401) {
      window.location.href = '/auth/sign-in';
      throw new Error("Session expirée");
    }
    
    if (error.response?.status === 404) {
      throw new Error("Ordre de travail non trouvé");
    }
    
    throw new Error(error.response?.data?.error || "Erreur lors de la suppression");
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
 */export const getDevisDetails = async (devisId: string, garageId?: string) => {
  try {
    const token = getAuthToken();
    
    if (!token || token === 'null' || token === 'undefined') {
      window.location.href = '/auth/sign-in';
      return;
    }

    const params = garageId ? { garageId } : {};
    
    console.log('📥 Récupération devis:', devisId, 'pour garage:', garageId);
    
    // 🔍 ESSAYEZ CES DIFFÉRENTES ROUTES (une à la fois)
    
    // Option 1: Route avec /code/
    // const url = `${API_BASE}/devis/code/${devisId}`;
    
    // Option 2: Route directe par ID
    const url = `${API_BASE}/devis/${devisId}`;
    
    // Option 3: Route avec query param
    // const url = `${API_BASE}/devis?code=${devisId}`;
    
    console.log('🔗 URL appelée:', url, 'params:', params);
    
    const response = await axios.get(url, {
      params,
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Devis récupéré:', response.data);
    return response.data;

  } catch (error: any) {
    console.error('❌ Erreur getDevisDetails:', error.response?.data || error.message);
    console.error('🔗 URL qui a échoué:', error.config?.url);
    console.error('📋 Status:', error.response?.status);
    console.error('📋 Message backend:', error.response?.data?.error || error.response?.data?.message);
    console.error('💡 Vérifiez que le devis existe dans la BDD avec le bon garageId');
    throw error;
  }
};

/**
 * Vérifier si un ordre existe pour un devis
 */
export const checkOrdreExists = async (devisId: string, garageId?: string) => {
  try {
    const token = getAuthToken();
    
    if (!token || token === 'null' || token === 'undefined') {
      window.location.href = '/auth/sign-in';
      return;
    }

    const params = garageId ? { garageId } : {};
    
    console.log('📥 Vérification ordre pour devis:', devisId);
    
    const response = await axios.get(
      `${API_BASE}/ordre-travail/by-devis/${devisId}`,
      {
        params,
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log('✅ Vérification ordre:', response.data);
    return response.data;

  } catch (error: any) {
    console.error('❌ Erreur checkOrdreExists:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * ⭐ MÉTHODE COMBINÉE : Récupérer devis + vérifier ordre existant
 * Cette fonction combine les deux appels pour donner une réponse complète
 */
export const getDevisByCode = async (devisId: string, garageId?: string) => {
  try {
    console.log('🔍 getDevisByCode appelé avec:', { devisId, garageId });
    
    // 1️⃣ D'ABORD vérifier si un ordre existe (car cet endpoint semble fonctionner)
    const ordreCheck = await checkOrdreExists(devisId, garageId);
    console.log('✅ Vérification ordre:', ordreCheck);
    
    // Si la vérification retourne déjà le devis, on l'utilise
    if (ordreCheck.devis) {
      const result = {
        devis: ordreCheck.devis,
        exists: ordreCheck.exists || false,
        ordre: ordreCheck.ordre || null,
        ordres: ordreCheck.exists && ordreCheck.ordre ? [ordreCheck.ordre] : []
      };
      
      console.log('✅ Résultat (depuis checkOrdreExists):', result);
      return result;
    }
    
    // 2️⃣ Si pas de devis dans ordreCheck, essayer getDevisDetails
    try {
      const devis = await getDevisDetails(devisId, garageId);
      
      const result = {
        devis: devis,
        exists: ordreCheck.exists || false,
        ordre: ordreCheck.ordre || null,
        ordres: ordreCheck.exists && ordreCheck.ordre ? [ordreCheck.ordre] : []
      };
      
      console.log('✅ Résultat combiné:', result);
      return result;
      
    } catch (devisError: any) {
      // Si getDevisDetails échoue mais qu'on a pas d'ordre existant, 
      // c'est que le devis n'existe vraiment pas
      console.error('⚠️ Devis introuvable:', devisError.response?.data);
      throw new Error(devisError.response?.data?.error || 'Devis non trouvé');
    }

  } catch (error: any) {
    console.error('❌ Erreur getDevisByCode:', error.response?.data || error.message);
    throw error;
  }
};
