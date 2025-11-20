// components/garage/api.ts
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};


// ========== GARAGES ==========

export const getAllGarages = async () => {
  try {
    const token = getAuthToken();
    // ⭐ VÉRIFICATION CRITIQUE
    if (!token || token === 'null' || token === 'undefined') {
      // Rediriger vers le login
      window.location.href = '/auth/sign-in';
      return;
    }
    const { data } = await axios.get(`${API_BASE}/garages`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data.garages || data;
  } catch (error: any) {
    if (error.response?.status === 403) {
      alert("❌ Accès refusé : Vous n'avez pas la permission");
      throw error;
    }

    if (error.response?.status === 401) {
      alert("❌ Session expirée : Veuillez vous reconnecter");
      window.location.href = '/auth/sign-in';
      throw error;
    }
    console.error('Erreur chargement garages:', error);
    throw error;
  }
};


export const createGarage = async (garageData: any) => {
  try {
    const token = getAuthToken();
    // ⭐ VÉRIFICATION CRITIQUE
    if (!token || token === 'null' || token === 'undefined') {
      // Rediriger vers le login
      window.location.href = '/auth/sign-in';
      return;
    }
    const servicesArray = garageData.services
      ? garageData.services.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];

    const response = await axios.post(`${API_BASE}/garages`, {
      ...garageData,
      services: servicesArray,
    },
      {
        headers:
        {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",

        }
      }

    );

    return response.data.garage;
  } catch (error: any) {
    if (error.response?.status === 403) {
      alert("❌ Accès refusé : Vous n'avez pas la permission");
      throw error;
    }

    if (error.response?.status === 401) {
      alert("❌ Session expirée : Veuillez vous reconnecter");
      window.location.href = '/auth/sign-in';
      throw error;
    }
    console.error('Erreur création garage:', error);
    throw error;
  }
};

// ========== GARAGISTES ==========

export const createGaragiste = async (garageId: string, garagisteData: any) => {
  try {
    const token = getAuthToken();
    // ⭐ VÉRIFICATION CRITIQUE
    if (!token || token === 'null' || token === 'undefined') {
      // Rediriger vers le login
      window.location.href = '/auth/sign-in';
      return;
    }
    const response = await axios.post(`${API_BASE}/garages/${garageId}/garagiste`, garagisteData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }
    });


    return response.data.garagiste;
  } catch (error: any) {
    if (error.response?.status === 403) {
      alert("❌ Accès refusé : Vous n'avez pas la permission");
      throw error;
    }

    if (error.response?.status === 401) {
      alert("❌ Session expirée : Veuillez vous reconnecter");
      window.location.href = '/auth/sign-in';
      throw error;
    }
    console.error('Erreur création garagiste:', error);
    throw error;
  }
};

// ========== ROLES ==========

export const getAllRoles = async () => {
  try {
    const token = getAuthToken();
    // ⭐ VÉRIFICATION CRITIQUE
    if (!token || token === 'null' || token === 'undefined') {
      // Rediriger vers le login
      window.location.href = '/auth/sign-in';
      return;
    }
    const { data } = await axios.get(`${API_BASE}/getAllRoles`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error: any) {
    if (error.response?.status === 403) {
      alert("❌ Accès refusé : Vous n'avez pas la permission");
      throw error;
    }

    if (error.response?.status === 401) {
      alert("❌ Session expirée : Veuillez vous reconnecter");
      window.location.href = '/auth/sign-in';
      throw error;
    }
    console.error('Erreur chargement rôles:', error);
    throw error;
  }
};

export const getGarageById = async (_id: string) => {
  try {
    const token = getAuthToken();
    // ⭐ VÉRIFICATION CRITIQUE
    if (!token || token === 'null' || token === 'undefined') {
      // Rediriger vers le login
      window.location.href = '/auth/sign-in';
      return;
    }
    const { data } = await axios.get(`${API_BASE}/garages/${_id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error: any) {
    if (error.response?.status === 403) {
      alert("❌ Accès refusé : Vous n'avez pas la permission");
      throw error;
    }

    if (error.response?.status === 401) {
      alert("❌ Session expirée : Veuillez vous reconnecter");
      window.location.href = '/auth/sign-in';
      throw error;
    }
    console.error("Erreur chargement garage:", error);
    throw error;
  }
};


export const getGaragisteById = async (id: string) => {
  try {
    const token = getAuthToken();
    // ⭐ VÉRIFICATION CRITIQUE
    if (!token || token === 'null' || token === 'undefined') {
      // Rediriger vers le login
      window.location.href = '/auth/sign-in';
      return;
    }
    if (!id) {
      throw new Error('ID du garagiste requis');
    }

    console.log('📡 Appel API:', `${API_BASE}/garagistes/${id}`);

    const { data } = await axios.get(`${API_BASE}/garagistes/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Réponse API reçue:', data);
    return data;
  } catch (error: any) {
    if (error.response?.status === 403) {
      alert("❌ Accès refusé : Vous n'avez pas la permission");
      throw error;
    }

    if (error.response?.status === 401) {
      alert("❌ Session expirée : Veuillez vous reconnecter");
      window.location.href = '/auth/sign-in';
      throw error;
    }
    console.error('❌ Erreur chargement garagiste:', error.response?.data || error.message);
    throw error;
  }
};

export const getAllPermissions = async () => {
  try {
    const token = getAuthToken();
    // ⭐ VÉRIFICATION CRITIQUE
    if (!token || token === 'null' || token === 'undefined') {
      // Rediriger vers le login
      window.location.href = '/auth/sign-in';
      return;
    }
    const { data } = await axios.get(`${API_BASE}/getAllPermissions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error: any) {
    if (error.response?.status === 403) {
      alert("❌ Accès refusé : Vous n'avez pas la permission");
      throw error;
    }

    if (error.response?.status === 401) {
      alert("❌ Session expirée : Veuillez vous reconnecter");
      window.location.href = '/auth/sign-in';
      throw error;
    }
    console.error('Erreur chargement permissions:', error);
    throw error;
  }
};

export const getAllRolePermissions = async () => {
  try {
    const token = getAuthToken();
    // ⭐ VÉRIFICATION CRITIQUE
    if (!token || token === 'null' || token === 'undefined') {
      // Rediriger vers le login
      window.location.href = '/auth/sign-in';
      return;
    }
    const { data } = await axios.get(`${API_BASE}/getAllRolePermissions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error: any) {
    if (error.response?.status === 403) {
      alert("❌ Accès refusé : Vous n'avez pas la permission");
      throw error;
    }

    if (error.response?.status === 401) {
      alert("❌ Session expirée : Veuillez vous reconnecter");
      window.location.href = '/auth/sign-in';
      throw error;
    }
    console.error('Erreur chargement permissions des rôles:', error);
    throw error;
  }
};

export const getGaragistePermissions = async (garagisteId: string) => {
  try {
    const token = getAuthToken();
    // ⭐ VÉRIFICATION CRITIQUE
    if (!token || token === 'null' || token === 'undefined') {
      // Rediriger vers le login
      window.location.href = '/auth/sign-in';
      return;
    }
    const { data } = await axios.get(`${API_BASE}/garagiste/${garagisteId}/permissions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error: any) {
    if (error.response?.status === 403) {
      alert("❌ Accès refusé : Vous n'avez pas la permission");
      throw error;
    }

    if (error.response?.status === 401) {
      alert("❌ Session expirée : Veuillez vous reconnecter");
      window.location.href = '/auth/sign-in';
      throw error;
    }
    console.error('Erreur chargement permissions individuelles:', error);
    throw error;
  }
};

export const addGaragistePermission = async (garagisteId: string, permissionId: string) => {
  try {
    const token = getAuthToken();
    // ⭐ VÉRIFICATION CRITIQUE
    if (!token || token === 'null' || token === 'undefined') {
      // Rediriger vers le login
      window.location.href = '/auth/sign-in';
      return;
    }
    const { data } = await axios.post(
      `${API_BASE}/garagiste/permission`,
      { GaragisteId: garagisteId, permissionId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
  } catch (error: any) {
    if (error.response?.status === 403) {
      alert("❌ Accès refusé : Vous n'avez pas la permission");
      throw error;
    }

    if (error.response?.status === 401) {
      alert("❌ Session expirée : Veuillez vous reconnecter");
      window.location.href = '/auth/sign-in';
      throw error;
    }
    console.error('Erreur ajout permission:', error);
    throw new Error(error.response?.data?.message || 'Erreur lors de l\'ajout de la permission');
  }
};

export const removeGaragistePermission = async (permissionAssociationId: string) => {
  try {
    const token = getAuthToken();
    // ⭐ VÉRIFICATION CRITIQUE
    if (!token || token === 'null' || token === 'undefined') {
      // Rediriger vers le login
      window.location.href = '/auth/sign-in';
      return;
    }
    const { data } = await axios.delete(
      `${API_BASE}/garagiste/permission/${permissionAssociationId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
  } catch (error: any) {
    if (error.response?.status === 403) {
      alert("❌ Accès refusé : Vous n'avez pas la permission");
      throw error;
    }

    if (error.response?.status === 401) {
      alert("❌ Session expirée : Veuillez vous reconnecter");
      window.location.href = '/auth/sign-in';
      throw error;
    }
    console.error('Erreur suppression permission:', error);
    throw new Error(error.response?.data?.message || 'Erreur lors de la suppression de la permission');
  }
};