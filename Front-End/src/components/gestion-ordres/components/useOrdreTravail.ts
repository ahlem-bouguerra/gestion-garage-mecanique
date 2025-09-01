const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  // Fonctions de chargement des données de base
  const loadAteliers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/getAllAteliers');
      setAteliers(response.data);
    } catch (error) {
      console.error('Erreur chargement ateliers:', error);
      setAteliers([]);
    }
  };

  const loadServices = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/getAllServices');
      setServices(response.data);
    } catch (error) {
      console.error('Erreur chargement services:', error);
      setServices([]);
    }
  };

  const loadMecaniciensByService = async (serviceId: string) => {
    try {
      if (!serviceId) {
        setMecaniciens([]);
        return;
      }
      const response = await axios.get(`http://localhost:5000/api/mecaniciens/by-service/${serviceId}`);
      setMecaniciens(response.data);
    } catch (error) {
      console.error('Erreur chargement mécaniciens:', error);
      setMecaniciens([]);
    }
  };

  // Fonctions de gestion des ordres de travail
  const loadOrdresTravail = async (page = 1) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      let baseUrl = 'http://localhost:5000/api';

      if (filters.status) {
        baseUrl = `http://localhost:5000/api/ordres/status/${filters.status}`;
        const statusParams = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString()
        });

        const response = await axios.get(`${baseUrl}?${statusParams}`);

        if (response.data.ordres) {
          setOrdresTravail(response.data.ordres);
          setPagination(prev => ({
            ...prev,
            total: response.data.total,
            currentPage: page
          }));
        }
      } else if (filters.atelier) {
        baseUrl = `http://localhost:5000/api/ordres/atelier/${filters.atelier}`;
        const atelierParams = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString()
        });

        const response = await axios.get(`${baseUrl}?${atelierParams}`);

        if (response.data.ordres) {
          setOrdresTravail(response.data.ordres);
          setPagination(prev => ({
            ...prev,
            total: response.data.total,
            currentPage: page
          }));
        }
      } else {
        const response = await axios.get(`${baseUrl}?${params}`);

        if (response.data.ordres) {
          setOrdresTravail(response.data.ordres);
          setPagination(prev => ({
            ...prev,
            ...response.data.pagination
          }));
        } else {
          setOrdresTravail(Array.isArray(response.data) ? response.data : []);
        }
      }

    } catch (error) {
      console.error('Erreur chargement ordres:', error);
      setOrdresTravail([]);
    }
  };

  const loadOrdreDetails = async (ordreId: string) => {
    const result = await api.loadOrdreDetails(ordreId);
    
    if (result.success && result.ordre) {
      setSelectedOrdre(result.ordre);
    } else {
      showError(result.error || 'Erreur lors du chargement des détails');
    }
  };

  const loadStatistiques = async () => {
    const result = await api.loadStatistiques();
    
    if (result.success) {
      setStatistiques(result.statistiques);
    } else {
      console.error('Erreur chargement statistiques:', result.error);
    }
  };

  // Actions sur les ordres
  const demarrerOrdre = async (ordreId: string) => {
    const result = await api.demarrerOrdre(ordreId);
    
    if (result.success && result.message) {
      showSuccess(result.message);
      await loadOrdreDetails(ordreId);
      loadOrdresTravail();
    } else if (result.error) {
      showError(result.error);
    }
  };

  const terminerOrdre = async (ordreId: string) => {
    const result = await api.terminerOrdre(ordreId);
    
    if (result.success && result.message) {
      showSuccess(result.message);
      await loadOrdreDetails(ordreId);
      loadOrdresTravail();
    } else if (result.error) {
      showError(result.error);
    }
  };

  const supprimerOrdre = async (ordreId: string) => {
    const ordre = ordresTravail.find(o => o._id === ordreId);
    const numeroOrdre = ordre?.numeroOrdre || ordreId;

    const result = await api.supprimerOrdre(ordreId, numeroOrdre);
    
    if (result.success && result.message) {
      showSuccess(result.message);
      loadOrdresTravail();
      
      if (selectedOrdre && selectedOrdre._id === ordreId) {
        setSelectedOrdre(null);
      }
    } else if (result.error) {
      showError(result.error);
    }
  };

  // Gestion du mode édition
  const startEdit = (ordreData?: OrdreTravail) => {
    const ordre = ordreData || selectedOrdre;
    
    if (!ordre) {
      showError('Aucun ordre sélectionné pour modification');
      return;
    }

    setSelectedOrdre(ordre);
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
  };

  // Effet pour cacher/afficher le header
  useEffect(() => {
    const header = document.querySelector('header');
    if (selectedOrdre) {
      header?.classList.add("hidden");
    } else {
      header?.classList.remove("hidden");
    }
  }, [selectedOrdre]);

  // Chargement initial
  useEffect(() => {
    loadAteliers();
    loadServices();
    
    if (activeTab === 'list') {
      loadOrdresTravail();
      loadStatistiques();
    }

    // Vérifications localStorage pour navigation depuis d'autres pages
    const savedOrdreToView = localStorage?.getItem('selectedOrdreToView');
    if (savedOrdreToView) {
      const ordre = JSON.parse(savedOrdreToView);
      setActiveTab('list');
      setSelectedOrdre(ordre);
      localStorage.removeItem('selectedOrdreToView');
    }
  }, [activeTab]);

  return {
    // États
    selectedOrdre,
    ordresTravail,
    ateliers,
    services,
    mecaniciens,
    statistiques,
    editMode,
    activeTab,
    error,
    success,
    pagination,
    filters,
    loading: api.loading,

    // Setters
    setSelectedOrdre,
    setOrdresTravail,
    setActiveTab,
    setFilters,
    setPagination,

    // Actions
    loadOrdresTravail,
    loadOrdreDetails,
    loadStatistiques,
    loadMecaniciensByService,
    demarrerOrdre,
    terminerOrdre,
    supprimerOrdre,
    startEdit,
    cancelEdit,

    // Messages
    showError,
    showSuccess,

    // API hook
    api
  };
};import { useState, useEffect } from 'react';
import axios from 'axios';
import useOrdreTravailApi from './useOrdreTravailApi';

