"use client";
import React, { useState, useEffect } from 'react';
import { UserCheck, UserX, Users, X } from 'lucide-react';
import axios from 'axios';

function GarageEtGaragiteTableStatus() {
  const [garages, setGarages] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // ✅ NOUVEAU: États pour le modal des garagistes
  const [showGaragistesModal, setShowGaragistesModal] = useState(false);
  const [selectedGarageId, setSelectedGarageId] = useState(null);
  const [garagistes, setGaragistes] = useState({});
  const [loadingGaragistes, setLoadingGaragistes] = useState({});
  
  const resultsPerPage = 10;

  // Configuration axios avec le token
  const axiosInstance = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  // Récupérer tous les garages
  useEffect(() => {
    fetchGarages();
  }, []);

  const fetchGarages = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get('/garages');
      const data = response.data;
      
      if (data.garages && Array.isArray(data.garages)) {
        setGarages(data.garages);
      } else if (Array.isArray(data)) {
        setGarages(data);
      } else {
        console.error('Format de données inattendu:', data);
        setError('Format de données incorrect reçu du serveur');
        setGarages([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des garages');
      console.error('Erreur:', err);
      setGarages([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ NOUVEAU: Récupérer les garagistes d'un garage
  const fetchGaragistes = async (garageId) => {
    setLoadingGaragistes(prev => ({ ...prev, [garageId]: true }));
    try {
      const response = await axiosInstance.get(`/garage/${garageId}/garagistes`);
      const data = response.data;
      
      // Gérer différents formats de réponse
      const garagistesList = Array.isArray(data) ? data : 
                            data.garagistes ? data.garagistes : [];
      
      setGaragistes(prev => ({ ...prev, [garageId]: garagistesList }));
      return garagistesList;
    } catch (err) {
      console.error('Erreur chargement garagistes:', err);
      alert('Erreur: ' + (err.response?.data?.message || err.message));
      return [];
    } finally {
      setLoadingGaragistes(prev => ({ ...prev, [garageId]: false }));
    }
  };

  // ✅ NOUVEAU: Ouvrir le modal des garagistes
  const openGaragistesModal = async (garageId) => {
    setSelectedGarageId(garageId);
    setShowGaragistesModal(true);
    
    // Charger les garagistes si pas déjà chargés
    if (!garagistes[garageId]) {
      await fetchGaragistes(garageId);
    }
  };

  // ✅ NOUVEAU: Activer un garagiste
  const activateGaragiste = async (garageId, garagisteId) => {
    try {
      await axiosInstance.patch(`/garagiste/${garagisteId}/activate`);
      await fetchGaragistes(garageId);
      alert('Garagiste activé avec succès !');
    } catch (err) {
      alert('Erreur: ' + (err.response?.data?.message || err.message));
    }
  };

  // ✅ NOUVEAU: Désactiver un garagiste
  const deactivateGaragiste = async (garageId, garagisteId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir désactiver ce garagiste ?')) {
      return;
    }
    
    try {
      await axiosInstance.patch(`/garagiste/${garagisteId}/deactivate`);
      await fetchGaragistes(garageId);
      alert('Garagiste désactivé avec succès !');
    } catch (err) {
      alert('Erreur: ' + (err.response?.data?.message || err.message));
    }
  };

  // Activer un garage
  const activateGarage = async (garageId) => {
    try {
      await axiosInstance.patch(`/garage/${garageId}/activate`);
      await fetchGarages();
      alert('Garage activé avec succès !');
    } catch (err) {
      alert('Erreur: ' + (err.response?.data?.message || err.message));
    }
  };

  // Désactiver un garage
  const deactivateGarage = async (garageId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir désactiver ce garage ?')) {
      return;
    }
    
    try {
      await axiosInstance.patch(`/garage/${garageId}/deactivate`);
      await fetchGarages();
      alert('Garage désactivé avec succès !');
    } catch (err) {
      alert('Erreur: ' + (err.response?.data?.message || err.message));
    }
  };

  const safeGarages = Array.isArray(garages) ? garages : [];
  const totalPages = Math.ceil(safeGarages.length / resultsPerPage);
  const paginatedGarages = safeGarages.slice(
    (page - 1) * resultsPerPage, 
    page * resultsPerPage
  );

  // ✅ NOUVEAU: Variables pour le modal
  const currentGaragistes = selectedGarageId ? garagistes[selectedGarageId] || [] : [];
  const selectedGarage = garages.find(g => (g._id || g.id) === selectedGarageId);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Garages</h1>
        <p className="text-gray-600 mb-8">Gérez l'activation des garages et leurs garagistes</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-2 text-gray-600">Chargement...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Garage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        matriculeFiscal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date de création
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedGarages.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                          Aucun garage trouvé
                        </td>
                      </tr>
                    ) : (
                      paginatedGarages.map((garage) => (
                        <tr key={garage._id || garage.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                                  {garage.nom?.charAt(0).toUpperCase() || 'G'}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{garage.nom || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{garage.matriculeFiscal}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {garage.isActive ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Activé
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                Désactivé
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {garage.createdAt ? new Date(garage.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {/* ✅ MODIFIÉ: Ajout du bouton Garagistes */}
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => openGaragistesModal(garage._id || garage.id)}
                                className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                title="Voir les garagistes"
                              >
                                <Users className="w-4 h-4 mr-1" />
                                Garagistes
                              </button>
                              <button
                                onClick={() => activateGarage(garage._id || garage.id)}
                                disabled={garage.isActive}
                                className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md transition-colors ${
                                  garage.isActive
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                                }`}
                                title={garage.isActive ? 'Déjà activé' : 'Activer garage'}
                              >
                                <UserCheck className="w-4 h-4 mr-1" />
                                Activer
                              </button>
                              <button
                                onClick={() => deactivateGarage(garage._id || garage.id)}
                                disabled={!garage.isActive}
                                className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md transition-colors ${
                                  !garage.isActive
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                                }`}
                                title={!garage.isActive ? 'Déjà désactivé' : 'Désactiver garage'}
                              >
                                <UserX className="w-4 h-4 mr-1" />
                                Désactiver
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Précédent
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Suivant
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Affichage de <span className="font-medium">{(page - 1) * resultsPerPage + 1}</span> à{' '}
                        <span className="font-medium">{Math.min(page * resultsPerPage, safeGarages.length)}</span> sur{' '}
                        <span className="font-medium">{safeGarages.length}</span> résultats
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Précédent
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setPage(i + 1)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === i + 1
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                        <button
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Suivant
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ✅ NOUVEAU: Modal des Garagistes */}
      {showGaragistesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Garagistes de {selectedGarage?.nom || 'Garage'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">{selectedGarage?.matriculeFiscal}</p>
              </div>
              <button
                onClick={() => setShowGaragistesModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {loadingGaragistes[selectedGarageId] ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                  <p className="mt-2 text-gray-600">Chargement des garagistes...</p>
                </div>
              ) : currentGaragistes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Aucun garagiste trouvé</p>
                  <p className="text-sm mt-2">Ce garage n'a pas encore de garagistes enregistrés</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentGaragistes.map((garagiste) => (
                    <div
                      key={garagiste._id || garagiste.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                            {garagiste.username?.charAt(0).toUpperCase() || 'G'}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {garagiste.username}
                            </h3>
                            <p className="text-sm text-gray-500">{garagiste.email}</p>
                            <p className="text-sm text-gray-500">{garagiste.phone || 'Pas de téléphone'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          {garagiste.isActive ? (
                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Actif
                            </span>
                          ) : (
                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              Inactif
                            </span>
                          )}
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={() => activateGaragiste(selectedGarageId, garagiste._id || garagiste.id)}
                              disabled={garagiste.isActive}
                              className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                garagiste.isActive
                                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              Activer
                            </button>
                            <button
                              onClick={() => deactivateGaragiste(selectedGarageId, garagiste._id || garagiste.id)}
                              disabled={!garagiste.isActive}
                              className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                !garagiste.isActive
                                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  : 'bg-red-600 text-white hover:bg-red-700'
                              }`}
                            >
                              <UserX className="w-4 h-4 mr-1" />
                              Désactiver
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GarageEtGaragiteTableStatus;