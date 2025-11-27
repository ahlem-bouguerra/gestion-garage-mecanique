"use client"
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle,
  Package,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';

interface Service {
  _id: string;
  id: string;
  name: string;
  description: string;
  statut: string;
}

interface GarageService {
  _id: string;
  serviceId: Service;
  addedAt: string;
}
const GaragisteServicesSelector = () => {
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [myServices, setMyServices] = useState<GarageService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedServiceToAdd, setSelectedServiceToAdd] = useState<string>('');

  const API_BASE_URL = 'http://localhost:5000/api';

  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  // Récupérer les services disponibles (créés par Super Admin)
  const fetchAvailableServices = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        window.location.href = '/auth/sign-in';
        return;
      }

      const response = await fetch(`${API_BASE_URL}/services/available`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 401) {
        window.location.href = '/auth/sign-in';
        return;
      }

      const data = await response.json();
      setAvailableServices(data);
    } catch (error) {
      console.error("Erreur fetch services disponibles:", error);
    }
  };

  // Récupérer MES services (de mon garage)
  const fetchMyServices = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        window.location.href = '/auth/sign-in';
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/services/my-garage`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 401) {
        window.location.href = '/auth/sign-in';
        return;
      }

       setMyServices(response.data || []);
    } catch (error) {
      console.error("Erreur fetch mes services:", error);
    } finally {
      setLoading(false);
    }
  };

  // Ajouter un service à mon garage
  const addServiceToGarage = async () => {
    if (!selectedServiceToAdd) return;

    try {
      const token = getAuthToken();
      if (!token) {
        window.location.href = '/auth/sign-in';
        return;
      }

      const response = await fetch(`${API_BASE_URL}/services/add`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ serviceId: selectedServiceToAdd })
      });

      if (response.status === 409) {
        alert("❌ Ce service est déjà dans votre garage");
        return;
      }

      if (response.status === 401) {
        window.location.href = '/auth/sign-in';
        return;
      }

      if (response.ok) {
        await fetchMyServices();
        setShowModal(false);
        setSelectedServiceToAdd('');
      }
    } catch (error) {
      console.error("Erreur ajout service:", error);
      alert("❌ Erreur lors de l'ajout du service");
    }
  };

  // Retirer un service de mon garage
  const removeService = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce service de votre garage ?')) return;

    try {
      const token = getAuthToken();
      if (!token) {
        window.location.href = '/auth/sign-in';
        return;
      }

      const response = await fetch(`${API_BASE_URL}/services/${id}/remove`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 401) {
        window.location.href = '/auth/sign-in';
        return;
      }

      if (response.ok) {
        await fetchMyServices();
      }
    } catch (error) {
      console.error("Erreur suppression service:", error);
    }
  };

  const openAddModal = () => {
    setSelectedServiceToAdd('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedServiceToAdd('');
  };

  // Filtrer mes services
  const filteredMyServices = myServices.filter(gs =>
    gs.serviceId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gs.serviceId.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Services disponibles non encore ajoutés
  const servicesNotInGarage = availableServices.filter(service => 
    !myServices.some(gs => gs.serviceId._id === service._id)
  );

  useEffect(() => {
    fetchAvailableServices();
    fetchMyServices();
  }, []);

  if (loading) {
    return (
      <div className="p-8 bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-white rounded-2xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <Package className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Mes Services</h2>
            <p className="text-gray-600">Sélectionnez les services pour votre garage</p>
          </div>
        </div>
        <button
          onClick={openAddModal}
          disabled={servicesNotInGarage.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 flex items-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Plus className="h-5 w-5" />
          <span>Ajouter un service</span>
        </button>
      </div>

      {/* Info Box */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">💡 Information</p>
          <p>Les services sont créés et gérés par le Super Admin. Vous pouvez seulement sélectionner et ajouter les services à votre garage.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher dans mes services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMyServices.map((garageService) => (
          <div
            key={garageService._id}
            className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {garageService.serviceId.name}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {garageService.serviceId.description}
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center space-x-1">
                <CheckCircle className="h-4 w-4" />
                <span>Actif</span>
              </span>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                Ajouté le {new Date(garageService.addedAt).toLocaleDateString('fr-FR')}
              </div>
              <button
                onClick={() => removeService(garageService._id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                title="Retirer du garage"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredMyServices.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun service dans votre garage</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Essayez de modifier votre recherche' : 'Commencez par ajouter des services'}
          </p>
          {servicesNotInGarage.length > 0 && (
            <button
              onClick={openAddModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 inline-flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Ajouter votre premier service</span>
            </button>
          )}
        </div>
      )}

      {/* Modal Ajout Service */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Ajouter un service
              </h3>
            </div>

            <div className="p-6">
              {servicesNotInGarage.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Vous avez déjà tous les services disponibles dans votre garage !
                  </p>
                </div>
              ) : (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sélectionner un service
                  </label>
                  <select
                    value={selectedServiceToAdd}
                    onChange={(e) => setSelectedServiceToAdd(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                  >
                    <option value="">-- Choisir un service --</option>
                    {servicesNotInGarage.map((service) => (
                      <option key={service._id} value={service._id}>
                        {service.name}
                      </option>
                    ))}
                  </select>

                  {selectedServiceToAdd && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        {servicesNotInGarage.find(s => s._id === selectedServiceToAdd)?.description}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center space-x-3 pt-4">
                    <button
                      onClick={addServiceToGarage}
                      disabled={!selectedServiceToAdd}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Ajouter
                    </button>
                    <button
                      onClick={closeModal}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-xl font-medium transition-colors duration-200"
                    >
                      Annuler
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GaragisteServicesSelector;