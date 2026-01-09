"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Filter, Navigation, Phone, Mail, Clock, Car, Star, X, Menu, User, LogIn } from 'lucide-react';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => <div className="h-full bg-gray-900 flex items-center justify-center">
    <div className="text-white">Chargement de la carte...</div>
  </div>
});

const GarageSearchGLobal = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [garages, setGarages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [userAddress, setUserAddress] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedGarage, setSelectedGarage] = useState<any | null>(null);
  const [services, setServices] = useState([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [ratingStats, setRatingStats] = useState<any | null>(null);
  const [currentRatingIndex, setCurrentRatingIndex] = useState(0);

  const [filters, setFilters] = useState({
    governorate: '',
    city: '',
    radius: 100000
  });

  const [governorates, setGovernorates] = useState([]);
  const [cities, setCities] = useState([]);

  const router = useRouter();

  // Géolocalisation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setUserLocation(location);
          // Reverse geocoding
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}&accept-language=fr`
            );
            const data = await response.json();
            if (data.display_name) {
              setUserAddress(`${data.address?.city || ''}, ${data.address?.state || ''}`);
            }
          } catch (error) {
            console.error('Erreur géolocalisation:', error);
          }
        },
        (error) => console.log('Géolocalisation non disponible:', error)
      );
    }
  }, []);

  // Charger gouvernorats
  useEffect(() => {
    fetch('http://localhost:5000/api/governorates')
      .then(res => res.json())
      .then(data => setGovernorates(Array.isArray(data) ? data : data.governorates || []))
      .catch(console.error);
  }, []);

  // Charger villes
  useEffect(() => {
    if (!filters.governorate) {
      setCities([]);
      return;
    }
    fetch(`http://localhost:5000/api/cities/${filters.governorate}`)
      .then(res => res.json())
      .then(data => setCities(Array.isArray(data) ? data : data.cities || []))
      .catch(console.error);
  }, [filters.governorate]);

  // Recherche garages
  const searchGarages = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filters.governorate) params.append('governorate', filters.governorate);
      if (filters.city) params.append('city', filters.city);
      if (userLocation) {
        params.append('latitude', userLocation.latitude.toString());
        params.append('longitude', userLocation.longitude.toString());
        params.append('radius', filters.radius.toString());
      }

      const response = await fetch(`http://localhost:5000/api/search?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setGarages(data.garages || []);
      } else {
        setGarages([]);
      }
    } catch (error) {
      console.error('Erreur recherche:', error);
      setGarages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userLocation) searchGarages();
  }, [userLocation]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (userLocation) searchGarages();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, filters]);

  // Sélectionner garage
  const handleGarageSelect = async (garageId: string) => {
    const garage = garages.find((g: any) => g._id === garageId);
    if (!garage) return;

    setSelectedGarage(garage);

    try {
      const servicesRes = await fetch(`http://localhost:5000/api/services/garage/${garageId}`);
      const servicesData = await servicesRes.json();
      setServices(Array.isArray(servicesData) ? servicesData : servicesData.services || []);

      const ratingsRes = await fetch(`http://localhost:5000/api/client/garage-ratings/${garageId}`);
      const ratingsData = await ratingsRes.json();
      if (ratingsData.success) {
        setRatings(ratingsData.ratings);
        setRatingStats(ratingsData.statistics);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setServices([]);
      setRatings([]);
      setRatingStats(null);
    }
  };

  const handleReservation = () => {
    setShowAuthModal(true);
  };

  const getDirections = (garage: any) => {
    if (!garage.location?.coordinates) return;
    const [lng, lat] = garage.location.coordinates;
    const url = userLocation
      ? `https://www.google.com/maps/dir/${userLocation.latitude},${userLocation.longitude}/${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="h-screen w-full relative overflow-hidden bg-gray-900">
      {/* Carte en plein écran */}
      <div className="absolute inset-0">
        <MapView
          garages={garages}
          userLocation={userLocation}
          userAddress={userAddress}
          onGarageSelect={handleGarageSelect}
          selectedGarageId={selectedGarage?._id}
        />
      </div>

      {/* Overlay gradient en haut */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10" />



      {/* Barre de recherche centrale flottante */}
      <div className="absolute top-24 left-0 right-0 z-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-6">
            {/* Recherche principale */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un garage par nom, ville..."
                className="w-full pl-14 pr-32 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:outline-none bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                  showFilters 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Filter className="h-5 w-5" />
                Filtres
              </button>
            </div>

            {/* Filtres déroulants */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-2xl border-2 border-gray-200">
                <select
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none bg-white"
                  value={filters.governorate}
                  onChange={(e) => setFilters({ ...filters, governorate: e.target.value, city: '' })}
                >
                  <option value="">Tous les gouvernorats</option>
                  {governorates.map((gov: any) => (
                    <option key={gov._id} value={gov._id}>{gov.name}</option>
                  ))}
                </select>

                <select
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none bg-white"
                  value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                  disabled={!filters.governorate}
                >
                  <option value="">Toutes les villes</option>
                  {cities.map((city: any) => (
                    <option key={city._id} value={city._id}>{city.name}</option>
                  ))}
                </select>

                <select
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none bg-white"
                  value={filters.radius}
                  onChange={(e) => setFilters({ ...filters, radius: parseInt(e.target.value) })}
                >
                  <option value="10000">📍 10km</option>
                  <option value="25000">📍 25km</option>
                  <option value="50000">📍 50km</option>
                  <option value="100000">📍 100km</option>
                  <option value="200000">📍 200km</option>
                </select>
              </div>
            )}

            {/* Infos résultats */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t-2 border-gray-200">
              <div className="flex items-center gap-3">
                <span className="text-gray-700 font-semibold">
                  {loading ? 'Recherche...' : `${garages.length} garage${garages.length > 1 ? 's' : ''} trouvé${garages.length > 1 ? 's' : ''}`}
                </span>
                {userLocation && userAddress && (
                  <span className="hidden sm:inline-flex items-center gap-2 text-sm bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-medium">
                    📍 {userAddress}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des garages - Sidebar gauche */}
      {garages.length > 0 && (
        <div className="absolute left-4 top-80 bottom-4 w-96 z-20 overflow-hidden">
          <div className="h-full bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col">
            <div className="p-4 border-b-2 border-gray-200">
              <h2 className="font-bold text-lg text-gray-800">Garages disponibles</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {garages.map((garage: any) => (
                <div
                  key={garage._id}
                  onClick={() => handleGarageSelect(garage._id)}
                  className={`bg-white rounded-2xl p-4 shadow-lg border-2 cursor-pointer transition-all hover:scale-105 hover:shadow-xl ${
                    selectedGarage?._id === garage._id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-800">{garage.nom}</h3>
                    {garage.distance && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold">
                        {garage.distance} km
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{garage.cityName}, {garage.governorateName}</span>
                    </div>
                    {garage.estimatedTime && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-green-600">{garage.estimatedTime}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      getDirections(garage);
                    }}
                    className="mt-3 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    <Navigation className="h-4 w-4" />
                    Itinéraire
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Panneau détails garage - Sidebar droite */}
      {selectedGarage && (
        <div className="absolute right-4 top-24 bottom-4 w-[500px] z-30">
          <div className="h-full bg-white/98 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{selectedGarage.nom}</h2>
                  <div className="flex items-center gap-2 text-blue-100">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedGarage.cityName}, {selectedGarage.governorateName}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedGarage(null)}
                  className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Contenu scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Contact */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Phone className="h-5 w-5 text-blue-600" />
                  Contact
                </h3>
                {selectedGarage.telephoneProfessionnel && (
                  <a href={`tel:${selectedGarage.telephoneProfessionnel}`} className="block text-blue-600 hover:underline">
                    {selectedGarage.telephoneProfessionnel}
                  </a>
                )}
                {selectedGarage.emailProfessionnel && (
                  <a href={`mailto:${selectedGarage.emailProfessionnel}`} className="block text-blue-600 hover:underline">
                    {selectedGarage.emailProfessionnel}
                  </a>
                )}
              </div>

              {/* Services */}
              <div>
                <h3 className="font-bold text-gray-800 mb-3">Services proposés</h3>
                {services.length > 0 ? (
                  <div className="space-y-2">
                    {services.map((service: any) => (
                      <div key={service._id} className="bg-gray-50 rounded-xl p-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-800">{service.name}</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            service.statut?.toLowerCase() === 'actif'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {service.statut}
                          </span>
                        </div>
                        {service.description && (
                          <p className="text-gray-600 text-sm mt-1">{service.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Aucun service disponible</p>
                )}
              </div>

              {/* Avis */}
              {ratingStats && ratingStats.totalRatings > 0 && (
                <div>
                  <h3 className="font-bold text-gray-800 mb-3">
                    Avis clients ({ratingStats.totalRatings})
                  </h3>
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-4 border-2 border-yellow-200">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-4xl font-black text-gray-800">
                          {ratingStats.averageRating.toFixed(1)}
                        </div>
                        <div className="text-yellow-500 text-lg">
                          {'★'.repeat(Math.floor(ratingStats.averageRating))}
                          <span className="text-gray-300">
                            {'★'.repeat(5 - Math.floor(ratingStats.averageRating))}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 text-sm text-gray-700">
                        {ratingStats.totalRecommande > 0 && (
                          <div>
                            <span className="font-semibold">{ratingStats.totalRecommande}</span> client
                            {ratingStats.totalRecommande > 1 ? 's recommandent' : ' recommande'}
                          </div>
                        )}
                      </div>
                    </div>

                    {ratings.length > 0 && (
                      <div className="bg-white rounded-xl p-4 mt-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {(ratings[currentRatingIndex].ficheClientId?.nom || 'C')[0].toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800">
                              {ratings[currentRatingIndex].ficheClientId?.nom || 'Client'}
                            </div>
                            <div className="text-yellow-400">
                              {'⭐'.repeat(ratings[currentRatingIndex].rating)}
                            </div>
                            {ratings[currentRatingIndex].comment && (
                              <p className="text-gray-600 text-sm mt-2 italic">
                                "{ratings[currentRatingIndex].comment}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer avec bouton réservation */}
            <div className="p-6 border-t-2 border-gray-200 bg-white">
              <button
                onClick={handleReservation}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-xl transition-all hover:scale-105"
              >
                Réserver maintenant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal authentification */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Connexion requise
              </h2>
              <p className="text-gray-600">
                Créez un compte ou connectez-vous pour réserver ce garage
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push('/auth/sign-in')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Se connecter
              </button>
              <button
                onClick={() => router.push('/auth/sign-up')}
                className="w-full bg-white border-2 border-gray-300 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                Créer un compte
              </button>
              <button
                onClick={() => setShowAuthModal(false)}
                className="w-full text-gray-500 py-2 hover:text-gray-700 transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GarageSearchGLobal;