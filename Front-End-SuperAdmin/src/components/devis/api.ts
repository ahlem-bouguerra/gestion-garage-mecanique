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


export const updateDevis = async (devisId:string, devisData:any) => {
      try {
        const token = getAuthToken();
        // ⭐ VÉRIFICATION CRITIQUE
        if (!token || token === 'null' || token === 'undefined') {
          // Rediriger vers le login
          window.location.href = '/auth/sign-in';
          return;
        }
        const response = await axios.put(`http://localhost:5000/api/Devis/${devisId}`,
          devisData,
          {
             headers:{
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              }
          }
        );
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
        throw new Error(error.response?.data?.message || "Erreur lors de la mise à jour du devis");
      }
};


export const deleteDevis = async (devisId:string) => {
      try {
        const token = getAuthToken();
        // ⭐ VÉRIFICATION CRITIQUE
        if (!token || token === 'null' || token === 'undefined') {
          // Rediriger vers le login
          window.location.href = '/auth/sign-in';
          return;
        }
        const response = await axios.delete(`http://localhost:5000/api/deleteDevis/${devisId}`,
          {
             headers:{
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              }
          }
        );
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
        throw new Error(error.response?.data?.message || "Erreur lors de delete du devis");
      }
}


export const sendDevisByMail = async (devisId:string ,garageId: string) => {
      try {
        const token = getAuthToken();
        // ⭐ VÉRIFICATION CRITIQUE
        if (!token || token === 'null' || token === 'undefined') {
          // Rediriger vers le login
          window.location.href = '/auth/sign-in';
          return;
        }
        const response = await axios.post(`http://localhost:5000/api/devis/${devisId}/send-email`,
          { garageId },{
             headers:{
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              }
          }
        );
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
        throw new Error(error.response?.data?.message || "Erreur lors de l'envoi de devis par mail");
      }
}


export const checkActiveFactureExists = async (devisId: string, garageId?: string) => {
  try {
    const token = getAuthToken();
    if (!token || token === 'null' || token === 'undefined') {
      window.location.href = '/auth/sign-in';
      throw new Error("Token invalide");
    }

    console.log("📡 Vérification facture active → devisId:", devisId, "garageId:", garageId);

    let url = `http://localhost:5000/api/factureByDevis/${devisId}`;

    if (garageId) {
      url += `?garageId=${garageId}`;
    }

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

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

// Dans api.ts - Assure-toi que la fonction est bien exportée
export const createNewFacture = async (devisId: string, garageId?: string) => {
  try {
    const token = getAuthToken();
    if (!token || token === 'null' || token === 'undefined') {
      window.location.href = '/auth/sign-in';
      throw new Error("Token invalide");
    }

    let url = `http://localhost:5000/api/create/${devisId}`;
    
    if (garageId) {
      url += `?garageId=${garageId}`;
    }

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

    return response.data;
  } catch (error: any) {
    console.error('❌ Erreur création facture:', error);
    throw error;
  }
};



export const getFactureById = async (factureId: string) => {
  try {
    const token = getAuthToken();
    if (!token || token === 'null' || token === 'undefined') {
      window.location.href = '/auth/sign-in';
      throw new Error("Token invalide");
    }

    const response = await axios.get(
      `http://localhost:5000/api/getFacture/${factureId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

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

    if (error.response?.status === 404) {
      return null;
    }

    console.error('Erreur récupération facture:', error);
    throw error;
  }
};

export const checkIfDevisModified = (devis: any, facture: any) => {
  if (!devis.updatedAt || !facture.createdAt) return false;

  const devisModifiedDate = new Date(devis.updatedAt);
  const factureCreatedDate = new Date(facture.createdAt);

  return devisModifiedDate > factureCreatedDate;
};

export const replaceFactureWithCredit = async (devisId: string, garageId?: string) => {
  try {
    const token = getAuthToken();
    if (!token || token === 'null' || token === 'undefined') {
      window.location.href = '/auth/sign-in';
      throw new Error("Token invalide");
    }

    // ✅ Construire l'URL avec garageId en query param
    let url = `http://localhost:5000/api/create-with-credit/${devisId}`;
    
    if (garageId) {
      url += `?garageId=${garageId}`;  // ← AJOUTÉ ICI
    }

    // ✅ Body contient uniquement createCreditNote
    const body: any = { createCreditNote: true };
    // ❌ NE PLUS mettre garageId dans le body

    const response = await axios.post(url, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('❌ Erreur remplacement facture:', error);
    throw error;
  }
};