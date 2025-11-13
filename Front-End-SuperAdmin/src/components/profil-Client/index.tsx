"use client"
import { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, CheckCircle, XCircle, Edit2, Save, X, Award, Clock, MapPin, Shield } from 'lucide-react';
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

  const API_BASE_URL = 'http://localhost:5000/api';
  
  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

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
    } finally {
      setLoading(false);
    }
  };

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
    } finally {
      setUpdateLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const cancelEdit = () => {
    setFormData({
      username: profile?.username || '',
      phone: profile?.phone || ''
    });
    setIsEditing(false);
    setError(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <User className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Messages de notification */}
        {successMessage && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 px-6 py-4 rounded-xl shadow-sm animate-fade-in">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <p className="text-green-800 font-medium">{successMessage}</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 px-6 py-4 rounded-xl shadow-sm">
            <div className="flex items-center space-x-3">
              <XCircle className="w-6 h-6 text-red-600" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Carte principale avec bannière */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Bannière avec motif */}
          <div className="relative h-40 bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-full h-full" style={{
                backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)',
                backgroundSize: '50px 50px'
              }}></div>
            </div>
            
            {/* Bouton de modification */}
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="absolute top-6 right-6 bg-white/20 backdrop-blur-sm text-white px-5 py-2.5 rounded-xl font-medium hover:bg-white/30 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <Edit2 className="w-4 h-4" />
                <span>Modifier le profil</span>
              </button>
            )}
          </div>

          {/* Avatar et informations principales */}
          <div className="relative px-8 pb-8">
            <div className="flex flex-col md:flex-row md:items-end md:space-x-6 -mt-16">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-2xl flex items-center justify-center text-white text-4xl font-bold ring-8 ring-white">
                  {getInitials(profile?.username)}
                </div>
                {profile?.isVerified && (
                  <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2 shadow-lg ring-4 ring-white">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>

              {/* Informations utilisateur */}
              <div className="flex-1 mt-6 md:mt-0 md:mb-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {profile?.username || 'Utilisateur'}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium ${
                    profile?.isVerified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {profile?.isVerified ? (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Compte vérifié
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 mr-2" />
                        En attente de vérification
                      </>
                    )}
                  </span>
                  <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                    <Award className="w-4 h-4 mr-2" />
                    Client
                  </span>
                </div>
                <p className="text-gray-600 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Membre depuis {formatDate(profile?.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Contenu du profil */}
          <div className="px-8 pb-8">
            {!isEditing ? (
              // Mode affichage
              <div className="space-y-8">
                {/* Statistiques rapides */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                    <div className="flex items-center justify-between mb-3">
                      <Mail className="w-8 h-8 text-blue-600" />
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">📧</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <p className="text-lg font-semibold text-gray-900 break-all">{profile?.email}</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                    <div className="flex items-center justify-between mb-3">
                      <Phone className="w-8 h-8 text-green-600" />
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">📱</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Téléphone</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {profile?.phone || 'Non renseigné'}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                    <div className="flex items-center justify-between mb-3">
                      <Calendar className="w-8 h-8 text-purple-600" />
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">📅</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Dernière mise à jour</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(profile?.updatedAt)}
                    </p>
                  </div>
                </div>

                {/* Section informations détaillées */}
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-8 border border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <User className="w-6 h-6 mr-3 text-indigo-600" />
                    Informations détaillées
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start space-x-4 p-4 bg-white rounded-xl shadow-sm">
                      <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500 mb-1">Nom d'utilisateur</p>
                        <p className="text-base font-semibold text-gray-900">{profile?.username}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4 p-4 bg-white rounded-xl shadow-sm">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Mail className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500 mb-1">Adresse email</p>
                        <p className="text-base font-semibold text-gray-900 truncate">{profile?.email}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4 p-4 bg-white rounded-xl shadow-sm">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Phone className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500 mb-1">Numéro de téléphone</p>
                        <p className="text-base font-semibold text-gray-900">
                          {profile?.phone || 'Non renseigné'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4 p-4 bg-white rounded-xl shadow-sm">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500 mb-1">Date d'inscription</p>
                        <p className="text-base font-semibold text-gray-900">{formatDate(profile?.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Mode édition
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-8 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Edit2 className="w-6 h-6 mr-3 text-indigo-600" />
                  Modifier vos informations
                </h2>
                
                <form onSubmit={updateProfile} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Nom d'utilisateur
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                        placeholder="Entrez votre nom d'utilisateur"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Numéro de téléphone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                        placeholder="+216 XX XXX XXX"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={updateLoading}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-3.5 rounded-xl font-semibold hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                    >
                      {updateLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                          <span>Enregistrement...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          <span>Enregistrer les modifications</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={updateLoading}
                      className="flex-1 bg-white border-2 border-gray-300 text-gray-700 px-6 py-3.5 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <X className="w-5 h-5" />
                      <span>Annuler</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}