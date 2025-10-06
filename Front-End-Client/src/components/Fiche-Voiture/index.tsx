"use client"
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Car, Plus, Edit2, Trash2, MapPin, Calendar, Gauge, Fuel, History, AlertCircle } from 'lucide-react';
// ✅ Import corrigé - exports nommés
import { validateImmatriculation, IMMATRICULATION_RULES } from "../../../../shared/immatriculationValidator.mjs";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

const api = {
  getVehicules: async () => {
    const response = await axios.get(`${API_URL}/get-all-mes-vehicules`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` }
    });
    return response.data;
  },
  
  createVehicule: async (data) => {
    const response = await axios.post(`${API_URL}/create-mes-vehicules`, data, {
      headers: { Authorization: `Bearer ${getAuthToken()}` }
    });
    return response.data;
  },
  
  updateVehicule: async (id, data) => {
    const response = await axios.put(`${API_URL}/update-mes-vehicules/${id}`, data, {
      headers: { Authorization: `Bearer ${getAuthToken()}` }
    });
    return response.data;
  },
  
  deleteVehicule: async (id) => {
    const response = await axios.delete(`${API_URL}/delete-mes-vehicules/${id}`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` }
    });
    return response.data;
  }
};

const ClientVehicules = () => {
  const [vehicules, setVehicules] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedVehicule, setSelectedVehicule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    marque: '',
    modele: '',
    immatriculation: '',
    paysImmatriculation: 'tunisie',
    annee: '',
    couleur: '',
    typeCarburant: 'essence',
    kilometrage: ''
  });

  useEffect(() => {
    loadVehicules();
  }, []);

  const loadVehicules = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getVehicules();
      setVehicules(data);
    } catch (error) {
      console.error('Erreur chargement:', error);
      const errorMsg = error.response?.data?.message || 'Impossible de charger les véhicules';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    // ✅ Utilisation de la fonction importée (pas de redéfinition)
    const validation = validateImmatriculation(
      formData.immatriculation,
      formData.paysImmatriculation
    );
    
    if (!validation.valid) {
      setError(validation.message);
      setLoading(false);
      return;
    }
    
    const dataToSend = {
      ...formData,
      immatriculation: validation.formatted
    };

    try {
      if (selectedVehicule) {
        const updated = await api.updateVehicule(selectedVehicule._id, dataToSend);
        setVehicules(vehicules.map(v => v._id === updated._id ? updated : v));
        setSuccess('Véhicule modifié avec succès');
      } else {
        const created = await api.createVehicule(dataToSend);
        setVehicules([created, ...vehicules]);
        setSuccess('Véhicule ajouté avec succès');
      }
      closeModal();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Erreur:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Une erreur est survenue';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    try {
      await api.deleteVehicule(selectedVehicule._id);
      setVehicules(vehicules.filter(v => v._id !== selectedVehicule._id));
      setShowDeleteConfirm(false);
      setSelectedVehicule(null);
      setSuccess('Véhicule supprimé avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Erreur suppression:', error);
      const errorMsg = error.response?.data?.message || 'Erreur lors de la suppression';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (vehicule = null) => {
    setError('');
    if (vehicule) {
      setSelectedVehicule(vehicule);
      setFormData({
        marque: vehicule.marque,
        modele: vehicule.modele,
        immatriculation: vehicule.immatriculation,
        paysImmatriculation: vehicule.paysImmatriculation || 'tunisie',
        annee: vehicule.annee || '',
        couleur: vehicule.couleur || '',
        typeCarburant: vehicule.typeCarburant,
        kilometrage: vehicule.kilometrage || ''
      });
    } else {
      setSelectedVehicule(null);
      setFormData({
        marque: '',
        modele: '',
        immatriculation: '',
        paysImmatriculation: 'tunisie',
        annee: '',
        couleur: '',
        typeCarburant: 'essence',
        kilometrage: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedVehicule(null);
    setError('');
  };

  const getCarburantIcon = (type) => {
    const icons = {
      essence: '⛽',
      diesel: '🛢️',
      hybride: '🔋',
      electrique: '⚡',
      gpl: '💨'
    };
    return icons[type] || '⛽';
  };

  // ✅ SUPPRIMÉ - on utilise la fonction importée
  // const validateImmatriculation = (immat, pays) => { ... }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Messages d'alerte */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto text-red-600 hover:text-red-800">✕</button>
          </div>
        )}
        
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
            <span>✓</span>
            <span>{success}</span>
            <button onClick={() => setSuccess('')} className="ml-auto text-green-600 hover:text-green-800">✕</button>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mes Véhicules</h1>
            <p className="text-gray-600 mt-1">Gérez votre parc automobile</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            Ajouter un véhicule
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Car className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total véhicules</p>
                <p className="text-2xl font-bold text-gray-900">{vehicules.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-full">
                <MapPin className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Garages partenaires</p>
                <p className="text-2xl font-bold text-gray-900">
                  {[...new Set(vehicules.flatMap(v => v.historique_garages?.map(h => h.garageId?.nom) || []))].filter(Boolean).length}
                </p>
              </div>
            </div>
          </div>
       
        </div>

        {/* Liste des véhicules */}
        {loading && vehicules.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Chargement des véhicules...</p>
          </div>
        ) : vehicules.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Car className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun véhicule</h3>
            <p className="text-gray-600 mb-6">Commencez par ajouter votre premier véhicule</p>
            <button
              onClick={() => openModal()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Ajouter un véhicule
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicules.map(vehicule => (
              <div key={vehicule._id} className="bg-white rounded-lg shadow hover:shadow-lg transition">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-t-lg">
                  <div className="flex justify-between items-start">
                    <div className="text-white">
                      <h3 className="text-2xl font-bold">{vehicule.marque}</h3>
                      <p className="text-blue-100">{vehicule.modele}</p>
                    </div>
                    <span className="text-3xl">{getCarburantIcon(vehicule.typeCarburant)}</span>
                  </div>
                  <div className="mt-4 bg-white/20 backdrop-blur-sm rounded px-3 py-2 inline-block">
                    <p className="text-white font-mono font-bold text-lg">{vehicule.immatriculation}</p>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-3 mb-6">
                    {vehicule.annee && (
                      <div className="flex items-center gap-3 text-gray-600">
                        <Calendar size={18} className="text-gray-400" />
                        <span>{vehicule.annee}</span>
                      </div>
                    )}
                    {vehicule.couleur && (
                      <div className="flex items-center gap-3 text-gray-600">
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" style={{ backgroundColor: vehicule.couleur.toLowerCase() }}></div>
                        <span className="capitalize">{vehicule.couleur}</span>
                      </div>
                    )}
                    {vehicule.kilometrage > 0 && (
                      <div className="flex items-center gap-3 text-gray-600">
                        <Gauge size={18} className="text-gray-400" />
                        <span>{vehicule.kilometrage.toLocaleString()} km</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-gray-600">
                      <Fuel size={18} className="text-gray-400" />
                      <span className="capitalize">{vehicule.typeCarburant}</span>
                    </div>
                  </div>

                  {vehicule.historique_garages && vehicule.historique_garages.length > 0 && (
                    <div className="border-t pt-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <History size={16} />
                        <span>Garages visités</span>
                      </div>
                      <div className="space-y-1">
                        {vehicule.historique_garages.slice(0, 2).map((h, i) => (
                          <div key={i} className="text-sm text-gray-700 flex items-center gap-2">
                            <MapPin size={14} className="text-blue-500" />
                            <span>{h.garageId?.nom || 'Garage'}</span>
                          </div>
                        ))}
                        {vehicule.historique_garages.length > 2 && (
                          <p className="text-xs text-gray-500">+{vehicule.historique_garages.length - 2} autre(s)</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(vehicule)}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition"
                    >
                      <Edit2 size={16} />
                      Modifier
                    </button>
                    <button
                      onClick={() => {
                        setSelectedVehicule(vehicule);
                        setShowDeleteConfirm(true);
                      }}
                      className="flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Formulaire */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedVehicule ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pays d'immatriculation <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.paysImmatriculation}
                    onChange={(e) => {
                      setFormData({ 
                        ...formData, 
                        paysImmatriculation: e.target.value,
                        immatriculation: ''
                      });
                      setError('');
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="tunisie">🇹🇳 Tunisie</option>
                    <option value="autre">🌍 Autre pays</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marque <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.marque}
                    onChange={(e) => setFormData({ ...formData, marque: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Peugeot"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modèle <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.modele}
                    onChange={(e) => setFormData({ ...formData, modele: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: 208"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Immatriculation <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!selectedVehicule}
                    value={formData.immatriculation}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setFormData({ ...formData, immatriculation: newValue });
                      
                      if (newValue.length >= 3) {
                        const validation = validateImmatriculation(
                          newValue, 
                          formData.paysImmatriculation
                        );
                        if (!validation.valid) {
                          setError(validation.message);
                        } else {
                          setError('');
                        }
                      }
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder={IMMATRICULATION_RULES[formData.paysImmatriculation]?.exemple}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {IMMATRICULATION_RULES[formData.paysImmatriculation]?.description}
                  </p>
                  {selectedVehicule && (
                    <p className="text-xs text-orange-600 mt-1">⚠️ L'immatriculation ne peut pas être modifiée</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Année</label>
                  <input
                    type="number"
                    min="1900"
                    max="2025"
                    value={formData.annee}
                    onChange={(e) => setFormData({ ...formData, annee: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: 2020"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
                  <input
                    type="text"
                    value={formData.couleur}
                    onChange={(e) => setFormData({ ...formData, couleur: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Bleu"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type de carburant</label>
                  <select
                    value={formData.typeCarburant}
                    onChange={(e) => setFormData({ ...formData, typeCarburant: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="essence">Essence</option>
                    <option value="diesel">Diesel</option>
                    <option value="hybride">Hybride</option>
                    <option value="electrique">Électrique</option>
                    <option value="gpl">GPL</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kilométrage</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.kilometrage}
                    onChange={(e) => setFormData({ ...formData, kilometrage: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: 45000"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loading}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                >
                  {loading ? 'Enregistrement...' : selectedVehicule ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmation Suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirmer la suppression</h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer le véhicule <strong>{selectedVehicule?.marque} {selectedVehicule?.modele}</strong> ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedVehicule(null);
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400"
              >
                {loading ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientVehicules;