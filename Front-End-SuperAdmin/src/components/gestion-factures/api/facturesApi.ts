// api.tsx - VERSION AVEC LOGS DÉTAILLÉS POUR DEBUG

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

    console.log("📦 Réponse getAllGarages complète:", response);
    console.log("📦 Status:", response.status);
    console.log("📦 Data brute:", response.data);
    console.log("📦 Type de data:", typeof response.data);
    console.log("📦 Keys de data:", Object.keys(response.data));

    // ⚠️ Vérifier la structure de la réponse
    if (!response.data) {
      throw new Error("Réponse vide du serveur");
    }

    // 👇 VÉRIFICATION DÉTAILLÉE
    if (response.data.garages) {
      console.log("✅ Propriété 'garages' trouvée");
      console.log("📊 Nombre de garages:", response.data.garages.length);
      console.log("📋 Premier garage:", response.data.garages[0]);
      return response.data.garages;
    }

    // Si pas de propriété 'garages', vérifier si c'est un array direct
    if (Array.isArray(response.data)) {
      console.log("✅ Data est un array direct");
      console.log("📊 Nombre d'éléments:", response.data.length);
      return response.data;
    }

    console.warn("⚠️ Structure inattendue:", response.data);
    return [];

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
    
    console.log("🔍 getFacturesByGarage - garageId:", garageId);
    
    const response = await axios.get(`${API_BASE}/getFactures`, {
      params: { garageId },
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("📦 Réponse getFacturesByGarage:", response.data);
    console.log("📦 Type de response.data:", typeof response.data);
    console.log("📦 Keys:", Object.keys(response.data));
    
    // 👇 AJOUT DE LOGS DÉTAILLÉS
    if (response.data.data) {
      console.log("✅ Propriété 'data' trouvée");
      console.log("📊 Type de data.data:", typeof response.data.data);
      console.log("📊 Est un array?", Array.isArray(response.data.data));
      console.log("📊 Nombre de factures:", response.data.data?.length);
      console.log("📋 Première facture:", response.data.data?.[0]);
    }

    return response.data;
  } catch (error: any) {
    console.error('❌ Erreur getFacturesByGarage:', error);
    console.error('❌ Response:', error.response?.data);
    throw error;
  }
};

export const getStatsByGarage = async (garageId: string) => {
  try {
    const token = getAuthToken();
    
    console.log("🔍 getStatsByGarage - garageId:", garageId);
    
    const response = await axios.get(`${API_BASE}/stats/summary`, {
      params: { garageId },
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("📊 Réponse stats:", response.data);
    console.log("📊 Keys:", Object.keys(response.data));
    
    if (response.data.data) {
      console.log("✅ Stats détaillées:", response.data.data);
    }

    return response.data;
  } catch (error: any) {
    console.error('❌ Erreur getStatsByGarage:', error);
    throw error;
  }
};

export const getFacturesDetails = async (factureId: string, garageId: string) => {
  try {
    const token = getAuthToken();
    
    console.log("🔍 getFacturesDetails - factureId:", factureId, "garageId:", garageId);
    
    const response = await axios.get(`${API_BASE}/getFacture/${factureId}`, {
      params: { garageId },
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("📦 Détails facture:", response.data);

    return response.data;
  } catch (error: any) {
    console.error('❌ Erreur getFacturesDetails:', error);
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

    console.log("✅ Réponse paiement:", response.data);
    return response.data;
    
  } catch (error: any) {
    console.error("❌ Erreur complète:", error);
    console.error("❌ Response:", error.response?.data);
    console.error("❌ Status:", error.response?.status);
    console.error("❌ URL appelée:", url);
    throw error;
  }
};