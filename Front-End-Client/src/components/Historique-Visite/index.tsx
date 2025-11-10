"use client";
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Phone, MapPin, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';

const ReservationsHistory = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all_month'); // all, en_attente, accepte, refuse

  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get('http://localhost:5000/api/client-reservations/', {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      
      if (response.data.success) {
        setReservations(response.data.reservations);
      } else {
        setError('Impossible de charger les réservations');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId) => {
  if (!window.confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
    return;
  }
  
  try {
    const response = await axios.put(
      `http://localhost:5000/api/cancel-reservation/${reservationId}`,
      {},
      { headers: { Authorization: `Bearer ${getAuthToken()}` } }
    );
    
    if (response.data.success) {
      // Recharger les réservations
      fetchReservations();
      // Ou mettre à jour localement
      // setReservations(prev => prev.map(r => 
      //   r._id === reservationId ? {...r, status: 'cancelled'} : r
      // ));
    }
  } catch (error) {
    alert('Erreur lors de l\'annulation');
    console.error(error);
  }
};


const currentMonthCount = reservations.filter(reservation => {
  const reservationDate = new Date(reservation.creneauDemande.date);
  const currentDate = new Date();
  return reservationDate.getMonth() === currentDate.getMonth() 
      && reservationDate.getFullYear() === currentDate.getFullYear();
}).length;

  const getStatusInfo = (status) => {
    const statusMap = {
      en_attente: {
        label: 'En attente',
        color: 'bg-yellow-100 text-yellow-800',
        icon: <Clock className="w-4 h-4" />
      },
      accepte: {
        label: 'Confirmée',
        color: 'bg-green-100 text-green-800',
        icon: <CheckCircle className="w-4 h-4" />
      },
      refuse: {
        label: 'refusée',
        color: 'bg-red-100 text-red-800',
        icon: <XCircle className="w-4 h-4" />
      },
        contre_propose: {
        label: 'contre_propose',
        color: 'bg-yellow-100 text-yellow-800',
        icon: <XCircle className="w-4 h-4" />
      },
      annule: {
        label: 'Annulée',
        color: 'bg-red-600 text-white',
        icon: <CheckCircle className="w-4 h-4" />
      },

    };
    return statusMap[status] || statusMap.en_attente;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return timeString || 'Non spécifié';
  };

const filteredReservations = reservations.filter(reservation => {
  if (filter === 'all_month') {
    const reservationDate = new Date(reservation.creneauDemande.date); // ✅ CORRECT
    const currentDate = new Date();
    return reservationDate.getMonth() >= currentDate.getMonth()
        && reservationDate.getFullYear() === currentDate.getFullYear();
  }
  
  return reservation.status === filter;
});

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">Erreur</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchReservations}
            className="mt-4 w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Réservations</h1>
          <p className="text-gray-600">Consultez l'historique de vos rendez-vous</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all_month')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'all_month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Toutes ({currentMonthCount})
            </button>
            <button
              onClick={() => setFilter('en_attente')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'en_attente'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              En attente
            </button>
            <button
              onClick={() => setFilter('accepte')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'accepte'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Confirmées
            </button>
            <button
              onClick={() => setFilter('contre_propose')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'contre_propose'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Contre Proposées
            </button>
            <button
              onClick={() => setFilter('annule')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'annule'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Annulées
            </button>
             <button
              onClick={() => setFilter('refuse')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'refuse'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Refusées
            </button>
          </div>
        </div>

        {/* Reservations List */}
        {filteredReservations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucune réservation
            </h3>
            <p className="text-gray-600">
              {filter === 'all'
                ? "Vous n'avez pas encore de réservations"
                : `Aucune réservation ${getStatusInfo(filter).label.toLowerCase()}`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReservations.map((reservation) => {
              const statusInfo = getStatusInfo(reservation.status);
              return (
                <div
                  key={reservation._id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Left Section */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {reservation.serviceId?.name || 'Service non spécifié'}
                        </h3>
                        <span
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}
                        >
                          {statusInfo.icon}
                          {statusInfo.label}
                        </span>
                      </div>

                      <div className="space-y-2 text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span className="font-medium">
                            {reservation.garageId?.username || 'Garage non spécifié'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{reservation.garageId?.phone || 'N/A'}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(reservation.creneauDemande.date)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(reservation.creneauDemande.heureDebut)}</span>
                        </div>
                      </div>

                      {reservation.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Notes:</span> {reservation.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex flex-col gap-2 md:w-40">
                     
                      {reservation.status === 'en_attente' && (
                        <button 
                            onClick={() => handleCancelReservation(reservation._id)}
                            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium"
                        >
                            Annuler
                        </button>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReservationsHistory;