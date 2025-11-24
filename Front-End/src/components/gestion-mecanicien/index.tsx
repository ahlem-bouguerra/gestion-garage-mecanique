"use client"
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Search, User, Calendar, Phone, Mail, Briefcase, AlertCircle, Check, X, Settings, Filter, Grid, List, MoreVertical } from 'lucide-react';
import axios from 'axios';

// Service interface to match backend
interface Service {
  serviceId: string;
  name: string;
}

interface Mecanicien {
  _id: string;
  matricule: string;
  nom: string;
  dateNaissance?: string;
  telephone: string;
  email: string;
  poste: 'Mécanicien' | 'Électricien Auto' | 'Carrossier' | 'Chef d\'équipe' | 'Apprenti';
  dateEmbauche?: string;
  typeContrat: 'CDI' | 'CDD' | 'Stage' | 'Apprentissage';
  statut: 'Actif' | 'Congé' | 'Arrêt maladie' | 'Suspendu' | 'Démissionné';
  salaire?: number;
  services: Service[];
  experience?: string;
  permisConduire: 'A' | 'B' | 'C' | 'D' | 'E';
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  nom: string;
  dateNaissance: string;
  telephone: string;
  email: string;
  poste: 'Mécanicien' | 'Électricien Auto' | 'Carrossier' | 'Chef d\'équipe' | 'Apprenti';
  dateEmbauche: string;
  typeContrat: 'CDI' | 'CDD' | 'Stage' | 'Apprentissage';
  statut: 'Actif' | 'Congé' | 'Arrêt maladie' | 'Suspendu' | 'Démissionné';
  salaire: string;
  services: Service[];
  experience: string;
  permisConduire: 'A' | 'B' | 'C' | 'D' | 'E';
}

type ViewType = 'grid' | 'list' | 'create';
type FilterStatus = 'all' | 'Actif' | 'Congé' | 'Arrêt maladie' | 'Suspendu' | 'Démissionné';

