"use client"
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';


export default function ClientReservationManagement() {
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
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });};

  const isDatePassed = (dateString) => {
  const reservationDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset l'heure pour comparer seulement les dates
  return reservationDate < today;
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

  useEffect(() => {
    scrollToBottom();
  }, [selectedReservation]);

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
      alert("Veuillez sélectionner une action");
      return;
    }

    // Validation pour les contre-propositions
    if (responseData.action === 'client_contre_proposer') {
      if (!responseData.newDate || !responseData.newHeureDebut) {
        alert("Veuillez sélectionner une date et une heure");
        return;
      }
    }

    console.log("=== ENVOI REQUÊTE CLIENT ===");
    console.log("Action:", responseData.action);
    console.log("Données:", responseData);

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
      
      console.log("Réponse serveur:", response.data);
            playNotificationSound();
      
      // Recharger les réservations
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

      alert("Réponse envoyée avec succès !");
      
    } catch (err) {
      console.error("Erreur:", err);
      alert(`Erreur: ${err.response?.data?.error || err.message}`);
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

  // Fonction pour déterminer si le client peut agir
  const canClientAct = (reservation) => {
    return reservation.status === 'contre_propose';
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-100 flex">
      {/* Sidebar - Liste des réservations */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <h1 className="text-lg font-bold">Mes Réservations</h1>
          <p className="text-indigo-100 text-sm">Gérez vos demandes</p>
        </div>

        {/* Liste des réservations */}
        <div className="flex-1 overflow-y-auto">
          {reservations.map(reservation => {
            const isActive = selectedReservation?._id === reservation._id;
            const hasAction = canClientAct(reservation);
            
            return (
              <div 
                key={reservation._id}
                onClick={() => handleReservationClick(reservation)}
                className={`p-4 border-b border-gray-50 cursor-pointer transition-all duration-200 hover:bg-slate-50 ${
                  isActive ? 'bg-indigo-50 border-indigo-200' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar - Garage */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    C
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {reservation.garageId?.username}
                        
                      </h3>
                      {hasAction && (
                        <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse flex-shrink-0"></div>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 truncate mb-2">
                      {reservation.serviceName}
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
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                G
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-gray-900"> {selectedReservation.garageId?.username}</h2>
                <p className="text-sm text-gray-500">Service: {selectedReservation.serviceId?.name}</p>
                <p className="text-sm text-gray-500">Numéro de téléphone du garage : {selectedReservation.garageId.phone}</p>

              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedReservation.status)}`}>
                {getStatusIcon(selectedReservation.status)} {selectedReservation.status.replace('_', ' ')}
              </div>
            </div>

            {/* Zone de messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {(() => {
                const messages = [];
                
                // 1. Message initial du client (créé en premier)
                messages.push({
                  type: 'client_initial',
                  timestamp: selectedReservation.createdAt,
                  content: (
                    <div className="flex gap-3 justify-end">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl rounded-tr-md p-4 shadow-sm max-w-md">
                        <div className="text-sm font-medium mb-2">Ma demande de réservation</div>
                        <div className="space-y-2 text-sm">
                          <div className="bg-white/20 rounded-lg p-3">
                            <div className="font-medium">Service: {selectedReservation.serviceId?.name}</div>
                            <div>📅 {new Date(selectedReservation.creneauDemande.date).toLocaleDateString('fr-FR')} à {selectedReservation.creneauDemande.heureDebut}</div>
                          </div>
                          <div className="bg-white/10 rounded-lg p-3">
                            <div className="font-medium mb-1">Description:</div>
                            <div>{selectedReservation.descriptionDepannage}</div>
                          </div>
                        </div>
                        <div className="text-xs text-indigo-200 mt-2">
                          {new Date(selectedReservation.createdAt).toLocaleString('fr-FR')}
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {selectedReservation.clientName.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  )
                });

                // 2. Message du garage (s'il existe)
                if (selectedReservation.messageGarage) {
                  messages.push({
                    type: 'garage',
                    timestamp: selectedReservation.updatedAt,
                    content: (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          G
                        </div>
                        <div className="bg-white rounded-2xl rounded-tl-md p-4 shadow-sm border max-w-md">
                          <div className="text-sm text-gray-700">{selectedReservation.messageGarage}</div>
                          {selectedReservation.creneauPropose && (
                            <div className="bg-indigo-50 rounded-lg p-3 mt-2">
                              <div className="text-sm font-medium text-indigo-900">Créneau proposé:</div>
                              <div className="text-sm text-indigo-700">📅 {new Date(selectedReservation.creneauPropose.date).toLocaleDateString('fr-FR')} à {selectedReservation.creneauPropose.heureDebut}</div>
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mt-2">
                            {new Date(selectedReservation.updatedAt).toLocaleString('fr-FR')}
                          </div>
                        </div>
                      </div>
                    )
                  });
                }

                // 3. Message du client (réponse, s'il existe)
                if (selectedReservation.messageClient) {
                  messages.push({
                    type: 'client_response',
                    timestamp: selectedReservation.updatedAt,
                    content: (
                      <div className="flex gap-3 justify-end">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl rounded-tr-md p-4 shadow-sm max-w-md">
                          <div className="text-sm">{selectedReservation.messageClient}</div>
                          <div className="text-xs text-indigo-200 mt-2">
                            {new Date(selectedReservation.updatedAt).toLocaleString('fr-FR')}
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {selectedReservation.clientName.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    )
                  });
                }

                // Trier les messages par timestamp
                messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

                // Retourner les messages triés
                return messages.map((message, index) => (
                  <div key={`${message.type}-${index}`}>
                    {message.content}
                  </div>
                ));
              })()}
              
              {/* Élément invisible pour l'auto-scroll */}
              <div ref={messagesEndRef} />
            </div>

            {/* Zone de réponse - seulement si le client peut agir */}
            {canClientAct(selectedReservation) && (
              <div className="p-4 bg-white border-t border-gray-200">
                <div className="space-y-4">
                  {/* Actions rapides */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setResponseData({...responseData, action: 'accepter_contre_proposition'})}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        responseData.action === 'accepter_contre_proposition' 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      }`}
                    >
                      ✅ Accepter
                    </button>
                    <button
                      onClick={() => setResponseData({...responseData, action: 'client_contre_proposer'})}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        responseData.action === 'client_contre_proposer' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      🔄 Contre-proposer
                    </button>
                    <button
                      onClick={() => setResponseData({...responseData, action: 'annuler'})}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        responseData.action === 'annuler' 
                          ? 'bg-rose-500 text-white' 
                          : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                      }`}
                    >
                      ❌ Annuler
                    </button>
                  </div>

                  {/* Options de contre-proposition */}
                  {responseData.action === 'client_contre_proposer' && (
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
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:border-indigo-500 focus:outline-none"
                      onKeyPress={(e) => e.key === 'Enter' && handleResponse()}
                    />
                    <button
                      onClick={handleResponse}
                      disabled={!responseData.action || (responseData.action === 'client_contre_proposer' && (!responseData.newDate || !responseData.newHeureDebut))}
                      className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:from-indigo-600 hover:to-purple-700 transition-all"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Message d'information pour les statuts non-modifiables */}
            {!canClientAct(selectedReservation) && (
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <div className="text-center text-sm text-gray-600">
                  {selectedReservation.status === 'en_attente' && (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                      <span>En attente de réponse du garage...</span>
                    </div>
                  )}
                  {selectedReservation.status === 'accepte' && (
                    <div className="flex items-center justify-center gap-2 text-emerald-600">
                      <span>✅</span>
                      <span>Votre rendez-vous est confirmé !</span>
                    </div>
                  )}
                  {selectedReservation.status === 'refuse' && (
                    <div className="flex items-center justify-center gap-2 text-rose-600">
                      <span>❌</span>
                      <span>Votre demande a été refusée.</span>
                    </div>
                  )}
                  {selectedReservation.status === 'annule' && (
                    <div className="flex items-center justify-center gap-2 text-gray-600">
                      <span>🚫</span>
                      <span>Demande annulée.</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Sélectionnez une réservation</h3>
              <p className="text-gray-500">Choisissez une demande pour voir la conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}