"use client"
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function ClientReservationManagement({ onClose }) {
  const [reservations, setReservations] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [responseData, setResponseData] = useState({
    action: '',
    newDate: '',
    newHeureDebut: '',
    message: ''
  });
  const router = useRouter();
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const playNotificationSound = () => {
    const audio = new Audio('/sounds/mixkit-correct-answer-tone-2870.wav');
    audio.play().catch(e => console.log('Erreur audio:', e));
  };


useEffect(() => {
  const header = document.querySelector('header');
  if (header) {
    header.style.display = 'none';
  }
  return () => {
    if (header) {
      header.style.display = '';
    }
  };
}, []);


  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const isDatePassed = (dateString) => {
    const reservationDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return reservationDate < today;
  };
  const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

  /*useEffect(() => {
    const header = document.querySelector('header');
    if (header) {
      header.style.display = 'none';
    }
    return () => {
      if (header) {
        header.style.display = '';
      }
    };
  }, []);*/

  useEffect(() => {
    scrollToBottom();
  }, [selectedReservation]);

useEffect(() => {
  const fetchReservations = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/client-reservations/", {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      const filteredReservations = res.data.reservations.filter(reservation => 
        !isDatePassed(reservation.creneauDemande.date)
      );
      
      // Détecter nouveaux messages
      const hasNew = filteredReservations.some(r => r.status === 'contre_propose');
      setHasNewMessages(hasNew);
      
      setReservations(filteredReservations);
    } catch (err) {
      console.error("Erreur fetch reservations:", err);
      setError("Erreur lors du chargement des réservations");
    }
  };
  fetchReservations();
  
  // Vérifier toutes les 15 secondes
  const interval = setInterval(fetchReservations, 15000);
  return () => clearInterval(interval);
}, []);

  const handleReservationClick = (reservation) => {
    setSelectedReservation(reservation);
    setError(''); // Clear any previous errors
    
    const formatDate = (dateInput) => {
      if (!dateInput) return '';
      const date = new Date(dateInput);
      return date.toISOString().split('T')[0];
    };
    
    setResponseData({
      action: '',
      newDate: formatDate(reservation.creneauDemande.date),
      newHeureDebut: reservation.creneauDemande.heureDebut,
      message: ''
    });
  };

  const handleResponse = async () => {
    if (!responseData.action || !selectedReservation) {
      setError("Veuillez sélectionner une action");
      return;
    }

    // Validation pour les contre-propositions
    if (responseData.action === 'client_contre_proposer') {
      if (!responseData.newDate || !responseData.newHeureDebut) {
        setError("Veuillez sélectionner une date et une heure pour la contre-proposition");
        return;
      }
    }

    setLoading(true);
    setError('');

    console.log("=== ENVOI REQUÊTE CLIENT ===");
    console.log("Action:", responseData.action);
    console.log("Données:", responseData);

    try {
      const response = await axios.put(
        `http://localhost:5000/api/client-update/reservations/${selectedReservation._id}`,
        {
          action: responseData.action,
          newDate: responseData.newDate || undefined,
          newHeureDebut: responseData.newHeureDebut || undefined,
          message: responseData.message || undefined
        }, {
      headers: { Authorization: `Bearer ${getAuthToken()}` }
    }
      );
      
      console.log("Réponse serveur:", response.data);
      playNotificationSound();
      
      // Recharger les réservations
      const res = await axios.get("http://localhost:5000/api/client-reservations/", {
      headers: { Authorization: `Bearer ${getAuthToken()}` }
    });
      const filteredReservations = res.data.reservations.filter(reservation => 
        !isDatePassed(reservation.creneauDemande.date)
      );

      setReservations(filteredReservations);
      
      // Mettre à jour la réservation sélectionnée avec les nouvelles données
      const updatedReservation = filteredReservations.find(r => r._id === selectedReservation._id);
      if (updatedReservation) {
        setSelectedReservation(updatedReservation);
      } else {
        setSelectedReservation(null);
      }
      
      setResponseData({
        action: '',
        newDate: '',
        newHeureDebut: '',
        message: ''
      });
      
    } catch (err) {
      console.error("Erreur complète:", err);
      console.error("Réponse serveur:", err.response?.data);
      
      const errorMessage = err.response?.data?.error || err.response?.data?.details || err.message || "Erreur inconnue";
      setError(`Erreur: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

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

  const generateTimeOptions = () => {
    const options = [];
    for (let i = 8; i <= 18; i++) {
      options.push(`${i.toString().padStart(2, '0')}:00`);
      if (i < 18) options.push(`${i.toString().padStart(2, '0')}:30`);
    }
    return options;
  };


  const handleClose = () => {
  const header = document.querySelector('header');
  if (header) {
    header.style.display = '';
  }
  
  if (onClose && typeof onClose === 'function') {
    onClose();
  } else {
    // Si pas de fonction onClose, rediriger vers la page de recherche
    router.push('/chercher-garage');
  }
};

  const timeOptions = generateTimeOptions();
  const canClientAct = (reservation) => reservation.status === 'contre_propose';

   return (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
    <div className="w-full h-full max-w-[95vw] max-h-[95vh] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl shadow-2xl flex overflow-hidden relative">
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-50 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
      >
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      {/* Notification d'erreur */}
      {error && (
        <div className="fixed top-4 right-4 bg-white border-l-4 border-red-500 rounded-lg shadow-xl px-6 py-4 z-50 animate-slide-in-right">
          
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-red-600 text-sm">!</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 text-sm mb-1">Erreur</h4>
              <p className="text-gray-600 text-sm">{error}</p>
            </div>
            <button 
              onClick={() => setError('')}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Sidebar - Liste des réservations */}
      <div className="w-96 bg-white shadow-xl flex flex-col">
        {/* Header du sidebar */}
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Mes Réservations</h1>
              <p className="text-indigo-100 text-sm">{reservations.length} demande(s) en cours</p>
            </div>
          </div>
          
          {/* Barre de recherche */}
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
            <svg className="w-5 h-5 text-indigo-200 absolute right-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Liste des réservations */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-3">
            {reservations.map(reservation => {
              const isActive = selectedReservation?._id === reservation._id;
              const hasAction = canClientAct(reservation);
              
              return (
                <div 
                  key={reservation._id}
                  onClick={() => handleReservationClick(reservation)}
                  className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                    isActive 
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 shadow-lg' 
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent hover:border-gray-200'
                  }`}
                >
                  {/* Badge notification */}
                  {hasAction && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    {/* Avatar du garage */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 transition-all duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg scale-110' 
                        : 'bg-gradient-to-br from-gray-400 to-gray-500'
                    }`}>
                      {reservation.garageId?.username.charAt(0) || 'G'}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Nom du garage */}
                      <h3 className={`font-bold text-base mb-1 truncate transition-colors ${
                        isActive ? 'text-indigo-900' : 'text-gray-900'
                      }`}>
                        {reservation.garageId?.username || 'Garage'}
                      </h3>
                      
                      {/* Service */}
                      <p className="text-sm text-gray-600 truncate mb-2 flex items-center gap-1">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {reservation.serviceId?.name || reservation.serviceName}
                      </p>
                      
                      {/* Date et statut */}
                      <div className="flex items-center justify-between gap-2">
                        <div className={`px-3 py-1 rounded-lg text-xs font-semibold border-2 flex items-center gap-1.5 ${getStatusColor(reservation.status)}`}>
                          <span>{getStatusIcon(reservation.status)}</span>
                          <span>{reservation.status.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(reservation.creneauDemande.date).toLocaleDateString('fr-FR', { 
                            day: 'numeric',
                            month: 'short'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Zone de conversation */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedReservation ? (
          <>
            {/* Header de la conversation */}
            <div className="p-6 bg-white border-b border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {selectedReservation.garageId?.username.charAt(0) || 'G'}
                  </div>
                  <div>
                    <h2 className="font-bold text-xl text-gray-900">{selectedReservation.garageId?.username || 'Garage'}</h2>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        </svg>
                        {selectedReservation.serviceId?.name}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {selectedReservation.garageId?.phone}
                      </p>
                    </div>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 flex items-center gap-2 ${getStatusColor(selectedReservation.status)}`}>
                  <span className="text-lg">{getStatusIcon(selectedReservation.status)}</span>
                  <span>{selectedReservation.status.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-gray-50 to-white">
              {/* Message initial du client */}
              <div className="flex gap-3 justify-end animate-slide-in-right">
                <div className="max-w-lg">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-3xl rounded-tr-md p-5 shadow-xl">
                    <div className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      Ma demande de réservation
                    </div>
                    <div className="space-y-3">
                      <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                        <div className="font-semibold mb-2">📋 {selectedReservation.serviceId?.name}</div>
                        <div className="flex items-center gap-2 text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(selectedReservation.creneauDemande.date).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="flex items-center gap-2 text-sm mt-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {selectedReservation.creneauDemande.heureDebut}
                        </div>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="font-medium text-blue-900">Véhicule:</div>
                        <div className="text-blue-700">{selectedReservation.vehiculeId?.marque} - {selectedReservation.vehiculeId?.modele}- {selectedReservation.vehiculeId?.immatriculation}</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                        <div className="font-semibold mb-2 text-sm">💬 Description:</div>
                        <div className="text-sm leading-relaxed">{selectedReservation.descriptionDepannage}</div>
                      </div>
                    </div>
                    <div className="text-xs text-indigo-200 mt-3 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      {new Date(selectedReservation.createdAt).toLocaleString('fr-FR')}
                    </div>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
                  {selectedReservation.clientName.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Message du garage */}
              {selectedReservation.messageGarage && (
                <div className="flex gap-3 animate-slide-in-left">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
                    G
                  </div>
                  <div className="max-w-lg">
                    <div className="bg-white rounded-3xl rounded-tl-md p-5 shadow-xl border-2 border-gray-100">
                      <div className="text-gray-800 leading-relaxed mb-3">{selectedReservation.messageGarage}</div>
                      {selectedReservation.creneauPropose && selectedReservation.creneauPropose.date && (
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 border-2 border-indigo-100">
                          <div className="text-sm font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                            Créneau proposé
                          </div>
                          <div className="flex items-center gap-2 text-indigo-700">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(selectedReservation.creneauPropose.date).toLocaleDateString('fr-FR')}
                          </div>
                          <div className="flex items-center gap-2 text-indigo-700 mt-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {selectedReservation.creneauPropose.heureDebut}
                          </div>
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        {new Date(selectedReservation.updatedAt).toLocaleString('fr-FR')}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Message de réponse du client */}
              {selectedReservation.messageClient && (
                <div className="flex gap-3 justify-end animate-slide-in-right">
                  <div className="max-w-lg">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-3xl rounded-tr-md p-5 shadow-xl">
                      <div className="leading-relaxed">{selectedReservation.messageClient}</div>
                      <div className="text-xs text-indigo-200 mt-3 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        {new Date(selectedReservation.updatedAt).toLocaleString('fr-FR')}
                      </div>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
                    {selectedReservation.clientName.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Zone de réponse */}
            {canClientAct(selectedReservation) && (
              <div className="p-6 bg-white border-t border-gray-200 shadow-2xl">
                <div className="space-y-4">
                  {/* Boutons d'action */}
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => setResponseData({...responseData, action: 'accepter_contre_proposition'})}
                      disabled={loading}
                      className={`group px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 disabled:opacity-50 flex items-center gap-2 shadow-lg ${
                        responseData.action === 'accepter_contre_proposition' 
                          ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white scale-105' 
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:scale-105'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Accepter la proposition
                    </button>
                    <button
                      onClick={() => setResponseData({...responseData, action: 'client_contre_proposer'})}
                      disabled={loading}
                      className={`group px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 disabled:opacity-50 flex items-center gap-2 shadow-lg ${
                        responseData.action === 'client_contre_proposer' 
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white scale-105' 
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100 hover:scale-105'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Contre-proposer
                    </button>
                    <button
                      onClick={() => setResponseData({...responseData, action: 'annuler'})}
                      disabled={loading}
                      className={`group px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 disabled:opacity-50 flex items-center gap-2 shadow-lg ${
                        responseData.action === 'annuler' 
                          ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white scale-105' 
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-100 hover:scale-105'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Annuler
                    </button>
                  </div>

                  {/* Formulaire de contre-proposition */}
                  {responseData.action === 'client_contre_proposer' && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border-2 border-blue-200 animate-slide-down">
                      <div className="flex items-center gap-2 text-blue-900 font-semibold mb-4">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Proposer un nouveau créneau
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-blue-900 mb-2">Date</label>
                          <input
                            type="date"
                            value={responseData.newDate}
                            onChange={(e) => setResponseData({...responseData, newDate: e.target.value})}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-900 mb-2">Heure</label>
                          <select
                            value={responseData.newHeureDebut}
                            onChange={(e) => setResponseData({...responseData, newHeureDebut: e.target.value})}
                            className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                            disabled={loading}
                          >
                            {timeOptions.map(time => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Zone de message */}
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={responseData.message}
                        onChange={(e) => setResponseData({...responseData, message: e.target.value})}
                        placeholder="Tapez votre message..."
                        className="w-full px-6 py-4 pr-12 border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && !loading && handleResponse()}
                        disabled={loading}
                      />
                      <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </div>
                    <button
                      onClick={handleResponse}
                      disabled={loading || !responseData.action || (responseData.action === 'client_contre_proposer' && (!responseData.newDate || !responseData.newHeureDebut))}
                      className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg hover:scale-105 disabled:hover:scale-100"
                    >
                      {loading ? (
                        <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Message de statut */}
            {!canClientAct(selectedReservation) && (
              <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
                <div className="text-center">
                  {selectedReservation.status === 'en_attente' && (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg mb-1">En attente de réponse</h4>
                        <p className="text-gray-600 text-sm">Le garage va bientôt traiter votre demande</p>
                      </div>
                    </div>
                  )}
                  {selectedReservation.status === 'accepte' && (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-emerald-900 text-lg mb-1">Rendez-vous confirmé !</h4>
                        <p className="text-emerald-700 text-sm">Votre réservation est validée par le garage</p>
                      </div>
                    </div>
                  )}
                  {selectedReservation.status === 'refuse' && (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gradient-to-r from-rose-400 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-rose-900 text-lg mb-1">Demande refusée</h4>
                        <p className="text-rose-700 text-sm">Le garage n'a pas pu accepter votre demande</p>
                      </div>
                    </div>
                  )}
                  {selectedReservation.status === 'annule' && (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg mb-1">Réservation annulée</h4>
                        <p className="text-gray-600 text-sm">Cette demande a été annulée</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
            <div className="text-center max-w-md px-6">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl animate-float">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Bienvenue !</h3>
              <p className="text-gray-600 text-lg mb-2">Sélectionnez une réservation</p>
              <p className="text-gray-500 text-sm">Choisissez une demande dans la liste pour voir les détails et gérer votre conversation avec le garage</p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.4s ease-out;
        }
        
        .animate-slide-in-left {
          animation: slide-in-left 0.4s ease-out;
        }
        
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
      </div>
    </div>
  );
}