"use client"
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import GarageReservationManagement from '../gestion-reservations-garage'
import { Button } from '../ui-elements/button';
import GarageRatingsDisplay from '../GarageRatingsDisplay';


export default function GarageDashboard() {
  const [reservations, setReservations] = useState([]);
  const [todayReservations, setTodayReservations] = useState([]);
  const [upcomingReservations, setUpcomingReservations] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [showChatModal, setShowChatModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [garageId, setGarageId] = useState(null);
      const getAuthToken = () => {
      return localStorage.getItem('token') || sessionStorage.getItem('token');
    };

    useEffect(() => {
  const header = document.querySelector('header');
  if (!header) return;

  if (showChatModal) {
    header.classList.add("hidden");
  } else {
    header.classList.remove("hidden");
  }
}, [showChatModal]);


useEffect(() => {
  const token = getAuthToken();
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setGarageId(payload.id || payload._id || payload.garageId);
    } catch (err) {
      console.error("Erreur décodage token:", err);
    }
  }
}, []);


  // Fonction pour filtrer les réservations
  const filterReservations = (allReservations) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    // Réservations d'aujourd'hui (acceptées)
    const todayRes = allReservations.filter(res => {
      const resDate = res.creneauDemande.date.split('T')[0];
      return res.status === 'accepte' && resDate === todayStr;
    });
    
    // Réservations à venir (7 prochains jours, acceptées)
    const upcomingRes = allReservations.filter(res => {
      const resDate = new Date(res.creneauDemande.date);
      return res.status === 'accepte' && 
             resDate > today && 
             resDate <= nextWeek;
    });
    
    // Demandes en attente
    const pending = allReservations.filter(res => res.status === 'en_attente').length;
    
    setTodayReservations(todayRes);
    setUpcomingReservations(upcomingRes);
    setPendingCount(pending);
  };

  // Fonction pour filtrer les dates non passées
const isDatePassed = (dateString) => {
  const reservationDate = new Date(dateString);
  reservationDate.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Retourne true si la date est passée (avant aujourd'hui)
  return reservationDate < today;
};

useEffect(() => {
  const fetchReservations = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:5000/api/reservations",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const filteredReservations = res.data.filter(reservation =>
        !isDatePassed(reservation.creneauDemande.date)
      );

      setReservations(filteredReservations);
      filterReservations(filteredReservations);
      setLoading(false);

    } catch (err) {
      console.error("❌ Erreur fetch reservations:", err);
      setLoading(false);
    }
  };

  fetchReservations();
  const interval = setInterval(fetchReservations, 5 * 60 * 1000);
  return () => clearInterval(interval);
}, []);




  const getStatusColor = (status) => {
    switch (status) {
      case 'en_attente': return 'bg-amber-100 border-amber-200 text-amber-800';
      case 'accepte': return 'bg-emerald-100 border-emerald-200 text-emerald-800';
      case 'refuse': return 'bg-rose-100 border-rose-200 text-rose-800';
      case 'contre_propose': return 'bg-blue-100 border-blue-200 text-blue-800';
      case 'annule': return 'bg-slate-100 border-slate-200 text-slate-600';
      default: return 'bg-gray-100 border-gray-200 text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'en_attente': return '⏳';
      case 'accepte': return '✅';
      case 'refuse': return '❌';
      case 'contre_propose': return '🔄';
      case 'annule': return '🚫';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}

      {/* Bouton flottant en bas à droite */}
      <button 
        onClick={() => setShowChatModal(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-xl bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
      >
        {/* Icône */}
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        
        {/* Texte explicite */}
        <span className="font-medium text-sm">
          {pendingCount > 0 ? `${pendingCount} Demande${pendingCount > 1 ? 's' : ''}` : 'Demandes'}
        </span>
        
        {/* Badge de notification */}
        {pendingCount > 0 && (
          <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
            !
          </span>
        )}
      </button>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 sm:p-5 lg:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Aujourd'hui</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{todayReservations.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 sm:p-5 lg:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">À venir (7j)</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{upcomingReservations.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 sm:p-5 lg:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-500 rounded-full flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">En attente</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{pendingCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 sm:p-5 lg:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-500 rounded-full flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total actif</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{reservations.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal en colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Réservations d'aujourd'hui */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Rendez-vous d'aujourd'hui</h2>
                <div className="flex items-center text-green-600">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">{todayReservations.length} RDV</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 sm:p-6">
              {todayReservations.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {todayReservations
                    .sort((a, b) => a.creneauDemande.heureDebut.localeCompare(b.creneauDemande.heureDebut))
                    .map((reservation, index) => (
                    <div key={reservation._id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                          {reservation.clientName.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                            {reservation.clientName}
                          </h3>
                          <span className="text-base sm:text-lg font-bold text-green-700">
                            {reservation.creneauDemande.heureDebut}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">
                          Service: {reservation.serviceId?.name}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">
                          Tel: {reservation.clientPhone}
                        </p>
                      </div>
                      
                      <div className="flex-shrink-0">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun rendez-vous aujourd'hui</h3>
                  <p className="text-gray-500">Profitez de cette journée plus calme !</p>
                </div>
              )}
            </div>
          </div>

          {/* Réservations à venir */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Prochains rendez-vous</h2>
                <div className="flex items-center text-blue-600">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium">7 prochains jours</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 max-h-96 overflow-y-auto">
              {upcomingReservations.length > 0 ? (
                <div className="space-y-3">
                  {upcomingReservations
                    .sort((a, b) => new Date(a.creneauDemande.date) - new Date(b.creneauDemande.date))
                    .map((reservation) => (
                    <div key={reservation._id} className="flex items-center justify-between p-3 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {reservation.clientName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{reservation.clientName}</h4>
                          <p className="text-sm text-gray-600">{reservation.serviceId?.name}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {new Date(reservation.creneauDemande.date).toLocaleDateString('fr-FR', { 
                            weekday: 'short',
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                        <div className="text-sm text-blue-600 font-medium">
                          {reservation.creneauDemande.heureDebut}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun rendez-vous programmé</h3>
                  <p className="text-gray-500">Les prochaines réservations apparaîtront ici</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action rapide - Demandes en attente */}
        {pendingCount > 0 && (
          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-amber-900">
                    {pendingCount} demande{pendingCount > 1 ? 's' : ''} en attente de réponse
                  </h3>
                  <p className="text-amber-700">Des clients attendent votre réponse pour leurs demandes de réservation</p>
                </div>
              </div>
              <button 
                onClick={() => setShowChatModal(true)}
                  className="relative flex items-center gap-3 px-6 py-4 rounded-xl bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Répondre aux demandes
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
{showChatModal && (
  <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="w-[95vw] max-w-[1900px] h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden relative">
      {/* Bouton de fermeture */}
      <button
        onClick={() => setShowChatModal(false)}
        className="absolute top-4 right-4 z-[10000] w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
      >
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <GarageReservationManagement onClose={() => setShowChatModal(false)} />
    </div>
  </div>
)}
{garageId && <GarageRatingsDisplay garageId={garageId} />}
    </div>
  );
}