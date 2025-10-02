"use client"
import { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, CheckCircle, XCircle, Edit2, Save, X } from 'lucide-react';
import axios from 'axios';

export default function ClientProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    phone: ''
  });

  // Configuration de l'API
  const API_BASE_URL = 'http://localhost:5000/api';
  
  // Fonction pour obtenir le token
    const getAuthToken = () => {
      return localStorage.getItem('token') || sessionStorage.getItem('token');
    };


  // Récupérer le profil
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_BASE_URL}/client/profile`, {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      
      setProfile(response.data);
      setFormData({
        username: response.data.username || '',
        phone: response.data.phone || ''
      });
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('authToken');
        setError('Session expirée. Veuillez vous reconnecter.');
      } else {
        const errorMessage = err.response?.data?.message || err.message || 'Erreur lors de la récupération du profil';
        setError(errorMessage);
      }
      console.error('Erreur lors de la récupération du profil:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour le profil
  const updateProfile = async (e) => {
    e.preventDefault();
    
    try {
      setUpdateLoading(true);
      setError(null);
      setSuccessMessage('');
      
      const response = await axios.put(
        `${API_BASE_URL}/client/update-profile`,
        formData,
        {
          headers: { Authorization: `Bearer ${getAuthToken()}` }
        }
      );
      
      setProfile(response.data);
      setIsEditing(false);
      setSuccessMessage('✅ Profil mis à jour avec succès!');
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('authToken');
        setError('Session expirée. Veuillez vous reconnecter.');
      } else {
        const errorMessage = err.response?.data?.message || err.message || 'Erreur lors de la mise à jour';
        setError(errorMessage);
      }
      console.error('Erreur lors de la mise à jour:', err);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Charger le profil au montage du composant
  useEffect(() => {
    fetchProfile();
  }, []);

  // Gérer les changements dans le formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Annuler l'édition
  const cancelEdit = () => {
    setFormData({
      username: profile?.username || '',
      phone: profile?.phone || ''
    });
    setIsEditing(false);
    setError(null);
  };

  // Format de date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}
        
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            ❌ {error}
          </div>
        )}

        {/* Carte de profil */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* En-tête */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-500 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white rounded-full p-3">
                  <User className="w-12 h-12 text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {profile?.username || 'Profil Client'}
                  </h1>
                  <div className="flex items-center space-x-2 mt-1">
                    {profile?.isVerified ? (
                      <CheckCircle className="w-4 h-4 text-green-300" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-300" />
                    )}
                    <span className="text-sm text-white">
                      {profile?.isVerified ? 'Compte vérifié' : 'Compte non vérifié'}
                    </span>
                  </div>
                </div>
              </div>
              
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-indigo-50 transition-colors flex items-center space-x-2"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Modifier</span>
                </button>
              )}
            </div>
          </div>

          {/* Contenu */}
          <div className="px-8 py-6">
            {!isEditing ? (
              // Mode affichage
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-gray-900 font-medium">{profile?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Téléphone</p>
                      <p className="text-gray-900 font-medium">
                        {profile?.phone || 'Non renseigné'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Membre depuis</p>
                      <p className="text-gray-900 font-medium">
                        {formatDate(profile?.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Dernière mise à jour</p>
                      <p className="text-gray-900 font-medium">
                        {formatDate(profile?.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Mode édition
              <form onSubmit={updateProfile} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom d'utilisateur
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Entrez votre nom d'utilisateur"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Entrez votre numéro de téléphone"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={updateLoading}
                    className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {updateLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Enregistrement...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        <span>Enregistrer</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={updateLoading}
                    className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <X className="w-5 h-5" />
                    <span>Annuler</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}