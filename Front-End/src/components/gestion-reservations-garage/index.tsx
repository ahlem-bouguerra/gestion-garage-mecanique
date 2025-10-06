"use client"
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function GarageReservationManagement() {
  const [reservations, setReservations] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [responseData, setResponseData] = useState({
    action: '',
    newDate: '',
    newHeureDebut: '',
    message: ''
  });

  const playNotificationSound = () => {
  const audio = new Audio('/sounds/mixkit-correct-answer-tone-2870.wav');
  audio.play().catch(e => console.log('Erreur audio:', e));
  };

  const isDatePassed = (dateString) => {
  const reservationDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset l'heure pour comparer seulement les dates
  return reservationDate < today;
};

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/reservations");
        
        // Filtrer les réservations avec dates non passées
        const filteredReservations = res.data.filter(reservation => 
          !isDatePassed(reservation.creneauDemande.date)
        );
        
        setReservations(filteredReservations);
      } catch (err) {
        console.error("Erreur fetch reservations:", err);
      }
    };
    fetchReservations();
  }, []);

  useEffect(() => {
  const header = document.querySelector('header');
  if (header) {
    header.style.display = 'none';
  }

  // Cleanup
  return () => {
    if (header) {
      header.style.display = '';
    }
  };
}, []);

  const handleReservationClick = (reservation) => {
    setSelectedReservation(reservation);
    
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
      return;
    }

    if (responseData.action === 'contre_proposer') {
      if (!responseData.newDate || !responseData.newHeureDebut) {
        return;
      }
    }

    try {
      const response = await axios.put(
        `http://localhost:5000/api/update/reservations/${selectedReservation._id}`,
        {
          action: responseData.action,
          newDate: responseData.newDate || undefined,
          newHeureDebut: responseData.newHeureDebut || undefined,
          message: responseData.message || undefined
        }
      );
      playNotificationSound();
      const res = await axios.get("http://localhost:5000/api/reservations");
      const filteredReservations = res.data.filter(reservation => 
        !isDatePassed(reservation.creneauDemande.date)
      );
      setReservations(filteredReservations);
      setSelectedReservation(null);
      setResponseData({
        action: '',
        newDate: '',
        newHeureDebut: '',
        message: ''
      });
      
    } catch (err) {
      console.error("Erreur update:", err);
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

  const timeOptions = generateTimeOptions();
  const canGarageAct = (reservation) => reservation.status === 'en_attente';

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex">
      {/* Sidebar - Liste des conversations */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <h1 className="text-lg font-bold">Messages Clients</h1>
          <p className="text-blue-100 text-sm">Gérez vos réservations</p>
        </div>

        {/* Liste des conversations */}
        <div className="flex-1 overflow-y-auto">
          {reservations.map(reservation => {
            const isActive = selectedReservation?._id === reservation._id;
            const hasUnread = canGarageAct(reservation);
            
            return (
              <div 
                key={reservation._id}
                onClick={() => handleReservationClick(reservation)}
                className={`p-4 border-b border-gray-50 cursor-pointer transition-all duration-200 hover:bg-slate-50 ${
                  isActive ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {reservation.clientName.charAt(0).toUpperCase()}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {reservation.clientName}
                      </h3>
                      {hasUnread && (
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse flex-shrink-0"></div>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 truncate mb-2">
                      Service : {reservation.serviceId.name}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(reservation.status)}`}>
                        {getStatusIcon(reservation.status)} {reservation.status.replace('_', ' ')}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(reservation.creneauDemande.date).toLocaleDateString('fr-FR', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Zone de conversation */}
      <div className="flex-1 flex flex-col">
        {selectedReservation ? (
          <>
            {/* Header de conversation */}
            <div className="p-4 bg-white border-b border-gray-200 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                {selectedReservation.clientName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-gray-900">{selectedReservation.clientName}</h2>
                <p className="text-sm text-gray-500">Numéro de téléphone du client :{selectedReservation.clientPhone}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedReservation.status)}`}>
                {getStatusIcon(selectedReservation.status)} {selectedReservation.status.replace('_', ' ')}
              </div>
            </div>

            {/* Zone de messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Message initial du client */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {selectedReservation.clientName.charAt(0).toUpperCase()}
                </div>
                <div className="bg-white rounded-2xl rounded-tl-md p-4 shadow-sm border max-w-md">
                  <div className="text-sm font-medium text-gray-900 mb-2">Demande de réservation</div>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="font-medium text-blue-900">Service: {selectedReservation.serviceId?.name}</div>
                      <div className="text-blue-700">📅 {new Date(selectedReservation.creneauDemande.date).toLocaleDateString('fr-FR')} à {selectedReservation.creneauDemande.heureDebut}</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="font-medium text-blue-900">Véhicule:</div>
                      <div className="text-blue-700">{selectedReservation.vehiculeId?.marque} - {selectedReservation.vehiculeId?.modele}- {selectedReservation.vehiculeId?.immatriculation}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="font-medium text-gray-700 mb-1">Description:</div>
                      <div className="text-gray-600">{selectedReservation.descriptionDepannage}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    {new Date(selectedReservation.createdAt).toLocaleString('fr-FR')}
                  </div>
                </div>
              </div>

              {/* Messages du garage */}
              {selectedReservation.messageGarage && (
                <div className="flex gap-3 justify-end">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl rounded-tr-md p-4 shadow-sm max-w-md">
                    <div className="text-sm">{selectedReservation.messageGarage}</div>
                    {selectedReservation.creneauPropose && (
                      <div className="bg-white/20 rounded-lg p-2 mt-2">
                        <div className="text-sm font-medium">Nouveau créneau proposé:</div>
                        <div className="text-sm">📅 {new Date(selectedReservation.creneauPropose.date).toLocaleDateString('fr-FR')} à {selectedReservation.creneauPropose.heureDebut}</div>
                      </div>
                    )}
                    <div className="text-xs text-blue-200 mt-2">
                      {new Date(selectedReservation.updatedAt).toLocaleString('fr-FR')}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    G
                  </div>
                </div>
              )}

              {/* Messages du client */}
              {selectedReservation.messageClient && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {selectedReservation.clientName.charAt(0).toUpperCase()}
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-md p-4 shadow-sm border max-w-md">
                    <div className="text-sm text-gray-700">{selectedReservation.messageClient}</div>
                    <div className="text-xs text-gray-400 mt-2">
                      {new Date(selectedReservation.updatedAt).toLocaleString('fr-FR')}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Zone de réponse */}
            {canGarageAct(selectedReservation) && (
              <div className="p-4 bg-white border-t border-gray-200">
                <div className="space-y-4">
                  {/* Actions rapides */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setResponseData({...responseData, action: 'accepter'})}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        responseData.action === 'accepter' 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      }`}
                    >
                      ✅ Accepter
                    </button>
                    <button
                      onClick={() => setResponseData({...responseData, action: 'contre_proposer'})}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        responseData.action === 'contre_proposer' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      🔄 Contre-proposer
                    </button>
                    <button
                      onClick={() => setResponseData({...responseData, action: 'refuser'})}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        responseData.action === 'refuser' 
                          ? 'bg-rose-500 text-white' 
                          : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                      }`}
                    >
                      ❌ Refuser
                    </button>
                  </div>

                  {/* Options de contre-proposition */}
                  {responseData.action === 'contre_proposer' && (
                    <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                      <div className="text-sm font-medium text-blue-900">Proposer un nouveau créneau:</div>
                      <div className="flex gap-3">
                        <input
                          type="date"
                          value={responseData.newDate}
                          onChange={(e) => setResponseData({...responseData, newDate: e.target.value})}
                          min={new Date().toISOString().split('T')[0]}
                          className="flex-1 px-3 py-2 border border-blue-200 rounded-lg text-sm"
                        />
                        <select
                          value={responseData.newHeureDebut}
                          onChange={(e) => setResponseData({...responseData, newHeureDebut: e.target.value})}
                          className="flex-1 px-3 py-2 border border-blue-200 rounded-lg text-sm"
                        >
                          {timeOptions.map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Zone de texte */}
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={responseData.message}
                      onChange={(e) => setResponseData({...responseData, message: e.target.value})}
                      placeholder="Tapez votre message..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:border-blue-500 focus:outline-none"
                      onKeyPress={(e) => e.key === 'Enter' && handleResponse()}
                    />
                    <button
                      onClick={handleResponse}
                      disabled={!responseData.action}
                      className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-indigo-700 transition-all"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Sélectionnez une conversation</h3>
              <p className="text-gray-500">Choisissez un client pour commencer à discuter</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}