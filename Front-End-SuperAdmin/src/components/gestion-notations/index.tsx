"use client";
import { useState, useEffect } from 'react';
import { Star, ThumbsUp, MessageSquare, Trash2, Edit2, X, Check, Loader2, TrendingUp, Users } from 'lucide-react';

interface Rating {
  _id: string;
  rating: number;
  comment: string;
  recommande: boolean;
  createdAt: string;
  ficheClientId: { nom: string };
  ordreSnapshot: {
    numeroOrdre?: string;
    vehicule?: string;
  };
  reponseGarage?: {
    message: string;
    date: string;
  };
}

interface Statistics {
  averageRating: number;
  totalRatings: number;
  rating5: number;
  rating4: number;
  rating3: number;
  rating2: number;
  rating1: number;
  totalRecommande: number;
}

interface GarageRatingsProps {
  selectedGarage: { _id: string; nom: string };
  apiBase?: string;
}

const GarageRatings: React.FC<GarageRatingsProps> = ({
  selectedGarage,
  apiBase = 'http://localhost:5000/api'
}) => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ rating: 5, comment: '', recommande: true });
  const [minRating, setMinRating] = useState<number | null>(null);

  useEffect(() => {
    loadRatings();
  }, [page, minRating]);

  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  const loadRatings = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      let url = `${apiBase}/superAdmin/garage-ratings/${selectedGarage._id}?page=${page}&limit=10`;
      if (minRating) {
        url += `&minRating=${minRating}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Erreur de chargement');

      const data = await response.json();
      setRatings(data.ratings);
      setStatistics(data.statistics);
      setHasMore(data.pagination.hasMore);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rating: Rating) => {
    setEditingId(rating._id);
    setEditForm({
      rating: rating.rating,
      comment: rating.comment,
      recommande: rating.recommande
    });
  };

  const handleUpdate = async (ratingId: string) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${apiBase}/update-rating/${ratingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.message || 'Erreur lors de la mise à jour');
        return;
      }

      await loadRatings();
      setEditingId(null);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (ratingId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette notation ?')) return;

    try {
      const token = getAuthToken();
      const response = await fetch(`${apiBase}/delete-rating/${ratingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.message || 'Erreur lors de la suppression');
        return;
      }

      await loadRatings();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const renderStars = (rating: number, size: string = 'w-5 h-5') => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`${size} ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const renderEditStars = (currentRating: number) => {
    return [...Array(5)].map((_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => setEditForm({ ...editForm, rating: i + 1 })}
        className="focus:outline-none"
      >
        <Star
          className={`w-8 h-8 transition-colors ${
            i < currentRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-200'
          }`}
        />
      </button>
    ));
  };

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header avec statistiques */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Notations - {selectedGarage.nom}
          </h1>

          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-8 h-8 text-yellow-600" />
                  <span className="text-3xl font-bold text-gray-900">
                    {statistics.averageRating.toFixed(1)}
                  </span>
                </div>
                <p className="text-gray-600 font-medium">Note Moyenne</p>
                <div className="flex mt-2">{renderStars(Math.round(statistics.averageRating))}</div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-blue-600" />
                  <span className="text-3xl font-bold text-gray-900">{statistics.totalRatings}</span>
                </div>
                <p className="text-gray-600 font-medium">Total Avis</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <ThumbsUp className="w-8 h-8 text-green-600" />
                  <span className="text-3xl font-bold text-gray-900">{statistics.totalRecommande}</span>
                </div>
                <p className="text-gray-600 font-medium">Recommandations</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
                <div className="space-y-1">
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = statistics[`rating${star}` as keyof Statistics] as number;
                    const percent = statistics.totalRatings > 0 ? (count / statistics.totalRatings) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-sm">
                        <span className="w-3 font-medium">{star}</span>
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-400 rounded-full h-2"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="w-8 text-xs text-gray-600">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="font-medium text-gray-700">Filtrer par note minimum:</label>
            <select
              value={minRating || ''}
              onChange={(e) => {
                setMinRating(e.target.value ? parseInt(e.target.value) : null);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toutes les notes</option>
              <option value="5">5 étoiles</option>
              <option value="4">4+ étoiles</option>
              <option value="3">3+ étoiles</option>
              <option value="2">2+ étoiles</option>
            </select>
          </div>
        </div>

        {/* Liste des notations */}
        <div className="space-y-4">
          {ratings.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Aucune notation pour ce garage</p>
            </div>
          ) : (
            ratings.map((rating) => (
              <div key={rating._id} className="bg-white rounded-xl shadow-lg p-6">
                {editingId === rating._id ? (
                  // Mode édition
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
                      <div className="flex gap-1">{renderEditStars(editForm.rating)}</div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Commentaire</label>
                      <textarea
                        value={editForm.comment}
                        onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={4}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editForm.recommande}
                        onChange={(e) => setEditForm({ ...editForm, recommande: e.target.checked })}
                        className="w-5 h-5"
                      />
                      <label className="text-gray-700">Je recommande ce garage</label>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleUpdate(rating._id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <Check className="w-4 h-4" />
                        Enregistrer
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                      >
                        <X className="w-4 h-4" />
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  // Mode affichage
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg text-gray-900">
                            {rating.ficheClientId?.nom || 'Client'}
                          </h3>
                          {rating.recommande && (
                            <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                              <ThumbsUp className="w-4 h-4" />
                              Recommande
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          {renderStars(rating.rating)}
                          <span className="text-sm text-gray-500">
                            {new Date(rating.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        {rating.ordreSnapshot && (
                          <p className="text-sm text-gray-600">
                            Ordre: {rating.ordreSnapshot.numeroOrdre} - {rating.ordreSnapshot.vehicule}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(rating)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(rating._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {rating.comment && (
                      <p className="text-gray-700 mb-4 leading-relaxed">{rating.comment}</p>
                    )}

                    {rating.reponseGarage && (
                      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mt-4">
                        <p className="font-semibold text-blue-900 mb-2">Réponse du garage:</p>
                        <p className="text-blue-800">{rating.reponseGarage.message}</p>
                        <p className="text-sm text-blue-600 mt-2">
                          {new Date(rating.reponseGarage.date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {ratings.length > 0 && (
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-6 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Précédent
            </button>
            <span className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium">
              Page {page}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore}
              className="px-6 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GarageRatings;