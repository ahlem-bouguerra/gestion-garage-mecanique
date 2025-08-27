"use client"
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertCircle 
} from 'lucide-react';

// Types
interface Service {
  _id: string;
  id:string;
  name: string;
  description: string;
  statut: 'Actif' | 'Désactivé';
  createdAt?: string;
  updatedAt?: string;
}

interface ServiceFormData {
  name: string;
  description: string;
  statut: 'Actif' | 'Désactivé';
}

const ServicesManager = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    statut: 'Actif'
  });
  const API_BASE_URL = 'http://localhost:5000/api';

  // Fetch all services
  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/getAllServices`);
      setServices(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des services:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create service
  const createService = async () => {
    try {
      await axios.post(`${API_BASE_URL}/createService`, formData);
      await fetchServices();
      closeModal();
    } catch (error) {
      console.error('Erreur lors de la création du service:', error);
    }
  };

  // Update service
  const updateService = async () => {
    if (!selectedService) return;

    try {
      await axios.put(`${API_BASE_URL}/updateService/${selectedService._id}`, formData);
      await fetchServices();
      closeModal();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du service:', error);
    }
  };

  // Delete service
  const deleteService = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/deleteService/${id}`);
      await fetchServices();
    } catch (error) {
      console.error('Erreur lors de la suppression du service:', error);
    }
  };

  // Modal handlers
  const openCreateModal = () => {
    setModalMode('create');
    setFormData({
      name: '',
      description: '',
      statut: 'Actif'
    });
    setSelectedService(null);
    setShowModal(true);
  };

  const openEditModal = (service: Service) => {
    setModalMode('edit');
    setFormData({
      name: service.name,
      description: service.description,
      statut: service.statut
    });
    setSelectedService(service);
    setShowModal(true);
  };

  const openViewModal = (service: Service) => {
    setModalMode('view');
    setSelectedService(service);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedService(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'create') {
      createService();
    } else if (modalMode === 'edit') {
      updateService();
    }
  };

  // Filter services
  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get status icon and color
  const getStatusDisplay = (statut: string) => {
    switch (statut) {
      case 'Actif':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          text: 'Actif',
          badge: 'bg-green-100 text-green-800'
        };
      case 'Désactivé':
        return {
          icon: <XCircle className="h-5 w-5 text-red-500" />,
          text: 'Désactivé',
          badge: 'bg-red-100 text-red-800'
        };
      default:
        return {
          icon: <AlertCircle className="h-5 w-5 text-gray-500" />,
          text: 'Inconnu',
          badge: 'bg-gray-100 text-gray-800'
        };
    }
  };

  useEffect(() => {
    fetchServices();
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
          <Settings className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestion des Services</h2>
            <p className="text-gray-600">Gérez les services de votre garage</p>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Ajouter un service</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher des services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => {
          const statusDisplay = getStatusDisplay(service.statut);
          
          return (
            <div
              key={service._id}
              className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {service.name}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {service.description}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusDisplay.badge} flex items-center space-x-1`}>
                  {statusDisplay.icon}
                  <span>{statusDisplay.text}</span>
                </span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  ID: {service.id.slice(-6)}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openViewModal(service)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                    title="Voir les détails"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openEditModal(service)}
                    className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors duration-200"
                    title="Modifier"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteService(service._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun service trouvé</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Essayez de modifier votre recherche' : 'Commencez par ajouter votre premier service'}
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {modalMode === 'create' && 'Ajouter un service'}
                {modalMode === 'edit' && 'Modifier le service'}
                {modalMode === 'view' && 'Détails du service'}
              </h3>
            </div>

            <div className="p-6">
              {modalMode === 'view' && selectedService ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedService.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedService.description}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                    <div className="flex items-center space-x-2">
                      {getStatusDisplay(selectedService.statut).icon}
                      <span className="text-gray-900">{getStatusDisplay(selectedService.statut).text}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ID</label>
                    <p className="text-gray-600 font-mono text-sm bg-gray-50 p-3 rounded-lg">{selectedService.id}</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom du service *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Vidange moteur"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Description détaillée du service..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Statut
                    </label>
                    <select
                      value={formData.statut}
                      onChange={(e) => setFormData({ ...formData, statut: e.target.value as 'Actif' | 'Désactivé' })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="actif">Actif</option>
                      <option value="Désactivé">Désactivé</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors duration-200"
                    >
                      {modalMode === 'create' ? 'Créer le service' : 'Sauvegarder'}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-xl font-medium transition-colors duration-200"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}

              {modalMode === 'view' && (
                <div className="flex items-center space-x-3 pt-6">
                  <button
                    onClick={closeModal}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-xl font-medium transition-colors duration-200"
                  >
                    Fermer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesManager;