// components/garage/api.ts
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getAuthToken()}`
});

// ========== GARAGES ==========

export const getAllGarages = async () => {
  try {
    const { data } = await axios.get(`${API_BASE}/garages`, {
      headers: getAuthHeaders()
    });
    return data.garages || data;
  } catch (error) {
    console.error('Erreur chargement garages:', error);
    throw error;
  }
};


export const createGarage = async (garageData: any) => {
  try {
    const servicesArray = garageData.services
      ? garageData.services.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];

    const response = await fetch(`${API_BASE}/garages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...garageData,
        services: servicesArray
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la création du garage');
    }

    return data.garage;
  } catch (error) {
    console.error('Erreur création garage:', error);
    throw error;
  }
};

// ========== GARAGISTES ==========

export const createGaragiste = async (garageId: string, garagisteData: any) => {
  try {
    const response = await fetch(`${API_BASE}/garages/${garageId}/garagiste`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(garagisteData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la création du garagiste');
    }

    return data.garagiste;
  } catch (error) {
    console.error('Erreur création garagiste:', error);
    throw error;
  }
};

// ========== ROLES ==========

export const getAllRoles = async () => {
  try {
    const { data } = await axios.get(`${API_BASE}/getAllRoles`, {
      headers: getAuthHeaders()
    });
    return data;
  } catch (error) {
    console.error('Erreur chargement rôles:', error);
    throw error;
  }
};

export const getGarageById = async (_id: string) => {
  try {
    const { data } = await axios.get(`${API_BASE}/garages/${_id}`, {
      headers: getAuthHeaders()
    });
    return data;
  } catch (error) {
    console.error("Erreur chargement garage:", error);
    throw error;
  }
};


export const getGaragisteById = async (id: string) => {
  try {
    if (!id) {
      throw new Error('ID du garagiste requis');
    }

    console.log('📡 Appel API:', `${API_BASE}/garagistes/${id}`);

    const { data } = await axios.get(`${API_BASE}/garagistes/${id}`, {
      headers: getAuthHeaders()
    });
    
    console.log('✅ Réponse API reçue:', data);
    return data;
  } catch (error: any) {
    console.error('❌ Erreur chargement garagiste:', error.response?.data || error.message);
    throw error;
  }
};

export const getAllPermissions = async () => {
  try {
    const { data } = await axios.get(`${API_BASE}/getAllPermissions`, {
      headers: getAuthHeaders()
    });
    return data;
  } catch (error) {
    console.error('Erreur chargement permissions:', error);
    throw error;
  }
};

export const getAllRolePermissions = async () => {
  try {
    const { data } = await axios.get(`${API_BASE}/getAllRolePermissions`, {
      headers: getAuthHeaders()
    });
    return data;
  } catch (error) {
    console.error('Erreur chargement permissions des rôles:', error);
    throw error;
  }
};

export const getGaragistePermissions = async (garagisteId: string) => {
  try {
    const { data } = await axios.get(`${API_BASE}/garagiste/${garagisteId}/permissions`, {
      headers: getAuthHeaders()
    });
    return data;
  } catch (error) {
    console.error('Erreur chargement permissions individuelles:', error);
    throw error;
  }
};

export const addGaragistePermission = async (garagisteId: string, permissionId: string) => {
  try {
    const { data } = await axios.post(
      `${API_BASE}/garagiste/permission`,
      { GaragisteId: garagisteId, permissionId },
      { headers: getAuthHeaders() }
    );
    return data;
  } catch (error: any) {
    console.error('Erreur ajout permission:', error);
    throw new Error(error.response?.data?.message || 'Erreur lors de l\'ajout de la permission');
  }
};

export const removeGaragistePermission = async (permissionAssociationId: string) => {
  try {
    const { data } = await axios.delete(
      `${API_BASE}/garagiste/permission/${permissionAssociationId}`,
      { headers: getAuthHeaders() }
    );
    return data;
  } catch (error: any) {
    console.error('Erreur suppression permission:', error);
    throw new Error(error.response?.data?.message || 'Erreur lors de la suppression de la permission');
  }
};