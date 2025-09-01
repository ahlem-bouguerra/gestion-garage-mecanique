import axios from 'axios';
import { OrdreTravail, Pagination } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

export const useOrdreTravailApi = () => {
  const loadAteliers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/getAllAteliers`);
      return response.data;
    } catch (error) {
      console.error('Erreur chargement ateliers:', error);
      return [];
    }
  };

  const loadServices = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/getAllServices`);
      return response.data;
    } catch (error) {
      console.error('Erreur chargement services:', error);
      return [];
    }
  };

  const loadMecaniciensByService = async (serviceId: string) => {
    try {
      if (!serviceId) return [];
      const response = await axios.get(`${API_BASE_URL}/mecaniciens/by-service/${serviceId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur chargement mécaniciens:', error);
      return [];
    }
  };

  const loadDevisById = async (devisId: string) => {
    if (!devisId) return null;
    const response = await axios.get(`${API_BASE_URL}/devis/code/${devisId}`);
    return response.data;
  };

  const saveOrdreTravail = async (ordreData: any) => {
    const response = await axios.post(`${API_BASE_URL}/`, ordreData);
    return response.data;
  };

  const loadOrdresTravail = async (page: number, limit: number, filters: any) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });

    let baseUrl = API_BASE_URL;

    if (filters.status) {
      baseUrl = `${API_BASE_URL}/ordres/status/${filters.status}`;
      const statusParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      const response = await axios.get(`${baseUrl}?${statusParams}`);
      return response.data;
    } else if (filters.atelier) {
      baseUrl = `${API_BASE_URL}/ordres/atelier/${filters.atelier}`;
      const atelierParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      const response = await axios.get(`${baseUrl}?${atelierParams}`);
      return response.data;
    } else {
      const response = await axios.get(`${baseUrl}?${params}`);
      return response.data;
    }
  };

  const loadOrdreDetails = async (ordreId: string) => {
    const response = await axios.get(`${API_BASE_URL}/getOrdreTravailById/${ordreId}`);
    return response.data;
  };

  const demarrerOrdre = async (ordreId: string) => {
    const response = await axios.put(`${API_BASE_URL}/ordre-travail/${ordreId}/demarrer`);
    return response.data;
  };

  const terminerOrdre = async (ordreId: string) => {
    const response = await axios.put(`${API_BASE_URL}/ordre-travail/${ordreId}/terminer`);
    return response.data;
  };

  const supprimerOrdre = async (ordreId: string) => {
    const response = await axios.delete(`${API_BASE_URL}/${ordreId}`);
    return response.data;
  };

  const modifierOrdre = async (ordreId: string, updateData: any) => {
    const response = await axios.put(`${API_BASE_URL}/modifier/${ordreId}`, updateData);
    return response.data;
  };

  const loadStatistiques = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/statistiques`);
      return response.data.success ? response.data.statistiques : null;
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
      return null;
    }
  };

  const loadOrdresSupprimes = async () => {
    const response = await axios.get(`${API_BASE_URL}/ordres/status/supprime`);
    return response.data;
  };

  return {
    loadAteliers,
    loadServices,
    loadMecaniciensByService,
    loadDevisById,
    saveOrdreTravail,
    loadOrdresTravail,
    loadOrdreDetails,
    demarrerOrdre,
    terminerOrdre,
    supprimerOrdre,
    modifierOrdre,
    loadStatistiques,
    loadOrdresSupprimes
  };
};