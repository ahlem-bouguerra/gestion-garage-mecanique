"use client"
import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import AjoutOrdreTravail from './AjoutOrdreTravail';
import ListeOrdresTravail from './ListeOrdresTravail';
import DetailOrdreTravail from './DetailOrdreTravail';
import ModificationOrdreTravail from './ModificationOrdreTravail';
import { ordresTravailAPI } from './services/ordresTravailAPI';

const OrdreTravailSystem = () => {
  // États de navigation et UI
  const [activeTab, setActiveTab] = useState('create');
  const [selectedOrdre, setSelectedOrdre] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // États des données
  const [services, setServices] = useState([]);
  const [ateliers, setAteliers] = useState([]);
  const [mecaniciens, setMecaniciens] = useState([]);
  const [ordresTravail, setOrdresTravail] = useState([]);
  const [statistiques, setStatistiques] = useState(null);


      useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;

    if (selectedOrdre|| editMode) {
      header.classList.add("hidden");
    } else {
      header.classList.remove("hidden");
    }
  }, [selectedOrdre, editMode]);


  // États de pagination et filtres
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  
  const [filters, setFilters] = useState({
    status: '',
    atelier: '',
    priorite: '',
    dateDebut: '',
    dateFin: ''
  });

  // Effet pour charger les données initiales
  useEffect(() => {
    loadAteliers();
    loadServices();
    
    if (activeTab === 'list') {
      loadOrdresTravail();
      loadStatistiques();
    }
    
    // Vérifier s'il y a un ordre à afficher depuis le localStorage
    checkForSavedOrder();
  }, [activeTab]);

  // Vérifier le localStorage pour un ordre à afficher
  const checkForSavedOrder = () => {
    if (typeof window !== 'undefined') {
      const savedOrdreToView = localStorage.getItem('selectedOrdreToView');
      if (savedOrdreToView) {
        const ordre = JSON.parse(savedOrdreToView);
        setActiveTab('list');
        setSelectedOrdre(ordre);
        localStorage.removeItem('selectedOrdreToView');
      }
    }
  };

  // Fonctions de chargement des données
  const loadAteliers = async () => {
    try {
      const data = await ordresTravailAPI.getAteliers();
      setAteliers(data);
    } catch (error) {
      console.error('Erreur chargement ateliers:', error);
      setAteliers([]);
    }
  };

  const loadServices = async () => {
    try {
      const data = await ordresTravailAPI.getServices();
      setServices(data);
    } catch (error) {
      console.error('Erreur chargement services:', error);
      setServices([]);
    }
  };

  const loadMecaniciensByService = async (serviceId) => {
    try {
      if (!serviceId) {
        setMecaniciens([]);
        return;
      }
      const data = await ordresTravailAPI.getMecaniciensByService(serviceId);
      setMecaniciens(data);
    } catch (error) {
      console.error('Erreur chargement mécaniciens:', error);
      setMecaniciens([]);
    }
  };

  const loadOrdresTravail = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        filters
      };
      
      const data = await ordresTravailAPI.getOrdres(params);
      
      setOrdresTravail(data.ordres || []);
      setPagination(prev => ({
        ...prev,
        ...data.pagination
      }));
    } catch (error) {
      console.error('Erreur chargement ordres:', error);
      setOrdresTravail([]);
      showError('Erreur lors du chargement des ordres de travail');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistiques = async () => {
    try {
      const data = await ordresTravailAPI.getStatistiques();
      setStatistiques(data.statistiques || data);
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    }
  };

  const loadOrdreDetails = async (ordreId) => {
    try {
      setLoading(true);
      const response = await ordresTravailAPI.getOrdreDetails(ordreId);
      
      // Adapter la structure de la réponse selon l'API
      const ordreData = response.ordre || response;
      setSelectedOrdre(ordreData);
    } catch (error) {
      showError(`Erreur lors du chargement des détails: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fonctions utilitaires pour les messages
  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  // Gestionnaires d'événements
  const handleOrdreSaved = () => {
    showSuccess('Ordre de travail sauvegardé avec succès !');
    if (activeTab === 'list') {
      loadOrdresTravail();
      loadStatistiques();
    }
  };

  const handleOrdreDeleted = () => {
    showSuccess('Ordre de travail supprimé avec succès !');
    loadOrdresTravail();
    loadStatistiques();
    if (selectedOrdre) {
      setSelectedOrdre(null);
    }
  };

  const handleOrdreUpdated = () => {
    showSuccess('Ordre de travail modifié avec succès !');
    setEditMode(false);
    if (selectedOrdre) {
      loadOrdreDetails(selectedOrdre._id);
    }
    if (activeTab === 'list') {
      loadOrdresTravail();
      loadStatistiques();
    }
  };

  const handleEditOrdre = (ordre) => {
    setSelectedOrdre(ordre);
    setEditMode(true);
  };

  const handleCloseModals = () => {
    setSelectedOrdre(null);
    setEditMode(false);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
  };
  const handleOrdresSupprimes = (ordresSupprimes, paginationData) => {
    setOrdresTravail(ordresSupprimes); // Remplace la liste actuelle
    setPagination(paginationData || pagination); // Met à jour la pagination
  };

  // Gestionnaire de changement d'onglet
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Fermer les modals si on change d'onglet
    if (selectedOrdre) {
      setSelectedOrdre(null);
    }
    if (editMode) {
      setEditMode(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Ordres de Travail</h1>
              <p className="text-gray-600">Gestion des ordres de travail pour l'atelier</p>
            </div>
            <button
              onClick={() => window.history?.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Retour</span>
            </button>
          </div>
        </div>

        {/* Messages d'état */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6 flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            {success}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => handleTabChange('create')}
                className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'create'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Créer Ordre de Travail
              </button>
              <button
                onClick={() => handleTabChange('list')}
                className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'list'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Liste des Ordres
              </button>
            </nav>
          </div>
        </div>

        {/* Contenu principal */}
        {activeTab === 'create' && (
          <AjoutOrdreTravail
            services={services}
            ateliers={ateliers}
            mecaniciens={mecaniciens}
            onLoadMecaniciensByService={loadMecaniciensByService}
            onOrdreSaved={handleOrdreSaved}
            onError={showError}
            loading={loading}
            setLoading={setLoading}
          />
        )}

        {activeTab === 'list' && (
        <ListeOrdresTravail
          ordresTravail={ordresTravail}
          ateliers={ateliers}
          statistiques={statistiques}
          pagination={pagination}
          filters={filters}
          loading={loading}
          onLoadOrdres={loadOrdresTravail}
          onLoadOrdreDetails={loadOrdreDetails}
          onFiltersChange={setFilters}
          onError={showError}
          onSuccess={showSuccess}
          onOrdreDeleted={handleOrdreDeleted}
          onEditOrdre={handleEditOrdre}
          onOrdresSupprimes={handleOrdresSupprimes} // ✅ Nouvelle prop
        />
      )}

        {/* Modal de détail d'ordre */}
        {selectedOrdre && !editMode && (
          <DetailOrdreTravail
            ordre={selectedOrdre}
            onClose={handleCloseModals}
            onEdit={() => setEditMode(true)}
            onError={showError}
            onSuccess={showSuccess}
            onOrdreUpdated={() => {
              loadOrdreDetails(selectedOrdre._id);
              if (activeTab === 'list') {
                loadOrdresTravail();
                loadStatistiques();
              }
            }}
          />
        )}

        {/* Modal de modification d'ordre */}
        {selectedOrdre && editMode && (
          <ModificationOrdreTravail
            ordre={selectedOrdre}
            services={services}
            ateliers={ateliers}
            mecaniciens={mecaniciens}
            onLoadMecaniciensByService={loadMecaniciensByService}
            onClose={handleCloseModals}
            onCancel={handleCancelEdit}
            onSaved={handleOrdreUpdated}
            onError={showError}
            loading={loading}
            setLoading={setLoading}
          />
        )}
      </div>
    </div>
  );
};

export default OrdreTravailSystem;