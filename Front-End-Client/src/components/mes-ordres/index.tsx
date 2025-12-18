

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Star,
  Search,
  Filter,
  Eye,
  Calendar,
  TrendingUp
} from 'lucide-react';

interface Rating {
  _id: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

// Types
interface Ordre {
  _id: string;
  numeroOrdre: string;
  status: 'en_attente' | 'en_cours' | 'termine' | 'suspendu';
  dateCommence: string;
  dateFinPrevue?: string;
  dateFinReelle?: string;
  vehiculedetails: {
    nom: string;
    vehiculeId: any;
  };
  garageId: {
    _id: string;
    name: string;
    phone?: string;
    averageRating?: number;
  };
  nombreTaches: number;
  nombreTachesTerminees: number;
  canBeRated: boolean;
  enRetard: boolean;
  joursRestants?: number;
  ratingId?: any;
}

interface Stats {
  total: number;
  enAttente: number;
  enCours: number;
  termines: number;
  suspendus: number;
  aNotes: number;
}

const MesOrdresPage = () => {
  const router = useRouter();
  const [ordres, setOrdres] = useState<Ordre[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedOrdre, setSelectedOrdre] = useState<Ordre | null>(null);
  const [ratings, setRatings] = useState<{ [key: string]: any }>({});

    // Filtres et pagination
  const [filters, setFilters] = useState({
    status: 'tous',
    search: '',
    page: 1
  });

  // Récupérer le token
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || sessionStorage.getItem('token');
    }
    return null;
  };

  const fetchRating = async (ordreId: string) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await axios.get(
        `http://localhost:5000/api/client/rating/${ordreId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = await response.data;

      if (data.success && data.rating) {
        setRatings(prev => ({
          ...prev,
          [ordreId]: data.rating
        }));
      }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        window.location.href = '/auth/sign-in';
        return;
      }
      console.error('❌ Erreur chargement rating:', error);
    }
  };


  // Charger les ordres
  const fetchOrdres = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/auth/sign-in');
        return;
      }

      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: '10',
        ...(filters.status !== 'tous' && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      });

      const response = await axios.get(
        `http://localhost:5000/api/mes-ordres?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = await response.data;

      if (data.success) {
        setOrdres(data.ordres);
        data.ordres.forEach((ordre: Ordre) => {
          if (ordre.ratingId) {
            fetchRating(ordre._id);
          }
        });

      } else {
        console.error('Erreur:', data.message);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        window.location.href = '/auth/sign-in';
        return;
      }
      console.error('❌ Erreur chargement ordres:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les statistiques
  const fetchStats = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await axios.get(
        'http://localhost:5000/api/mes-ordres-stats',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = await response.data;

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        window.location.href = '/auth/sign-in';
        return;
      }
      console.error('❌ Erreur chargement stats:', error);
    }
  };

  useEffect(() => {
    fetchOrdres();
    fetchStats();
  }, [filters]);

  // Fonction pour ouvrir le modal de notation
  const handleRate = (ordre: Ordre) => {
    setSelectedOrdre(ordre);
    setShowRatingModal(true);
  };

  // Fonction pour voir les détails
  const handleViewDetails = (ordreId: string) => {
    router.push(`/mes-ordres/${ordreId}`);
  };

  // Rendu des badges de statut
  const StatusBadge = ({ status }: { status: string }) => {
    const configs = {
      en_attente: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'En attente' },
      en_cours: { icon: TrendingUp, color: 'bg-blue-100 text-blue-800', label: 'En cours' },
      termine: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Terminé' },
      suspendu: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Suspendu' }
    };

    const config = configs[status as keyof typeof configs];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  // Carte de statistique
  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className="p-3 rounded-full" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-8 h-8" style={{ color }} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mes Ordres de Travail</h1>
          <p className="text-gray-600 mt-2">Suivez l'avancement de vos réparations</p>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total"
              value={stats.total}
              icon={Calendar}
              color="#3B82F6"
            />
            <StatCard
              title="En cours"
              value={stats.enCours}
              icon={TrendingUp}
              color="#10B981"
            />
            <StatCard
              title="Terminés"
              value={stats.termines}
              icon={CheckCircle}
              color="#8B5CF6"
            />
            <StatCard
              title="À noter"
              value={stats.aNotes}
              icon={Star}
              color="#F59E0B"
            />
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher par numéro d'ordre..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                />
              </div>
            </div>

            {/* Filtre par statut */}
            <div className="w-full md:w-64">
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              >
                <option value="tous">Tous les statuts</option>
                <option value="en_attente">En attente</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminés</option>
                <option value="suspendu">Suspendus</option>
              </select>
            </div>
          </div>
        </div>

        {/* Liste des ordres */}
        <div className="space-y-4">
          {ordres.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucun ordre de travail
              </h3>
              <p className="text-gray-600">
                Vous n'avez pas encore d'ordre de travail avec ce filtre.
              </p>
            </div>
          ) : (
            ordres.map((ordre) => (
              <div
                key={ordre._id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Info principale */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">
                            {ordre.numeroOrdre}
                          </h3>
                          <StatusBadge status={ordre.status} />
                          {ordre.canBeRated && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                              <Star className="w-4 h-4" />
                              À noter
                            </span>
                          )}
                          {ordre.enRetard && ordre.status !== 'termine' && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                              <AlertCircle className="w-4 h-4" />
                              En retard
                            </span>
                          )}
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <p className="flex items-center gap-2">
                            <span className="font-semibold">Véhicule:</span>
                            {ordre.vehiculedetails.nom}
                          </p>
                          <p className="flex items-center gap-2">
                            <span className="font-semibold">Garage:</span>
                            {ordre.garageId.name}
                            {ordre.garageId.averageRating && (
                              <span className="flex items-center gap-1 text-yellow-500">
                                <Star className="w-4 h-4 fill-current" />
                                {ordre.garageId.averageRating.toFixed(1)}
                              </span>
                            )}
                          </p>
                          <p className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span className="font-semibold">Début:</span>
                            {new Date(ordre.dateCommence).toLocaleDateString('fr-FR')}
                            {ordre.dateFinPrevue && (
                              <>
                                <span className="mx-2">→</span>
                                <span className="font-semibold">Prévue:</span>
                                {new Date(ordre.dateFinPrevue).toLocaleDateString('fr-FR')}
                              </>
                            )}
                          </p>
                        </div>


                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 lg:w-48">
                    <button
                      onClick={() => handleViewDetails(ordre._id)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Voir détails
                    </button>

                    {ordre.canBeRated && (
                      <button
                        onClick={() => handleRate(ordre)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        <Star className="w-4 h-4" />
                        Noter le service
                      </button>
                    )}

                    {ratings[ordre._id] && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-800">Votre avis</span>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${star <= ratings[ordre._id].rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                                }`}
                            />
                          ))}
                          <span className="text-sm text-gray-600 ml-2">
                            ({ratings[ordre._id].rating}/5)
                          </span>
                        </div>
                        {ratings[ordre._id].comment && (
                          <p className="text-sm text-gray-700 italic">
                            "{ratings[ordre._id].comment}"
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Noté le {new Date(ratings[ordre._id].createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal de notation */}
        {showRatingModal && selectedOrdre && (
          <RatingModal
            ordre={selectedOrdre}
            onClose={() => {
              setShowRatingModal(false);
              setSelectedOrdre(null);
            }}
            onSuccess={() => {
              fetchOrdres();
              fetchStats();
            }}
          />
        )}
      </div>
    </div>
  );
};

// ============================================
// Composant Modal de notation
// ============================================

interface RatingModalProps {
  ordre: Ordre;
  onClose: () => void;
  onSuccess: () => void;
}

const RatingModal: React.FC<RatingModalProps> = ({ ordre, onClose, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || sessionStorage.getItem('token');
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      alert('Veuillez sélectionner une note');
      return;
    }

    setSubmitting(true);

    try {
      const token = getAuthToken();
      const response = await axios.post('http://localhost:5000/api/client/rate-garage', {
          ordreId: ordre._id,
          rating,
          comment
        },
       {   headers: {
          Authorization: `Bearer ${token}`
        },
      }
      );

      const data = await response.data;

      if (data.success) {
        alert('✅ Merci pour votre avis !');
        onSuccess();
        onClose();
      } else {
        alert('❌ ' + data.message);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        window.location.href = '/auth/sign-in';
        return;
      }
      console.error('❌ Erreur notation:', error);
      alert('Erreur lors de l\'envoi de la notation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Noter le service
        </h2>

        <div className="mb-4">
          <p className="text-sm text-gray-600">Ordre: {ordre.numeroOrdre}</p>
          <p className="text-sm text-gray-600">Garage: {ordre.garageId.name}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Étoiles */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note globale *
            </label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                      }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-gray-500 mt-2">
              {rating > 0 && `${rating} étoile${rating > 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Commentaire */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commentaire (optionnel)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Partagez votre expérience avec ce garage..."
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/500 caractères
            </p>
          </div>

          {/* Boutons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={rating === 0 || submitting}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Envoi...' : 'Envoyer ma note'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MesOrdresPage;