const MecaniciensManager = () => {
  const [activeView, setActiveView] = useState<ViewType>('grid');
  const [mecaniciens, setMecaniciens] = useState<Mecanicien[]>([]);
  const [selectedMecanicien, setSelectedMecanicien] = useState<Mecanicien | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [availableServices, setAvailableServices] = useState<{ _id: string; name: string }[]>([]);
  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  // Formulaire pour nouveau/modifier mécanicien
  const [formData, setFormData] = useState<FormData>({
    nom: '',
    dateNaissance: '',
    telephone: '',
    email: '',
    poste: 'Mécanicien',
    dateEmbauche: '',
    typeContrat: 'CDI',
    statut: 'Actif',
    salaire: '',
    services: [],
    experience: '',
    permisConduire: 'B',
  });

  // API calls
  const API_BASE_URL = 'http://localhost:5000/api';
  

  const mecaniciensApi = {

getAll: async (): Promise<Mecanicien[]> => {
  try {
    const token = getAuthToken();
    if (!token || token === 'null' || token === 'undefined') {
      window.location.href = '/auth/sign-in';
      throw new Error("Token invalide");
    }
    const { data } = await axios.get(`${API_BASE_URL}/getAllMecaniciens`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error: any) {
    // ⭐ AJOUTER la gestion 401/403
    if (error.response?.status === 403) {
      alert("❌ Accès refusé : Vous n'avez pas la permission");
      throw error;
    }
    if (error.response?.status === 401) {
      alert("❌ Session expirée : Veuillez vous reconnecter");
      window.location.href = '/auth/sign-in';
      throw error;
    }
    throw error;
  }
},

    getById: async (id: string): Promise<Mecanicien> => {
  try {
    const token = getAuthToken();
    if (!token || token === 'null' || token === 'undefined') {
      window.location.href = '/auth/sign-in';
      throw new Error("Token invalide"); // ⭐ Au lieu de return
    }
    const { data } = await axios.get(`${API_BASE_URL}/getMecanicienById/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error: any) {
    // ⭐ AJOUTER la gestion 401/403
    if (error.response?.status === 403) {
      alert("❌ Accès refusé : Vous n'avez pas la permission");
      throw error;
    }
    if (error.response?.status === 401) {
      alert("❌ Session expirée : Veuillez vous reconnecter");
      window.location.href = '/auth/sign-in';
      throw error;
    }
    throw error;
  }
},

create: async (data: object): Promise<Mecanicien> => {
  try {
    const token = getAuthToken();
    if (!token || token === 'null' || token === 'undefined') {
      window.location.href = '/auth/sign-in';
      throw new Error("Token invalide"); // ⭐ Au lieu de return
    }
    const res = await axios.post(`${API_BASE_URL}/createMecanicien`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
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
    throw new Error(error.response?.data?.error || "Erreur lors de la création");
  }
},

    update: async (id: string, data: object): Promise<Mecanicien> => {
      try {
              const token = getAuthToken();
      // ⭐ VÉRIFICATION CRITIQUE
      if (!token || token === 'null' || token === 'undefined') {
        // Rediriger vers le login
        window.location.href = '/auth/sign-in';
        throw new Error("Token invalide");
      }
        const res = await axios.put(`${API_BASE_URL}/updateMecanicien/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
        return res.data;
      }  catch (error: any) {
       if (error.response?.status === 403) {
            alert("❌ Accès refusé : Vous n'avez pas la permission ");
            throw error;
        }
        
        if (error.response?.status === 401) {
            alert("❌ Session expirée : Veuillez vous reconnecter");
            window.location.href = '/auth/sign-in';
            throw error;
        }
        throw new Error(error.response?.data?.error || "Erreur lors de la modification");
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
              const token = getAuthToken();
      // ⭐ VÉRIFICATION CRITIQUE
      if (!token || token === 'null' || token === 'undefined') {
        // Rediriger vers le login
        window.location.href = '/auth/sign-in';
        throw new Error("Token invalide");
      }
        await axios.delete(`${API_BASE_URL}/deleteMecanicien/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      }  catch (error: any) {
       if (error.response?.status === 403) {
            alert("❌ Accès refusé : Vous n'avez pas la permission ");
            throw error;
        }
        
        if (error.response?.status === 401) {
            alert("❌ Session expirée : Veuillez vous reconnecter");
            window.location.href = '/auth/sign-in';
            throw error;
        }
        throw new Error(error.response?.data?.error || "Erreur lors de la suppression");
      }
    }
  };

  // Load mécaniciens from API
  const loadMecaniciens = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await mecaniciensApi.getAll();
      setMecaniciens(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };



// Load available services
useEffect(() => {
  const fetchServices = async () => {
    try {
      const token = getAuthToken();
      // ⭐ VÉRIFICATION CRITIQUE
      if (!token || token === 'null' || token === 'undefined') {
        // Rediriger vers le login
        window.location.href = '/auth/sign-in';
        return;
      }
      
      const response = await axios.get('http://localhost:5000/api/services/available-for-mechanics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // ⭐ CORRECTION : Gérer la structure de la réponse
      console.log('📥 Services reçus:', response.data);
      
      // Si la réponse est un objet avec une propriété "services"
      if (response.data && Array.isArray(response.data.services)) {
        setAvailableServices(response.data.services);
      } 
      // Si la réponse est directement un tableau
      else if (Array.isArray(response.data)) {
        setAvailableServices(response.data);
      } 
      // Sinon, initialiser avec un tableau vide
      else {
        console.warn('⚠️ Format de réponse inattendu:', response.data);
        setAvailableServices([]);
      }
      
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
      
      console.error('Erreur lors du chargement des services:', error);
      // ⭐ En cas d'erreur, initialiser avec un tableau vide
      setAvailableServices([]);
    }
  };
  fetchServices();
}, []);

  // Service management functions
  const addService = () => {
    setFormData({
      ...formData,
      services: [...formData.services, { serviceId: '', name: '' }]
    });
  };

  const updateService = (index: number, serviceId: string) => {
    const selectedService = availableServices.find(service => service._id === serviceId);
    if (selectedService) {
      // Vérifier si le service n'est pas déjà sélectionné
      const isAlreadySelected = formData.services.some((service, i) =>
        i !== index && service.serviceId === serviceId
      );

      if (isAlreadySelected) {
        showError('Ce service a déjà été sélectionné');
        return;
      }

      const newServices = [...formData.services];
      newServices[index] = {
        serviceId: selectedService._id,
        name: selectedService.name
      };
      setFormData({ ...formData, services: newServices });
    }
  };
  const removeService = (index: number) => {
    const newServices = formData.services.filter((_, i) => i !== index);
    setFormData({ ...formData, services: newServices });
  };

  // Load data on mount
  useEffect(() => {
    loadMecaniciens();
  }, []);

  // Save mécanicien
  const saveMecanicien = async (): Promise<void> => {
    try {
      setLoading(true);

      if (!formData.nom || !formData.telephone || !formData.email) {
        showError('Veuillez remplir tous les champs obligatoires');
        return;
      }

      if (formData.services.length === 0) {
        showError('Au moins un service doit être sélectionné');
        return;
      }

      // Validate that all services have both serviceId and name
      const invalidServices = formData.services.filter(service => !service.serviceId || !service.name);
      if (invalidServices.length > 0) {
        showError('Veuillez sélectionner tous les services');
        return;
      }

      // Prepare data for API call
      const apiData = {
        ...formData,
        salaire: formData.salaire ? parseFloat(formData.salaire) : undefined
      };

      if (isEditMode && selectedMecanicien) {
        await mecaniciensApi.update(selectedMecanicien._id, apiData);
        showSuccess('Employé modifié avec succès !');
      } else {
        await mecaniciensApi.create(apiData);
        showSuccess('Employé créé avec succès !');
      }

      resetForm();
      await loadMecaniciens();
      setActiveView('grid');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Delete mécanicien
  const deleteMecanicien = async (id: string): Promise<void> => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce mécanicien ?')) return;

    try {
      setLoading(true);
      await mecaniciensApi.delete(id);
      showSuccess('Employé supprimé avec succès');
      await loadMecaniciens();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Start edit
  const startEdit = (mecanicien: Mecanicien): void => {
    setSelectedMecanicien(mecanicien);
    setIsEditMode(true);
    setFormData({
      nom: mecanicien.nom || '',
      dateNaissance: mecanicien.dateNaissance ? mecanicien.dateNaissance.split('T')[0] : '',
      telephone: mecanicien.telephone || '',
      email: mecanicien.email || '',
      poste: mecanicien.poste || 'Mécanicien',
      dateEmbauche: mecanicien.dateEmbauche ? mecanicien.dateEmbauche.split('T')[0] : '',
      typeContrat: mecanicien.typeContrat || 'CDI',
      statut: mecanicien.statut || 'Actif',
      salaire: mecanicien.salaire ? mecanicien.salaire.toString() : '',
      services: mecanicien.services || [],
      experience: mecanicien.experience || '',
      permisConduire: mecanicien.permisConduire || 'B',
    });
    setActiveView('create');
  };

  // Reset form
  const resetForm = (): void => {
    setFormData({
      nom: '',
      dateNaissance: '',
      telephone: '',
      email: '',
      poste: 'Mécanicien',
      dateEmbauche: '',
      typeContrat: 'CDI',
      statut: 'Actif',
      salaire: '',
      services: [],
      experience: '',
      permisConduire: 'B',
    });
    setSelectedMecanicien(null);
    setIsEditMode(false);
  };

  // Show messages
  const showError = (message: string): void => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const showSuccess = (message: string): void => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  // Filter mécaniciens
  const filteredMecaniciens = mecaniciens.filter(mec => {
    const matchesSearch = mec.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mec.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mec.poste.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || mec.statut === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Status colors
  const statusColors: Record<string, string> = {
    'Actif': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Congé': 'bg-blue-100 text-blue-800 border-blue-200',
    'Arrêt maladie': 'bg-red-100 text-red-800 border-red-200',
    'Suspendu': 'bg-amber-100 text-amber-800 border-amber-200',
    'Démissionné': 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const posteBadgeColors: Record<string, string> = {
    'Mécanicien': 'bg-blue-100 text-blue-800 border-blue-200',
    'Électricien Auto': 'bg-purple-100 text-purple-800 border-purple-200',
    'Carrossier': 'bg-green-100 text-green-800 border-green-200',
    'Chef d\'équipe': 'bg-orange-100 text-orange-800 border-orange-200',
    'Apprenti': 'bg-gray-100 text-gray-800 border-gray-200'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Équipe Technique
              </h1>
              <p className="text-gray-600 mt-2">Gestion moderne du personnel mécanique</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-white rounded-xl p-2 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setActiveView('grid')}
                    className={`p-2 rounded-lg transition-all duration-200 ${activeView === 'grid'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setActiveView('list')}
                    className={`p-2 rounded-lg transition-all duration-200 ${activeView === 'list'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <button
                onClick={() => { setActiveView('create'); resetForm(); }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="h-5 w-5" />
                <span>Nouveau Employés</span>
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 flex items-center shadow-sm">
            <AlertCircle className="h-5 w-5 mr-3 text-red-500" />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl mb-6 flex items-center shadow-sm">
            <Check className="h-5 w-5 mr-3 text-green-500" />
            {success}
          </div>
        )}

        {/* Search and Filters */}
        {activeView !== 'create' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, matricule ou poste..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="Actif">Actif</option>
                  <option value="Congé">Congé</option>
                  <option value="Arrêt maladie">Arrêt maladie</option>
                  <option value="Suspendu">Suspendu</option>
                </select>

                <div className="flex items-center text-sm text-gray-600 bg-gray-100 px-4 py-3 rounded-xl">
                  <span className="font-medium">{filteredMecaniciens.length}</span>
                  <span className="ml-1">mécanicien{filteredMecaniciens.length > 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grid View */}
        {activeView === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMecaniciens.map((mecanicien) => (
              <div key={mecanicien._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{mecanicien.nom}</h3>
                        <p className="text-sm text-gray-500">#{mecanicien.matricule}</p>
                      </div>
                    </div>
                   
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${posteBadgeColors[mecanicien.poste] || 'bg-gray-100 text-gray-800 border-gray-200'
                        }`}>
                        {mecanicien.poste}
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusColors[mecanicien.statut] || 'bg-gray-100 text-gray-800 border-gray-200'
                        }`}>
                        {mecanicien.statut}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{mecanicien.telephone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="truncate">{mecanicien.email}</span>
                      </div>
                      {mecanicien.dateEmbauche && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>Depuis {new Date(mecanicien.dateEmbauche).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' })}</span>
                        </div>
                      )}
                    </div>

                    {mecanicien.services && mecanicien.services.length > 0 && (
                      <div className="pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-2">Services ({mecanicien.services.length})</p>
                        <div className="flex flex-wrap gap-1">
                          {mecanicien.services.slice(0, 2).map((service, index) => (
                            <span key={index} className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                              {service.name}
                            </span>
                          ))}
                          {mecanicien.services.length > 2 && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              +{mecanicien.services.length - 2} autres
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2 mt-6 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => { setSelectedMecanicien(mecanicien); setShowModal(true); }}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Voir</span>
                    </button>
                    <button
                      onClick={() => startEdit(mecanicien)}
                      className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      <span>Modifier</span>
                    </button>
                    <button
                      onClick={() => deleteMecanicien(mecanicien._id)}
                      className="bg-red-100 hover:bg-red-200 text-red-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {activeView === 'list' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employé
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Poste
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Embauche
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Services
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>

                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMecaniciens.map((mecanicien) => (
                    <tr key={mecanicien._id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                              <User className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{mecanicien.nom}</div>
                            <div className="text-sm text-gray-500">#{mecanicien.matricule}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {mecanicien.telephone}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {mecanicien.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${posteBadgeColors[mecanicien.poste] || 'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                          {mecanicien.poste}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusColors[mecanicien.statut] || 'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                          {mecanicien.statut}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {mecanicien.dateEmbauche ? new Date(mecanicien.dateEmbauche).toLocaleDateString('fr-FR') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                        <button
                          onClick={() => { setSelectedMecanicien(mecanicien); setShowModal(true); }}
                          className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
                          title="Voir détails"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => startEdit(mecanicien)}
                          className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                          title="Modifier"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteMecanicien(mecanicien._id)}
                          className="text-red-600 hover:text-red-900 transition-colors duration-200"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {mecanicien.services && mecanicien.services.length > 0 ? (
                            <>
                              {mecanicien.services.slice(0, 2).map((service, index) => (
                                <span key={index} className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                                  {service.name}
                                </span>
                              ))}
                              {mecanicien.services.length > 2 && (
                                <span className="text-xs text-gray-500">+{mecanicien.services.length - 2}</span>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400 text-xs">Aucun service</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create/Edit Form */}
        {activeView === 'create' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
              <h2 className="text-2xl font-bold text-white">
                {isEditMode ? 'Modifier  Employés' : 'Nouveau Employés'}
              </h2>
              <p className="text-blue-100 mt-1">
                {isEditMode ? 'Mettre à jour les informations' : 'Ajouter un nouveau membre à l\'équipe'}
              </p>
            </div>

            <div className="p-8 space-y-8">
              {/* Informations personnelles */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Informations Personnelles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Ex: Ahmed Ben Ali"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de Naissance
                    </label>
                    <input
                      type="date"
                      value={formData.dateNaissance}
                      onChange={(e) => setFormData({ ...formData, dateNaissance: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="+216 XX XXX XXX"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="exemple@garage.tn"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Permis de Conduire
                    </label>
                    <select
                      value={formData.permisConduire}
                      onChange={(e) => setFormData({ ...formData, permisConduire: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="A">Catégorie A (Moto)</option>
                      <option value="B">Catégorie B (Voiture)</option>
                      <option value="C">Catégorie C (Poids lourd)</option>
                      <option value="D">Catégorie D (Transport)</option>
                      <option value="E">Catégorie E (Remorque)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Informations professionnelles */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <Briefcase className="h-5 w-5 mr-2 text-green-600" />
                  Informations Professionnelles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Poste
                    </label>
                    <select
                      value={formData.poste}
                      onChange={(e) => setFormData({ ...formData, poste: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="Mécanicien">Mécanicien</option>
                      <option value="Électricien Auto">Électricien Auto</option>
                      <option value="Carrossier">Carrossier</option>
                      <option value="Chef d'équipe">Chef d'équipe</option>
                      <option value="Apprenti">Apprenti</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type Contrat
                    </label>
                    <select
                      value={formData.typeContrat}
                      onChange={(e) => setFormData({ ...formData, typeContrat: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="CDI">CDI</option>
                      <option value="CDD">CDD</option>
                      <option value="Stage">Stage</option>
                      <option value="Apprentissage">Apprentissage</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Statut
                    </label>
                    <select
                      value={formData.statut}
                      onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="Actif">Actif</option>
                      <option value="Congé">Congé</option>
                      <option value="Arrêt maladie">Arrêt maladie</option>
                      <option value="Suspendu">Suspendu</option>
                      <option value="Démissionné">Démissionné</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Salaire (DT)
                    </label>
                    <input
                      type="number"
                      value={formData.salaire}
                      onChange={(e) => setFormData({ ...formData, salaire: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="1200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date d'Embauche
                    </label>
                    <input
                      type="date"
                      value={formData.dateEmbauche}
                      onChange={(e) => setFormData({ ...formData, dateEmbauche: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expérience
                    </label>
                    <textarea
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                      rows={3}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                      placeholder="Ex: 5 ans dans un garage Peugeot, spécialisé en diagnostic électronique..."
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-purple-600" />
                  Services *
                </h3>

                <div className="space-y-4">
                  {formData.services.map((service, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 flex items-center space-x-4">
                      <div className="flex-1">
                        <select
                          value={service.serviceId}
                          onChange={(e) => updateService(index, e.target.value)}
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          required
                        >
                          <option value="">Sélectionner un service</option>
                          {availableServices.map((availableService) => (
                            <option key={availableService._id} value={availableService._id}>
                              {availableService.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeService(index)}
                        className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-lg transition-colors duration-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addService}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-xl font-medium transition-colors duration-200 flex items-center space-x-2 w-full justify-center border-2 border-dashed border-blue-300"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Ajouter un service</span>
                  </button>

                  {formData.services.length === 0 && (
                    <p className="text-sm text-red-600 mt-2">Au moins un service doit être sélectionné</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-4 pt-6 border-t border-gray-200">
                <button
                  onClick={saveMecanicien}
                  disabled={loading}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Check className="h-5 w-5" />
                  <span>
                    {loading
                      ? (isEditMode ? 'Modification en cours...' : 'Enregistrement en cours...')
                      : (isEditMode ? 'Modifier le Mécanicien' : 'Enregistrer le Mécanicien')
                    }
                  </span>
                </button>
                <button
                  onClick={() => { setActiveView('grid'); resetForm(); }}
                  className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-200 transition-colors duration-200 flex items-center space-x-2"
                >
                  <X className="h-5 w-5" />
                  <span>Annuler</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showModal && selectedMecanicien && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-screen overflow-y-auto">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-8 py-6 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Profil Détaillé</h2>
                    <p className="text-gray-300 mt-1">{selectedMecanicien.nom}</p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-300 hover:text-white p-2 hover:bg-gray-700 rounded-lg transition-colors duration-200"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Informations personnelles */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <User className="h-5 w-5 mr-2 text-blue-600" />
                      Informations Personnelles
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Nom:</span>
                        <span className="text-gray-900">{selectedMecanicien.nom}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Matricule:</span>
                        <span className="text-gray-900 font-mono">#{selectedMecanicien.matricule}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Date de naissance:</span>
                        <span className="text-gray-900">{
                          selectedMecanicien.dateNaissance ?
                            new Date(selectedMecanicien.dateNaissance).toLocaleDateString('fr-FR') : 'Non renseignée'
                        }</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Téléphone:</span>
                        <span className="text-gray-900">{selectedMecanicien.telephone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Email:</span>
                        <span className="text-gray-900">{selectedMecanicien.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Permis:</span>
                        <span className="text-gray-900 font-semibold">Catégorie {selectedMecanicien.permisConduire}</span>
                      </div>
                    </div>
                  </div>

                  {/* Informations professionnelles */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Briefcase className="h-5 w-5 mr-2 text-green-600" />
                      Informations Professionnelles
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-600">Poste:</span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${posteBadgeColors[selectedMecanicien.poste] || 'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                          {selectedMecanicien.poste}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-600">Statut:</span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusColors[selectedMecanicien.statut] || 'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                          {selectedMecanicien.statut}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Type contrat:</span>
                        <span className="text-gray-900 font-semibold">{selectedMecanicien.typeContrat}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Date d'embauche:</span>
                        <span className="text-gray-900">{
                          selectedMecanicien.dateEmbauche ?
                            new Date(selectedMecanicien.dateEmbauche).toLocaleDateString('fr-FR') : 'Non renseignée'
                        }</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Salaire:</span>
                        <span className="text-gray-900 font-semibold">{
                          selectedMecanicien.salaire ? `${selectedMecanicien.salaire} DT` : 'Non renseigné'
                        }</span>
                      </div>

                    </div>
                  </div>

                  {/* Compétences */}
                  {selectedMecanicien.services && selectedMecanicien.services.length > 0 && (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <Settings className="h-5 w-5 mr-2 text-purple-600" />
                        Services
                      </h3>
                      <div className="space-y-3">
                        {selectedMecanicien.services.map((service, index) => (
                          <div key={index} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-purple-100">
                            <span className="font-medium text-gray-800">{service.name}</span>
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                              Service #{index + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expérience */}
                  {selectedMecanicien.experience && (
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-amber-600" />
                        Expérience Professionnelle
                      </h3>
                      <p className="text-gray-700 leading-relaxed">{selectedMecanicien.experience}</p>
                    </div>
                  )}

                  {/* Dates importantes */}
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200 lg:col-span-2">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-gray-600" />
                      Historique
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Profil créé le:</span>
                        <span className="text-gray-900">{new Date(selectedMecanicien.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Dernière modification:</span>
                        <span className="text-gray-900">{new Date(selectedMecanicien.updatedAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      startEdit(selectedMecanicien);
                    }}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span>Modifier</span>
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors duration-200"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MecaniciensManager;