"use client"
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function GarageRatingsDisplay({ garageId }) {
  const [ratings, setRatings] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterMinRating, setFilterMinRating] = useState(null);

  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  const fetchRatings = async (page = 1, minRating = null) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      if (minRating) {
        params.append('minRating', minRating.toString());
      }

const res = await axios.get(
  `http://localhost:5000/api/garagiste/garage-ratings/${garageId}?${params}`,
  {
    headers: { Authorization: `Bearer ${getAuthToken()}` }
  }
);

      if (res.data.success) {
        setRatings(res.data.ratings);
        setStatistics(res.data.statistics);
        setPagination(res.data.pagination);
      }
      setLoading(false);
    } catch (err) {
      console.error("Erreur fetch ratings:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (garageId) {
      fetchRatings(currentPage, filterMinRating);
    }
  }, [garageId, currentPage, filterMinRating]);

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
    );
  };

  const getRatingBarColor = (rating) => {
    if (rating >= 4) return 'bg-green-500';
    if (rating >= 3) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading && !statistics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des évaluations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête avec statistiques globales */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Évaluations des clients</h1>
          
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Note moyenne */}
              <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg">
                <div className="text-5xl font-bold text-yellow-600 mb-2">
                  {statistics.averageRating.toFixed(1)}
                </div>
                <div className="flex justify-center mb-2">
                  {renderStars(Math.round(statistics.averageRating))}
                </div>
                <p className="text-gray-600 font-medium">
                  {statistics.totalRatings} évaluation{statistics.totalRatings > 1 ? 's' : ''}
                </p>
              </div>

              {/* Distribution des notes */}
              <div className="col-span-1 md:col-span-2 p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribution des notes</h3>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = statistics[`rating${star}`] || 0;
                    const percentage = statistics.totalRatings > 0 
                      ? (count / statistics.totalRatings) * 100 
                      : 0;
                    
                    return (
                      <div key={star} className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700 w-12">
                          {star} ⭐
                        </span>
                        <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full ${getRatingBarColor(star)} transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-16 text-right">
                          {count} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                {/* Recommandations */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium">Recommandent ce garage</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-green-600">
                        {statistics.totalRatings > 0 
                          ? ((statistics.totalRecommande / statistics.totalRatings) * 100).toFixed(0)
                          : 0}%
                      </span>
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Filtrer par note:</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterMinRating(null)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterMinRating === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Toutes
              </button>
              {[5, 4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setFilterMinRating(rating)}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-1 ${
                    filterMinRating === rating
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {rating}⭐+
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Liste des évaluations */}
{/* Liste des évaluations avec Swiper */}
<div className="relative">
  {loading ? (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
    </div>
  ) : ratings.length > 0 ? (
    <Swiper
      modules={[Navigation, Pagination, Autoplay]}
      spaceBetween={24}
      slidesPerView={1}
      navigation
      pagination={{ clickable: true }}
      autoplay={{ delay: 5000, disableOnInteraction: false }}
      breakpoints={{
        640: { slidesPerView: 1 },
        768: { slidesPerView: 2 },
        1024: { slidesPerView: 3 }
      }}
      className="pb-12"
    >
      {ratings.map((rating) => (
        <SwiperSlide key={rating._id}>
          <div className="bg-white rounded-lg shadow-lg p-6 h-full hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {rating.ficheClientId?.nom?.charAt(0).toUpperCase() || 'C'}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {rating.ficheClientId?.nom || 'Client'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {renderStars(rating.rating)}
                  </div>
                  <span className="text-xs text-gray-500 mt-1 block">
                    {new Date(rating.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
              
              {rating.recommande && (
                <div className="shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                </div>
              )}
            </div>

            {rating.comment && (
              <p className="text-gray-700 text-sm mb-4 leading-relaxed line-clamp-3">
                {rating.comment}
              </p>
            )}

            {rating.ordreSnapshot && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 space-y-1">
                <p className="text-xs text-gray-600 truncate">
                  <span className="font-medium">Service:</span> {rating.ordreSnapshot.service}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  <span className="font-medium">Véhicule:</span> {rating.ordreSnapshot.vehiculeNom}
                </p>
              </div>
            )}
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  ) : (
    <div className="bg-white rounded-lg shadow p-12 text-center">
      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Aucune évaluation trouvée
      </h3>
      <p className="text-gray-500">
        {filterMinRating 
          ? `Aucune évaluation de ${filterMinRating} étoiles ou plus`
          : 'Les évaluations de vos clients apparaîtront ici'
        }
      </p>
    </div>
  )}
</div>

   
      </div>
    </div>
  );
}