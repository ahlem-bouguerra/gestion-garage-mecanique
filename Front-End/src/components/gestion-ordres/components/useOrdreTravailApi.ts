import { useState } from 'react';
import axios from 'axios';

export interface OrdreTravail {
  _id: string;
  numeroOrdre?: string;
  devisId: string;
  dateCommence: string;
  atelierId?: string;
  atelierNom?: string;
  priorite: string;
  status: string;
  description: string;
  taches: any[];
  clientInfo?: {
    nom: string;
  };
  vehiculeInfo?: string;
}

export const useOrdreTravailApi = () => {
  const [loading, setLoading] = useState(false);

  const demarrerOrdre = async (ordreId: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    const confirmation = window.confirm(
      'Êtes-vous sûr de vouloir démarrer cet ordre de travail ?\n\n' +
      'Cette action changera le statut à "En cours" et enregistrera la date de début réelle.'
    );

    if (!confirmation) {
      return { success: false };
    }

    try {
      setLoading(true);
      const response = await axios.put(`http://localhost:5000/api/ordre-travail/${ordreId}/demarrer`);

      if (response.data.success) {
        return { success: true, message: 'Ordre de travail démarré avec succès' };
      } else {
        return { success: false, error: response.data.error || 'Erreur lors du démarrage' };
      }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Erreur lors du démarrage de l\'ordre' 
      };
    } finally {
      setLoading(false);
    }
  };

  const terminerOrdre = async (ordreId: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    const confirmation = window.confirm(
      'Êtes-vous sûr de vouloir terminer cet ordre de travail ?\n\n' +
      'Cette action changera le statut à "Terminé" et enregistrera la date de fin réelle.\n' +
      'Une fois terminé, l\'ordre ne pourra plus être modifié.'
    );

    if (!confirmation) {
      return { success: false };
    }

    try {
      setLoading(true);
      const response = await axios.put(`http://localhost:5000/api/ordre-travail/${ordreId}/terminer`);

      if (response.data.success) {
        return { success: true, message: 'Ordre de travail terminé avec succès' };
      } else {
        return { success: false, error: response.data.error || 'Erreur lors de la fin de l\'ordre' };
      }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Erreur lors de la fin de l\'ordre' 
      };
    } finally {
      setLoading(false);
    }
  };

  const supprimerOrdre = async (ordreId: string, numeroOrdre?: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    const confirmation = window.confirm(
      `⚠️ ATTENTION ⚠️\n\n` +
      `Êtes-vous sûr de vouloir supprimer l'ordre de travail ${numeroOrdre || ordreId} ?\n\n` +
      `Cette action marquera l'ordre comme supprimé et il ne sera plus visible dans la liste principale.\n\n` +
      `Cette action est réversible uniquement par un administrateur.`
    );

    if (!confirmation) {
      return { success: false };
    }

    try {
      setLoading(true);
      const response = await axios.delete(`http://localhost:5000/api/${ordreId}`);

      if (response.data.success) {
        return { 
          success: true, 
          message: `Ordre de travail ${numeroOrdre || ordreId} supprimé avec succès` 
        };
      } else {
        return { success: false, error: response.data.error || 'Erreur lors de la suppression' };
      }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Erreur lors de la suppression' 
      };
    } finally {
      setLoading(false);
    }
  };

  const loadOrdreDetails = async (ordreId: string): Promise<{ success: boolean; ordre?: OrdreTravail; error?: string }> => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/getOrdreTravailById/${ordreId}`);

      if (response.data.success && response.data.ordre) {
        return { success: true, ordre: response.data.ordre };
      } else if (response.data) {
        return { success: true, ordre: response.data };
      } else {
        return { success: false, error: 'Aucune donnée reçue pour cet ordre' };
      }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || 'Erreur lors du chargement des détails'
      };
    } finally {
      setLoading(false);
    }
  };

  const loadStatistiques = async (): Promise<{ success: boolean; statistiques?: any; error?: string }> => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/statistiques');

      if (response.data.success) {
        return { success: true, statistiques: response.data.statistiques };
      } else {
        return { success: false, error: 'Erreur lors du chargement des statistiques' };
      }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Erreur lors du chargement des statistiques'
      };
    } finally {
      setLoading(false);
    }
  };

  const createOrdreTravail = async (ordreData: any): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:5000/api/', ordreData);

      if (response.data.success) {
        return { 
          success: true, 
          message: response.data.message || 'Ordre de travail créé avec succès !' 
        };
      } else {
        return { 
          success: false, 
          error: response.data.error || 'Erreur lors de la création' 
        };
      }
    } catch (error: any) {
      let errorMessage = 'Erreur lors de la création';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const modifierOrdreTravail = async (ordreId: string, updateData: any): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      setLoading(true);
      const response = await axios.put(`http://localhost:5000/api/modifier/${ordreId}`, updateData);

      if (response.data.success) {
        return { success: true, message: 'Ordre de travail modifié avec succès' };
      } else {
        return { 
          success: false, 
          error: response.data.error || 'Erreur lors de la modification' 
        };
      }
    } catch (error: any) {
      let errorMessage = 'Erreur lors de la modification';

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const loadDevisById = async (devisId: string): Promise<{ success: boolean; devis?: any; ordres?: any[]; error?: string }> => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/devis/code/${devisId}`);
      
      return { 
        success: true, 
        devis: response.data.devis, 
        ordres: response.data.ordres 
      };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || 'Erreur lors du chargement du devis'
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    demarrerOrdre,
    terminerOrdre,
    supprimerOrdre,
    loadOrdreDetails,
    loadStatistiques,
    createOrdreTravail,
    modifierOrdreTravail,
    loadDevisById
  };
};

export default useOrdreTravailApi;