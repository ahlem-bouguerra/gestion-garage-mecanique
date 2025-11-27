"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, Building, X, Check } from 'lucide-react';
import axios from 'axios';

const AtelierManager = () => {
  const [ateliers, setAteliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAtelier, setEditingAtelier] = useState(null);
  const [formData, setFormData] = useState({ name: '', localisation: '' });
  const [error, setError] = useState('');
    const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  // Configuration de l'API - Ajustez l'URL selon votre backend
  const API_BASE_URL = 'http://localhost:5000/api'; // Modifiez selon votre configuration

  // Chargement initial des ateliers
  useEffect(() => {
    fetchAteliers();
  }, []);

const fetchAteliers = async () => {
  try {
    setLoading(true);
    const token = getAuthToken();
    if (!token || token === 'null' || token === 'undefined') {
      window.location.href = '/auth/sign-in';
      throw new Error("Token invalide");
    }
    const response = await axios.get(`${API_BASE_URL}/getAllAteliers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // ⭐ CORRECTION : Extraire ateliers de l'objet response
    setAteliers(response.data.ateliers || []); // Au lieu de response.data
    
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
    console.error('Erreur lors du chargement des ateliers:', error);
    setAteliers([]); // ⭐ Initialiser à tableau vide en cas d'erreur
  } finally {
    setLoading(false);
  }
};

// Création d'un atelier
const createAtelier = async (data) => {
  try {
    const token = getAuthToken();
    if (!token || token === 'null' || token === 'undefined') {
      window.location.href = '/auth/sign-in';
      throw new Error("Token invalide");
    }
    const response = await axios.post(
      `${API_BASE_URL}/createAtelier`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
      }
    );

    const newAtelier = response.data;
    setAteliers([...ateliers, newAtelier]);
    return true;

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
    setError(error.response?.data?.error || 'Erreur lors de la création');
    console.error('Erreur:', error);
    return false;
  }
};

// Mise à jour d'un atelier
const updateAtelier = async (id, data) => {
  try {
    const token = getAuthToken();
    if (!token || token === 'null' || token === 'undefined') {
      window.location.href = '/auth/sign-in';
      throw new Error("Token invalide");
    }
    const response = await axios.put(
      `${API_BASE_URL}/updateAtelier/${id}`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
      }
    );

    const updatedAtelier = response.data;
    setAteliers(ateliers.map(a => a._id === id ? updatedAtelier : a));
    return true;

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
    setError(error.response?.data?.error || 'Erreur lors de la mise à jour');
    console.error('Erreur:', error);
    return false;
  }
};

// Suppression d'un atelier
const deleteAtelier = async (id) => {
  if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet atelier ?')) return;

  try {
    const token = getAuthToken();
    if (!token || token === 'null' || token === 'undefined') {
      window.location.href = '/auth/sign-in';
      throw new Error("Token invalide");
    }
    await axios.delete(
      `${API_BASE_URL}/deleteAtelier/${id}`,
      {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      }
    );

    setAteliers(ateliers.filter(a => a._id !== id));

  }  catch(error: any) {
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
    setError(error.response?.data?.error || 'Erreur lors de la suppression');
    console.error('Erreur:', error);
  }
};


  // Gestion du formulaire
  const handleSubmit = async () => {
    setError('');

    if (!formData.name.trim() || !formData.localisation.trim()) {
      setError('Le nom et la localisation sont obligatoires');
      return;
    }

    let success;
    if (editingAtelier) {
      success = await updateAtelier(editingAtelier._id, formData);
    } else {
      success = await createAtelier(formData);
    }

    if (success) {
      closeModal();
    }
  };

  const openModal = (atelier = null) => {
    setEditingAtelier(atelier);
    setFormData(atelier ? { name: atelier.name, localisation: atelier.localisation } : { name: '', localisation: '' });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAtelier(null);
    setFormData({ name: '', localisation: '' });
    setError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des ateliers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestion des Ateliers</h1>
                <p className="text-gray-600">Gérez vos ateliers et leurs localisations</p>
              </div>
            </div>
            <button
              onClick={() => openModal()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nouvel Atelier
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Ateliers</p>
                <p className="text-2xl font-semibold text-gray-900">{ateliers.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des ateliers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Liste des Ateliers</h2>
          </div>

          {ateliers.length === 0 ? (
            <div className="text-center py-12">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">Aucun atelier trouvé</p>
              <p className="text-gray-400">Commencez par créer votre premier atelier</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom de l'Atelier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Localisation
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ateliers.map((atelier) => (
                    <tr key={atelier._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-100 rounded-lg mr-3">
                            <Building className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {atelier.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                          {atelier.localisation}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openModal(atelier)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteAtelier(atelier._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de création/modification */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingAtelier ? 'Modifier l\'Atelier' : 'Nouvel Atelier'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'Atelier *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Entrez le nom de l'atelier"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Localisation *
                </label>
                <input
                  type="text"
                  value={formData.localisation}
                  onChange={(e) => setFormData({ ...formData, localisation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Entrez la localisation"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {editingAtelier ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AtelierManager;