interface Atelier {
  _id: string;
  name: string;
  localisation: string;
}

interface Service {
  _id: string;
  name: string;
}

interface Mecanicien {
  _id: string;
  nom: string;
}

interface OrdreTravail {
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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Filters {
  status: string;
  atelier: string;
  priorite: string;
  dateDebut: string;
  dateFin: string;
}

export const useOrdreTravail = () => {
  const [selectedOrdre, setSelectedOrdre] = useState<OrdreTravail | null>(null);
  const [ordresTravail, setOrdresTravail] = useState<OrdreTravail[]>([]);
  const [ateliers, setAteliers] = useState<Atelier[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [mecaniciens, setMecaniciens] = useState<Mecanicien[]>([]);
  const [statistiques, setStatistiques] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const [filters, setFilters] = useState<Filters>({
    status: '',
    atelier: '',
    priorite: '',
    dateDebut: '',
    dateFin: ''
  });

  const api = useOrdreTravailApi();

  // Fonctions utilitaires pour les messages
  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  // Fonctions de chargement des données de base
  const loadAteliers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/getAllAteliers');
      setAteliers(response.data);
    } catch (error) {
      console.error('Erreur chargement ateliers:', error);
      setAteliers([]);
    }
  };

  const loadServices = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/getAllServices');
      setServices(response.data);
    } catch (error) {
      console.error('Erreur chargement services:', error);
      setServices([]);
    }
  };

  const loadMecaniciensByService = async (serviceId: string) => {
    try {
      if (!serviceId) {
        setMecaniciens([]);
        return;
      }
      const response = await axios.get(`http://localhost:5000/api/mecaniciens/by-service/${serviceId}`);
      setMecaniciens(response.data);
    } catch (error) {
      console.error('Erreur chargement mécaniciens:', error);
      setMecaniciens([]);
    }
  };

  // Fonctions de gestion des ordres de travail
  const loadOrdresTravail = async (page = 1) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      let baseUrl = 'http://localhost:5000/api';

      if (filters.status) {
        baseUrl = `http://localhost:5000/api/ordres/status/${filters.status}`;
        const statusParams = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString()
        });

        const response = await axios.get(`${baseUrl}?${statusParams}`);

        if (response.data.ordres) {
          setOrdresTravail(response.data.ordres);
          setPagination(prev => ({
            ...prev,
            total: response.data.total,
            currentPage: page
          }));
        }
      } else if (filters.atelier) {
        baseUrl = `http://localhost:5000/api/ordres/atelier/${filters.atelier}`;
        const atelierParams = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString()
        });

        const response = await axios.get(`${baseUrl}?${atelierParams}`);

        if (response.data.ordres) {
          setOrdresTravail(response.data.ordres);
          setPagination(prev => ({
            ...prev,
            total: response.data.total,
            currentPage: page
          }));
        }
      } else {
        const response = await axios.get(`${baseUrl}?${params}`);

        if (response.data.ordres) {
          setOrdresTravail(response.data.ordres);
          setPagination(prev => ({
            ...prev,
            ...response.data.pagination
          }));
        } else {
          setOrdresTravail(Array.isArray(response.data) ? response.data : []);
        }
      }

    } catch (error) {
      console.error('Erreur chargement ordres:', error);
      setOrdresTravail([]);
    }
  };

  const loadOrdreDetails = async (ordreId: string) => {
    const result = await api.loadOrdreDetails(ordreId);
    
    if (result.success && result.ordre) {
      setSelectedOrdre(result.ordre);
    } else {
      showError(result.error || 'Erreur lors du chargement des détails');
    }
  };

  const loadStatistiques = async () => {
    const result = await api.loadStatistiques();
    
    if (result.success) {
      setStatistiques(result.statistiques);
    } else {
      console.error('Erreur chargement statistiques:', result.error);
    }
  };

  // Actions sur les ordres
  const demarrerOrdre = async (ordreId: string) => {
    const result = await api.demarrerOrdre(ordreId);
    
    if (result.success && result.message) {
      showSuccess(result.message);
      await loadOrdreDetails(ordreId);
      loadOrdresTravail();
    } else if (result.error) {
      showError(result.error);
    }
  };

  const terminerOrdre = async (ordreId: string) => {
    const result = await api.terminerOrdre(ordreId);
    
    if (result.success && result.message) {
      showSuccess(result.message);
      await loadOrdreDetails(ordreId);
      loadOrdresTravail();
    } else if (result.error) {
      showError(result.error);
    }
  };

  const supprimerOrdre = async (ordreId: string) => {
    const ordre = ordresTravail.find(o => o._id === ordreId);
    const numeroOrdre = ordre?.numeroOrdre || ordreId;

    const result = await api.supprimerOrdre(ordreId, numeroOrdre);
    
    if (result.success && result.message) {
      showSuccess(result.message);
      loadOrdresTravail();
      
      // Fermer le modal si l'ordre supprimé était ouvert
      if (selectedOrdre && selectedOrdre._id === ordreId) {
        setSelectedOrdre(null);
      }
    } else if (result.error) {
      showError(result.error);
    }
  };

  // Gestion du mode édition
  const startEdit = (ordreData?: OrdreTravail) => {
    const ordre = ordreData || selectedOrdre;
    
    if (!ordre) {
      showError('Aucun ordre sélectionné pour modification');
      return;
    }

    setSelectedOrdre(ordre);
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
  };

  // Effet pour cacher/afficher le header
  useEffect(() => {
    const header = document.querySelector('header');
    if (selectedOrdre) {
      header?.classList.add("hidden");
    } else {
      header?.classList.remove("hidden");
    }
  }, [selectedOrdre]);

  // Chargement initial
  useEffect(() => {
    loadAteliers();
    loadServices();
    
    if (activeTab === 'list') {
      loadOrdresTravail();
      loadStatistiques();
    }

    // Vérifications localStorage pour navigation depuis d'autres pages
    const savedOrdreToView = localStorage?.getItem('selectedOrdreToView');
    if (savedOrdreToView) {
      const ordre = JSON.parse(savedOrdreToView);
      setActiveTab('list');
      setSelectedOrdre(ordre);
      localStorage.removeItem('selectedOrdreToView');
    }
  }, [activeTab]);

  return {
    // États
    selectedOrdre,
    ordresTravail,
    ateliers,
    services,
    mecaniciens,
    statistiques,
    editMode,
    activeTab,
    error,
    success,
    pagination,
    filters,
    loading: api.loading,

    // Setters
    setSelectedOrdre,
    setOrdresTravail,
    setActiveTab,
    setFilters,
    setPagination,

    // Actions
    loadOrdresTravail,
    loadOrdreDetails,
    loadStatistiques,
    loadMecaniciensByService,
    demarrerOrdre,
    terminerOrdre,
    supprimerOrdre,
    startEdit,
    cancelEdit,

    // Messages
    showError,
    showSuccess,

    // API hook
    api
  };
};

export default useOrdreTravail;