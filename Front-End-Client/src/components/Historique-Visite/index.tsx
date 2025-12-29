"use client";
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Phone, MapPin, AlertCircle, CheckCircle, XCircle, Building2 } from 'lucide-react';
import axios from 'axios';

// Types
interface Reservation {
  _id: string;
  status: 'en_attente' | 'accepte' | 'refuse' | 'contre_propose' | 'annule';
  creneauDemande: {
    date: string;
    heureDebut: string;
  };
  serviceId?: {
    name: string;
  };
  garageId?: {
    nom: string;
    telephoneProfessionnel?: string;
  };
  notes?: string;
}

type FilterType = 'all_month' | 'en_attente' | 'accepte' | 'refuse' | 'contre_propose' | 'annule';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const ReservationsHistory: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all_month');
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const getAuthToken = (): string | null => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  const redirectToLogin = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    window.location.href = '/auth/sign-in';
  };

  const isValidToken = (token: string | null): boolean => {
    return !!token && token !== 'null' && token !== 'undefined';
  };

  useEffect(() => {
    fetchReservations();
  }, [currentPage, filter]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!isValidToken(token)) {
        redirectToLogin();
        return;
      }

      // ✅ FIX: Construction correcte des params
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        status: filter
      });

      // ✅ FIX: URL sans double slash
      const response = await axios.get(
        `${API_BASE_URL}/client-reservations?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('📦 Réponse API:', response.data);

      if (response.data.success) {
        setReservations(response.data.reservations);

        // ✅ FIX: Vérification et mise à jour de la pagination
        if (response.data.pagination) {
          const pages = response.data.pagination.pages || 0;
          setTotalPages(pages);
          console.log('📄 Total pages:', pages);
          console.log('📝 Total items:', response.data.pagination.total);
          console.log('📍 Page actuelle:', response.data.pagination.page);
        } else {
          console.warn('⚠️ Pas de données de pagination dans la réponse');
          setTotalPages(0);
        }
      } else {
        setError('Impossible de charger les réservations');
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        redirectToLogin();
        return;
      }
      setError('Erreur de connexion au serveur');
      console.error('❌ Erreur fetch réservations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      return;
    }

    try {
      const token = getAuthToken();
      if (!isValidToken(token)) {
        redirectToLogin();
        return;
      }

      const response = await axios.put(
        `${API_BASE_URL}/cancel-reservation/${reservationId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        fetchReservations();
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        redirectToLogin();
        return;
      }
      setError('Erreur lors de l\'annulation de la réservation');
      console.error('Erreur annulation:', error);
    }
  };

  const getStatusInfo = (status: Reservation['status']) => {
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
        label: 'Refusée',
        color: 'bg-red-100 text-red-800',
        icon: <XCircle className="w-4 h-4" />
      },
      contre_propose: {
        label: 'Contre-proposée',
        color: 'bg-orange-100 text-orange-800',
        icon: <Clock className="w-4 h-4" />
      },
      annule: {
        label: 'Annulée',
        color: 'bg-gray-100 text-gray-800',
        icon: <XCircle className="w-4 h-4" />
      }
    };
    return statusMap[status] || statusMap.en_attente;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeString?: string): string => {
    return timeString || 'Non spécifié';
  };

  const filteredReservations = reservations;

  // ✅ FIX: Composant Pagination avec meilleure logique
  const Pagination = ({ currentPage, totalPages, onPageChange }: any) => {
    // ✅ Ne pas afficher si moins de 2 pages
    if (totalPages <= 1) {
      console.log('🚫 Pagination masquée: totalPages =', totalPages);
      return null;
    }

    const pages = [];

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    console.log('✅ Pagination affichée:', { currentPage, totalPages });

    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Précédent
        </button>

        {pages.map((page, index) => (
          page === '...' ? (
            <span key={index} className="px-2">...</span>
          ) : (
            <button
              key={index}
              onClick={() => onPageChange(page)}
              className={`px-4 py-2 rounded-lg ${currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'border hover:bg-gray-50'
                }`}
            >
              {page}
            </button>
          )
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Suivant
        </button>
      </div>
    );
  };

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
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-4 rounded-xl">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Mes Réservations
              </h1>
              <p className="text-gray-600 text-lg mt-1">
                Consultez l'historique de vos rendez-vous
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <FilterButton
              active={filter === 'all_month'}
              onClick={() => {
                setFilter('all_month');
                setCurrentPage(1);
              }}
              color="blue"
            >
              Toutes
            </FilterButton>
            
            <FilterButton
              active={filter === 'en_attente'}
              onClick={() => {
                setFilter('en_attente');
                setCurrentPage(1);
              }}
              color="yellow"
            >
              En attente
            </FilterButton>
            
            <FilterButton
              active={filter === 'accepte'}
              onClick={() => {
                setFilter('accepte');
                setCurrentPage(1);
              }}
              color="green"
            >
              Confirmées
            </FilterButton>
            
            <FilterButton
              active={filter === 'contre_propose'}
              onClick={() => {
                setFilter('contre_propose');
                setCurrentPage(1);
              }}
              color="orange"
            >
              Contre-proposées
            </FilterButton>
            
            <FilterButton
              active={filter === 'annule'}
              onClick={() => {
                setFilter('annule');
                setCurrentPage(1);
              }}
              color="gray"
            >
              Annulées
            </FilterButton>
            
            <FilterButton
              active={filter === 'refuse'}
              onClick={() => {
                setFilter('refuse');
                setCurrentPage(1);
              }}
              color="red"
            >
              Refusées
            </FilterButton>
          </div>
        </div>

        {filteredReservations.length === 0 ? (
          <EmptyState filter={filter} getStatusInfo={getStatusInfo} />
        ) : (
          <>
            <div className="space-y-4">
              {filteredReservations.map((reservation) => (
                <ReservationCard
                  key={reservation._id}
                  reservation={reservation}
                  statusInfo={getStatusInfo(reservation.status)}
                  formatDate={formatDate}
                  formatTime={formatTime}
                  onCancel={handleCancelReservation}
                />
              ))}
            </div>

            {/* ✅ Pagination toujours visible si totalPages > 1 */}
            <div className="bg-white rounded-lg shadow-sm p-4 mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page: number) => setCurrentPage(page)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  color: 'blue' | 'yellow' | 'green' | 'orange' | 'gray' | 'red';
  count?: number;
  children: React.ReactNode;
}

const FilterButton: React.FC<FilterButtonProps> = ({ active, onClick, color, count, children }) => {
  const colorClasses = {
    blue: active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    yellow: active ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    green: active ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    orange: active ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    gray: active ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    red: active ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  };

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition ${colorClasses[color]}`}
    >
      {children} {count !== undefined && `(${count})`}
    </button>
  );
};

interface EmptyStateProps {
  filter: FilterType;
  getStatusInfo: (status: Reservation['status']) => { label: string };
}

const EmptyState: React.FC<EmptyStateProps> = ({ filter, getStatusInfo }) => (
  <div className="bg-white rounded-lg shadow-sm p-12 text-center">
    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
    <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune réservation</h3>
    <p className="text-gray-600">
      {filter === 'all_month'
        ? "Vous n'avez pas de réservations ce mois-ci"
        : `Aucune réservation ${getStatusInfo(filter as Reservation['status']).label.toLowerCase()}`}
    </p>
  </div>
);

interface ReservationCardProps {
  reservation: Reservation;
  statusInfo: { label: string; color: string; icon: React.ReactNode };
  formatDate: (date: string) => string;
  formatTime: (time?: string) => string;
  onCancel: (id: string) => void;
}

const ReservationCard: React.FC<ReservationCardProps> = ({
  reservation,
  statusInfo,
  formatDate,
  formatTime,
  onCancel
}) => (
  <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition p-6">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-xl font-semibold text-gray-900">
            {reservation.serviceId?.name || 'Service non spécifié'}
          </h3>
          <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
            {statusInfo.icon}
            {statusInfo.label}
          </span>
        </div>

        <div className="space-y-2 text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="font-medium">{reservation.garageId?.nom}</span>
          </div>

          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span>{reservation.garageId?.telephoneProfessionnel || 'N/A'}</span>
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

      {reservation.status === 'en_attente' && (
        <div className="flex flex-col gap-2 md:w-40">
          <button
            onClick={() => onCancel(reservation._id)}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium"
          >
            Annuler
          </button>
        </div>
      )}
    </div>
  </div>
);

export default ReservationsHistory;