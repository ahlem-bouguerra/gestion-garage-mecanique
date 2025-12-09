import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// ✅ Fonction utilitaire pour vérifier le token
const validateToken = () => {
  const token = getAuthToken();
  if (!token || token === 'null' || token === 'undefined') {
    console.error('❌ Token invalide ou absent');
    window.location.href = '/auth/sign-in';
    throw new Error('Token invalide');
  }
  return token;
};

// ✅ Fonction utilitaire pour gérer les erreurs
const handleApiError = (error: any, context: string) => {
  console.error(`❌ Erreur ${context}:`, error);
  
  if (error.response?.status === 403) {
    alert("❌ Accès refusé : Vous n'avez pas la permission");
    throw error;
  }
  
  if (error.response?.status === 401) {
    alert("❌ Session expirée : Veuillez vous reconnecter");
    window.location.href = '/auth/sign-in';
    throw error;
  }
  
  throw error;
};

export const getAllGarages = async () => {
  try {
    const token = validateToken();
    
    console.log('🔄 Récupération des garages...');
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
    handleApiError(error, 'getAllGarages');
    return []; // Retourner un tableau vide en cas d'erreur
  }
};

export const getDevisByGarage = async (garageId: string) => {
  try {
    const token = validateToken();
    
    console.log('🔄 Récupération des devis pour garage:', garageId);
    const response = await axios.get(`${API_BASE}/garage-devis/${garageId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Devis récupérés:', response.data);
    return response.data || [];

  } catch (error: any) {
    handleApiError(error, 'getDevisByGarage');
    return []; // Retourner un tableau vide en cas d'erreur
  }
};

export const getDevisById = async (devisId: string) => {
  try {
    const token = validateToken();
    
    console.log('🔄 Récupération du devis:', devisId);
    const response = await axios.get(`${API_BASE}/devis/${devisId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Devis récupéré:', response.data);
    return response.data;

  } catch (error: any) {
    handleApiError(error, 'getDevisById');
    return null;
  }
};

export const getAllGarageClients = async (garageId?: string) => {
  try {
    const token = validateToken();
    
    let url = 'http://localhost:5000/api/GetAll';
    if (garageId) {
      url += `?garageId=${garageId}`;
    }

    console.log('🔄 Récupération des clients...');
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Clients récupérés:', response.data);
    return response.data || [];

  } catch (error: any) {
    handleApiError(error, 'getAllGarageClients');
    return [];
  }
};

export const loadVehiculesByClient = async (clientId: string, garageId?: string) => {
  if (!clientId) {
    console.warn('⚠️ clientId manquant');
    return [];
  }

  try {
    const token = validateToken();
    
    let url = `http://localhost:5000/api/vehicules/proprietaire/${clientId}`;
    if (garageId) {
      url += `?garageId=${garageId}`;
    }

    console.log('🔄 Récupération des véhicules pour client:', clientId);
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Véhicules récupérés:', response.data);
    return response.data || [];

  } catch (error: any) {
    handleApiError(error, 'loadVehiculesByClient');
    return [];
  }
};

export const createDevisForGarage = async (garageId: string, devisData: any) => {
  try {
    const token = validateToken();

    const dataWithGarageId = {
      ...devisData,
      garageId: garageId
    };

    console.log('🔄 Création du devis pour garage:', garageId);
    const response = await axios.post(
      `${API_BASE}/createdevis`,
      dataWithGarageId,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log('✅ Devis créé:', response.data);
    return response.data;

  } catch (error: any) {
    handleApiError(error, 'createDevisForGarage');
    return null;
  }
};

export const updateDevis = async (devisId: string, devisData: any) => {
  try {
    const token = validateToken();
    
    console.log('🔄 Mise à jour du devis:', devisId);
    const response = await axios.put(
      `http://localhost:5000/api/Devis/${devisId}`,
      devisData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      }
    );
    
    console.log('✅ Devis mis à jour:', response.data);
    return response.data;
    
  } catch (error: any) {
    handleApiError(error, 'updateDevis');
    throw error;
  }
};

export const deleteDevis = async (devisId: string) => {
  try {
    const token = validateToken();
    
    console.log('🔄 Suppression du devis:', devisId);
    const response = await axios.delete(
      `http://localhost:5000/api/deleteDevis/${devisId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      }
    );
    
    console.log('✅ Devis supprimé:', response.data);
    return response.data;
    
  } catch (error: any) {
    handleApiError(error, 'deleteDevis');
    throw error;
  }
};

export const sendDevisByMail = async (devisId: string, garageId: string) => {
  try {
    const token = validateToken();
    
    console.log('🔄 Envoi du devis par mail:', devisId, 'garage:', garageId);
    const response = await axios.post(
      `http://localhost:5000/api/devis/${devisId}/send-email`,
      { garageId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      }
    );
    
    console.log('✅ Devis envoyé:', response.data);
    return response.data;
    
  } catch (error: any) {
    handleApiError(error, 'sendDevisByMail');
    throw error;
  }
};

export const checkActiveFactureExists = async (devisId: string, garageId?: string) => {
  try {
    const token = validateToken();

    console.log("🔄 Vérification facture active → devisId:", devisId, "garageId:", garageId);

    let url = `http://localhost:5000/api/factureByDevis/${devisId}`;
    if (garageId) {
      url += `?garageId=${garageId}`;
    }

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Facture trouvée:', response.data);
    return response.data || null;

  } catch (error: any) {
    if (error.response?.status === 404) {
      console.log("✅ Aucune facture active trouvée");
      return null;
    }

    console.error("❌ Erreur vérification facture:", error);
    throw error;
  }
};

export const createNewFacture = async (devisId: string, garageId?: string) => {
  try {
    const token = validateToken();

    let url = `http://localhost:5000/api/create/${devisId}`;
    if (garageId) {
      url += `?garageId=${garageId}`;
    }

    console.log('🔄 Création de la facture pour devis:', devisId);
    const response = await axios.post(
      url,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log('✅ Facture créée:', response.data);
    return response.data;
    
  } catch (error: any) {
    handleApiError(error, 'createNewFacture');
    throw error;
  }
};

export const getFactureById = async (factureId: string) => {
  try {
    const token = validateToken();

    console.log('🔄 Récupération de la facture:', factureId);
    const response = await axios.get(
      `http://localhost:5000/api/getFacture/${factureId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log('✅ Facture récupérée:', response.data);
    return response.data;
    
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.log('ℹ️ Facture non trouvée');
      return null;
    }
    handleApiError(error, 'getFactureById');
    return null;
  }
};

export const checkIfDevisModified = (devis: any, facture: any) => {
  if (!devis.updatedAt || !facture.createdAt) {
    console.warn('⚠️ Dates manquantes pour comparaison');
    return false;
  }

  const devisModifiedDate = new Date(devis.updatedAt);
  const factureCreatedDate = new Date(facture.createdAt);

  const isModified = devisModifiedDate > factureCreatedDate;
  console.log('📊 Devis modifié ?', isModified);
  
  return isModified;
};

export const replaceFactureWithCredit = async (devisId: string, garageId?: string) => {
  try {
    const token = validateToken();

    let url = `http://localhost:5000/api/create-with-credit/${devisId}`;
    if (garageId) {
      url += `?garageId=${garageId}`;
    }

    const body = { createCreditNote: true };

    console.log('🔄 Remplacement facture avec avoir pour devis:', devisId);
    const response = await axios.post(url, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log('✅ Facture remplacée avec avoir:', response.data);
    return response.data;
    
  } catch (error: any) {
    handleApiError(error, 'replaceFactureWithCredit');
    throw error;
  }
};