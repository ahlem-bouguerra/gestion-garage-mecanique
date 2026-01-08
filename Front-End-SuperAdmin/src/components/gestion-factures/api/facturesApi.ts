// api.tsx - VERSION COMPLÈTE ET CORRIGÉE

import axios from 'axios';

// ========== CONFIGURATION ==========
const API_BASE = 'http://localhost:5000/api';

// ========== HELPER : Récupérer le token ==========
const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// ========== TYPES ==========




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

export const getAllGarages = async () => {
  try {
    const token = getAuthToken();
    console.log("🔑 Token récupéré:", token ? `${token.substring(0, 20)}...` : 'AUCUN TOKEN');

    const url = `${API_BASE}/garages`;
    console.log("🌐 Appel API:", url);

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("📦 Réponse complète:", response);
    console.log("📦 Status:", response.status);
    console.log("📦 Data:", response.data);

    // ⚠️ Vérifier la structure de la réponse
    if (!response.data) {
      throw new Error("Réponse vide du serveur");
    }

    if (!response.data.garages) {
      console.warn("⚠️ Pas de propriété 'garages' dans la réponse:", response.data);
      // Si le backend renvoie directement un array
      return Array.isArray(response.data) ? response.data : [];
    }

    return response.data.garages;

  } catch (error: any) {
    console.error("❌ Erreur getAllGarages:");
    console.error("  - Message:", error.message);
    console.error("  - Response status:", error.response?.status);
    console.error("  - Response data:", error.response?.data);
    console.error("  - Request config:", error.config);
    
    throw error;
  }
};

export const getFacturesByGarage = async (garageId: string) => {
  try {
    const token = getAuthToken();
    
    // 👇 garageId passé en query parameter
    const response = await axios.get(`${API_BASE}/getFactures`, {
      params: { garageId }, // 👈 Important: params pas dans l'URL
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data;
  } catch (error: any) {
    console.error('❌ Erreur getFacturesByGarage:', error);
    throw error;
  }
};

export const getStatsByGarage = async (garageId: string) => {
  try {
    const token = getAuthToken();
    
    const response = await axios.get(`${API_BASE}/stats/summary`, {
      params: { garageId }, // 👈 Pareil ici
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data;
  } catch (error: any) {
    console.error('❌ Erreur getStatsByGarage:', error);
    throw error;
  }
};

export const getFacturesDetails = async (factureId: string, garageId:string) => {
  try {
    const token = getAuthToken();
    
    // 👇 garageId passé en query parameter
    const response = await axios.get(`${API_BASE}/getFacture/${factureId}`, {
      params: { garageId }, // 👈 Important: params pas dans l'URL
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data;
  } catch (error: any) {
    console.error('❌ Erreur getFacturesByid:', error);
    throw error;
  }
};

export const payFacture = async (factureId: string, paymentData: any) => {
  const token = localStorage.getItem("token");
  
  console.log("🔍 payFacture - Début");
  console.log("📌 factureId:", factureId);
  console.log("📦 paymentData:", paymentData);
  console.log("🔑 Token:", token ? `${token.substring(0, 20)}...` : "AUCUN");

  if (!token) {
    throw new Error("Token d'authentification manquant. Veuillez vous reconnecter.");
  }

  const url = `http://localhost:5000/api/${factureId}/payment`;
  console.log("🌐 URL complète:", url);

  try {
    const response = await axios.put(
      url,
      paymentData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log("✅ Réponse:", response.data);
    return response.data;
    
  } catch (error: any) {
    console.error("❌ Erreur complète:", error);
    console.error("❌ Response:", error.response?.data);
    console.error("❌ Status:", error.response?.status);
    console.error("❌ URL appelée:", url);
    throw error;
  }
};