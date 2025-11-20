import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};


export const getAllGarages = async () => {
  try {
    const token = getAuthToken();
    // ⭐ VÉRIFICATION CRITIQUE
    if (!token || token === 'null' || token === 'undefined') {
      // Rediriger vers le login
      window.location.href = '/auth/sign-in';
      return;
    }

    const response = await axios.get(`${API_BASE}/garages`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data.garages;

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
    console.error("Erreur getAllGarages:", error);
    throw error;
  }
};


export const getDevisByGarage = async (garageId: string) => {
  try {
    const token = getAuthToken();
    // ⭐ VÉRIFICATION CRITIQUE
    if (!token || token === 'null' || token === 'undefined') {
      // Rediriger vers le login
      window.location.href = '/auth/sign-in';
      return;
    }

    const response = await axios.get(`${API_BASE}/garage-devis/${garageId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data;

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
    console.error("Erreur getDevisByGarage:", error);
    throw error;
  }
};

export const getDevisById = async (devisId: string) => {
  try {
    const token = getAuthToken();
    // ⭐ VÉRIFICATION CRITIQUE
    if (!token || token === 'null' || token === 'undefined') {
      // Rediriger vers le login
      window.location.href = '/auth/sign-in';
      return;
    }

    const response = await axios.get(`${API_BASE}/devis/${devisId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data;

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
    console.error("Erreur getDevisByGarage:", error);
    throw error;
  }
};


// Pour le SuperAdmin, on passe le garageId en paramètre
export const getAllGarageClients = async (garageId?: string) => {
  try {
    const token = getAuthToken();
    
    if (!token || token === 'null' || token === 'undefined') {
      window.location.href = '/auth/sign-in';
      return;
    }

    // ⭐ Construire l'URL avec ou sans garageId
    let url = 'http://localhost:5000/api/GetAll';
    
    // Si garageId est fourni (SuperAdmin), l'ajouter en query param
    if (garageId) {
      url += `?garageId=${garageId}`;
    }

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data;

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
    
    console.error('Erreur lors de la récupération des clients:', error);
    throw error;
  }
};

export const loadVehiculesByClient = async (clientId : string ,garageId?: string) => {
    if (!clientId) {
      return [];
    }

    try {
      const token = getAuthToken();
      // ⭐ VÉRIFICATION CRITIQUE
      if (!token || token === 'null' || token === 'undefined') {
        // Rediriger vers le login
        window.location.href = '/auth/sign-in';
        return;
      }
      let url =`http://localhost:5000/api/vehicules/proprietaire/${clientId}`;


    if (garageId) {
      url += `?garageId=${garageId}`;
    }

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;


    } catch (error:any) {
        if (error.response?.status === 403) {
            alert("❌ Accès refusé : Vous n'avez pas la permission ");
            throw error;
        }
        
        if (error.response?.status === 401) {
            alert("❌ Session expirée : Veuillez vous reconnecter");
            window.location.href = '/auth/sign-in';
            throw error;
        }
      console.error('❌ Erreur lors du chargement des véhicules:', error);
    } 
  };


  export const createDevisForGarage = async (garageId: string, devisData: any) => {
  try {
    const token = getAuthToken();
    if (!token || token === 'null' || token === 'undefined') {
      window.location.href = '/auth/sign-in';
      return;
    }

    // ⭐ Ajouter le garageId dans le body
    const dataWithGarageId = {
      ...devisData,
      garageId: garageId // Le SuperAdmin envoie le garageId explicitement
    };

    const response = await axios.post(
      `${API_BASE}/createdevis`, // ⭐ Route unique
      dataWithGarageId,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    return response.data;

  } catch (error: any) {
    if (error.response?.status === 403) {
      alert("❌ Accès refusé");
      throw error;
    }
    if (error.response?.status === 401) {
      window.location.href = '/auth/sign-in';
      throw error;
    }
    console.error("Erreur createDevisForGarage:", error);
    throw error;
  }
};


