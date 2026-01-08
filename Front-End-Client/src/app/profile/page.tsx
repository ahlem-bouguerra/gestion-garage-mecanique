"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const ProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'edit', 'password', 'security'

  // États pour le formulaire d'édition
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: ''
  });

  // États pour le changement de mot de passe
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get('http://localhost:5000/api/client/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setProfile(response.data.data);
      setFormData({
        username: response.data.data.username,
        email: response.data.data.email,
        phone: response.data.data.phone || ''
      });
    } catch (error) {
      console.error('Erreur chargement profil:', error);
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    try {
      setUpdating(true);
      const token = localStorage.getItem('token');

      const response = await axios.put(
        'http://localhost:5000/api/client/update-profile',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProfile(response.data.data);
      toast.success('Profil mis à jour avec succès !');
      setActiveTab('overview');
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      setUpdating(true);
      const token = localStorage.getItem('token');

      await axios.put(
        'http://localhost:5000/api/profile/password/client',
        passwordData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Mot de passe changé avec succès !');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setActiveTab('overview');
    } catch (error) {
      console.error('Erreur changement mot de passe:', error);
      toast.error(error.response?.data?.message || 'Erreur lors du changement');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* En-tête du profil */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
          <div className="px-8 pb-8">
            <div className="flex flex-col md:flex-row items-center md:items-end -mt-16 md:-mt-12">
              <div className="relative">
                <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center text-blue-600 text-5xl font-bold border-4 border-white shadow-xl">
                  {profile?.username?.charAt(0).toUpperCase()}
                </div>
                <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-white ${profile?.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              </div>
              
              <div className="mt-4 md:mt-0 md:ml-6 text-center md:text-left flex-1">
                <h1 className="text-3xl font-bold text-gray-900">{profile?.username}</h1>
                <p className="text-gray-600 flex items-center justify-center md:justify-start mt-1">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                  </svg>
                  {profile?.email}
                </p>
                {profile?.phone && (
                  <p className="text-gray-600 flex items-center justify-center md:justify-start mt-1">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                    </svg>
                    {profile?.phone}
                  </p>
                )}
              </div>

              <div className="flex gap-3 mt-4 md:mt-0">
                <button
                  onClick={() => setActiveTab('edit')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
                >
                  ✏️ Modifier
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation par onglets */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-1 px-6" aria-label="Tabs">
              {[
                { id: 'overview', label: '📊 Vue d\'ensemble', icon: '📊' },
                { id: 'edit', label: '✏️ Édition', icon: '✏️' },
                { id: 'password', label: '🔐 Sécurité', icon: '🔐' },
                { id: 'activity', label: '📅 Activité', icon: '📅' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 font-medium text-sm transition-all ${
                    activeTab === tab.id
                      ? 'border-b-3 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-8">
            
            {/* ONGLET VUE D'ENSEMBLE */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                
                {/* Informations principales */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="bg-blue-600 text-white rounded-lg p-2 mr-3">👤</span>
                    Informations du compte
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoCard label="Nom d'utilisateur" value={profile?.username} icon="👤" />
                    <InfoCard label="Email" value={profile?.email} icon="📧" />
                    <InfoCard label="Téléphone" value={profile?.phone || 'Non renseigné'} icon="📱" />
                    <InfoCard 
                      label="Statut du compte" 
                      value={
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          profile?.isVerified 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {profile?.isVerified ? '✅ Vérifié' : '❌ Non vérifié'}
                        </span>
                      } 
                      icon="🔄" 
                    />
                  </div>
                </div>

                {/* Statuts de vérification */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="bg-green-600 text-white rounded-lg p-2 mr-3">✓</span>
                    Vérifications
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatusCard 
                      label="Email vérifié" 
                      status={profile?.isVerified} 
                      icon="📧"
                    />
                    <StatusCard 
                      label="Compte actif" 
                      status={profile?.isActive} 
                      icon="🔓"
                    />
                    <StatusCard 
                      label="Mot de passe défini" 
                      status={!profile?.password} 
                      icon="🔐"
                    />
                  </div>
                </div>

                {/* Informations du garage */}
                {profile?.garage && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <span className="bg-purple-600 text-white rounded-lg p-2 mr-3">🏢</span>
                      Garage associé
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InfoCard label="Nom du garage" value={profile.garage.nom} icon="🏪" />
                      <InfoCard label="Matricule fiscal" value={profile.garage.matriculeFiscal} icon="📄" />
                      <InfoCard label="Gouvernorat" value={profile.garage.governorateName} icon="📍" />
                      <InfoCard label="Ville" value={profile.garage.cityName} icon="🏙️" />
                      <InfoCard label="description" value={profile.garage.description || 'Non renseignée'} icon="🗺️" />
                      <InfoCard label="Téléphone garage" value={profile.garage.telephoneProfessionnel || 'Non renseigné'} icon="☎️" />
                      <InfoCard label="Email garage" value={profile.garage.emailProfessionnel || 'Non renseigné'} icon="📬" />
                      <InfoCard 
                        label="Statut garage" 
                        value={
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            profile.garage.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {profile.garage.isActive ? '✅ Actif' : '❌ Inactif'}
                          </span>
                        } 
                        icon="🔄" 
                      />
                    </div>
                  </div>
                )}

                {/* Créé par */}
                {profile?.createdBy && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <span className="bg-amber-600 text-white rounded-lg p-2 mr-3">👥</span>
                      Créé par
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InfoCard label="Nom" value={profile.createdBy.username} icon="👤" />
                      <InfoCard label="Email" value={profile.createdBy.email} icon="📧" />
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* ONGLET ÉDITION */}
            {activeTab === 'edit' && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-xl border border-gray-200 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Modifier les informations</h2>
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      />
                      <p className="text-xs text-amber-600 mt-2">⚠️ Changer l'email nécessitera une nouvelle vérification</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="+216 XX XXX XXX"
                      />
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        type="submit"
                        disabled={updating}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-all shadow-lg hover:shadow-xl"
                      >
                        {updating ? '⏳ Mise à jour...' : '💾 Enregistrer les modifications'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('overview')}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ONGLET MOT DE PASSE */}
            {activeTab === 'password' && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-xl border border-gray-200 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Changer le mot de passe</h2>
                  <p className="text-gray-600 mb-6">Assurez-vous d'utiliser un mot de passe fort et unique</p>
                  
                  <form onSubmit={handleChangePassword} className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Mot de passe actuel *
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>

                    <div className="h-px bg-gray-200 my-6"></div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nouveau mot de passe *
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                        minLength={6}
                      />
                      <p className="text-xs text-gray-500 mt-2">Minimum 6 caractères</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Confirmer le nouveau mot de passe *
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                        minLength={6}
                      />
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        type="submit"
                        disabled={updating}
                        className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 transition-all shadow-lg hover:shadow-xl"
                      >
                        {updating ? '⏳ Changement...' : '🔐 Changer le mot de passe'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('overview')}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ONGLET ACTIVITÉ */}
            {activeTab === 'activity' && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Historique du compte</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xl mr-4">
                        📅
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Compte créé</p>
                        <p className="text-sm text-gray-600">{formatDate(profile?.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xl mr-4">
                        🔄
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Dernière modification</p>
                        <p className="text-sm text-gray-600">{formatDate(profile?.updatedAt)}</p>
                      </div>
                    </div>

                    {profile?.resetPasswordExpires && (
                      <div className="flex items-center p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-xl mr-4">
                          🔑
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Token de réinitialisation</p>
                          <p className="text-sm text-gray-600">Expire le: {formatDate(profile?.resetPasswordExpires)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

// Composants auxiliaires
const InfoCard = ({ label, value, icon }) => (
  <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
    <p className="text-sm font-medium text-gray-500 mb-1">{icon} {label}</p>
    <p className="text-lg font-semibold text-gray-900">{value}</p>
  </div>
);

const StatusCard = ({ label, status, icon }) => (
  <div className={`rounded-lg p-4 border-2 ${
    status 
      ? 'bg-green-50 border-green-200' 
      : 'bg-gray-50 border-gray-200'
  }`}>
    <div className="flex items-center justify-between">
      <span className="text-2xl">{icon}</span>
      {status ? (
        <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
        </svg>
      ) : (
        <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
        </svg>
      )}
    </div>
    <p className="text-sm font-medium text-gray-700 mt-2">{label}</p>
  </div>
);

export default ProfilePage;