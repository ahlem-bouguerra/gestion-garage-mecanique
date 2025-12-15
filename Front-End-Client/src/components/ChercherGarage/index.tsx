"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, List, Map, Navigation, Phone, Mail, Clock, Car } from 'lucide-react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import ClientReservationManagement from '../gestion-reservations-client';

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">Chargement de la carte...</div>
});

const GarageSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [garages, setGarages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('map');
  const [userLocation, setUserLocation] = useState(null);
  const [userAddress, setUserAddress] = useState('');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showChatModal, setShowChatModal] = useState(false);
  const getAuthToken = () => {
      return localStorage.getItem('token') || sessionStorage.getItem('token');
  };
  
  const [filters, setFilters] = useState({
    governorate: '',
    city: '',
    radius: 100000 // Défaut 100km
  });

  const [governorates, setGovernorates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedGarage, setSelectedGarage] = useState(null);
  const [services, setServices] = useState([]);

  const router = useRouter();

  // Cacher le header quand le modal de chat est ouvert
useEffect(() => {
  const header = document.querySelector('header');
  if (!header) return;

  if (showChatModal) {
    header.classList.add("hidden");
  } else {
    header.classList.remove("hidden");
  }
}, [showChatModal]);

  // Obtenir l'adresse depuis les coordonnées
  const getUserAddress = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=fr`
      );
      const data = await response.json();
      if (data.display_name) {
        const address = `${data.address?.city || data.address?.town || ''}, ${data.address?.state || ''}`;
        setUserAddress(address);
      }
    } catch (error) {
      console.error('Erreur géolocalisation inverse:', error);
    }
  };

  // Géolocalisation de l'utilisateur
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setUserLocation(location);
          await getUserAddress(location.latitude, location.longitude);
        },
        (error) => console.log('Géolocalisation non disponible:', error)
      );
    }
  }, []);

  // Charger les gouvernorats
  useEffect(() => {
    const loadGovernorates = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/governorates');
        const data = await response.json();
        setGovernorates(Array.isArray(data) ? data : data.governorates || []);
      } catch (error) {
        console.error('Erreur chargement gouvernorats:', error);
      }
    };
    loadGovernorates();
  }, []);

  // Charger les villes selon le gouvernorat sélectionné
  useEffect(() => {
    const loadCities = async () => {
      if (!filters.governorate) {
        setCities([]);
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/api/cities/${filters.governorate}`);
        const data = await response.json();
        setCities(Array.isArray(data) ? data : data.cities || []);
      } catch (error) {
        console.error('Erreur chargement villes:', error);
      }
    };
    loadCities();
  }, [filters.governorate]);

  // Recherche des garages (SIMPLIFIÉ - calculs dans le backend)
const searchGarages = async () => {
  setLoading(true);
  try {
    const token = getAuthToken();

    if (!token || token === 'null' || token === 'undefined') {
      window.location.href = '/auth/sign-in';
      return;
    }
    const params = new URLSearchParams();

    if (searchTerm) params.append('search', searchTerm);
    if (filters.governorate) params.append('governorate', filters.governorate);
    if (filters.city) params.append('city', filters.city);
    if (userLocation) {
      params.append('latitude', userLocation.latitude.toString());
      params.append('longitude', userLocation.longitude.toString());
      params.append('radius', filters.radius.toString());
    }

    const response = await fetch(`http://localhost:5000/api/search?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const data = await response.json();

    if (data.success) {
      setGarages(data.garages || []);
      console.log('✅ Garages reçus:', data.garages.length);
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

  // Charger les garages au démarrage
  useEffect(() => {
    if (userLocation) {
      searchGarages();
    }
  }, [userLocation]);

  // Recherche automatique avec debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (userLocation) {
        searchGarages();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, filters]);

  // Obtenir l'itinéraire vers un garage
  const getDirections = (garage) => {
    if (!garage.location?.coordinates) return;

    const [lng, lat] = garage.location.coordinates;
    const url = userLocation
      ? `https://www.google.com/maps/dir/${userLocation.latitude},${userLocation.longitude}/${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    
    window.open(url, '_blank');
  };

  // Sélectionner un garage et charger ses services
  const handleGarageSelect = async (garageId) => {
    const garage = garages.find(g => g._id === garageId);
    if (!garage) return;

    setSelectedGarage(garage);

    try {
          const token = getAuthToken();
    
    if (!token || token === 'null' || token === 'undefined') {
      window.location.href = '/auth/sign-in';
      return;
    }
      const res = await axios.get(`http://localhost:5000/api/services/garage/${garageId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
      setServices(Array.isArray(res.data) ? res.data : res.data.services || []);
    } catch (error) {
      console.error('Erreur chargement services:', error);
      setServices([]);
    }
  };

  // Rediriger vers la réservation
  const handleReservation = (garage) => {
    const queryParams = new URLSearchParams({
      garageId: garage._id,
      nom: garage.nom,
      garageAddress: garage.streetAddress || '',
      garageCity: garage.cityId?.name || '',
      garageGovernorate: garage.governorateId?.name || '',
      garagePhone: garage.phone || '',
      garageEmail: garage.emailProfessionnel || ''
    }).toString();

    router.push(`/demande-reservation?${queryParams}`);
  };

  const checkUnreadMessages = async () => {
  try {
    const token = getAuthToken();
    if (!token || token === 'null' || token === 'undefined') {
      window.location.href = '/auth/sign-in';
      return;
    }
    const res = await axios.get("http://localhost:5000/api/client-reservations/", {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Compter les réservations nécessitant une action
    const unread = res.data.reservations.filter(r => r.status === 'contre_propose').length;
    setUnreadMessages(unread);
  } catch (err) {
    console.error("Erreur check messages:", err);
  }
};
// Vérifier les messages toutes les 30 secondes
useEffect(() => {
  checkUnreadMessages();
  const interval = setInterval(checkUnreadMessages, 30000);
  return () => clearInterval(interval);
}, []);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header de recherche */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Trouvez un garage près de chez vous
        </h1>

        {/* Barre de recherche */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un garage par nom..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filtres */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <select
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={filters.governorate}
            onChange={(e) => setFilters({ ...filters, governorate: e.target.value, city: '' })}
          >
            <option value="">Tous les gouvernorats</option>
            {governorates.map((gov) => (
              <option key={gov._id} value={gov._id}>{gov.name}</option>
            ))}
          </select>

          <select
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            disabled={!filters.governorate}
          >
            <option value="">Toutes les villes</option>
            {cities.map((city) => (
              <option key={city._id} value={city._id}>{city.name}</option>
            ))}
          </select>

          <select
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={filters.radius}
            onChange={(e) => setFilters({ ...filters, radius: parseInt(e.target.value) })}
          >
            <option value="10000">Rayon: 10km</option>
            <option value="25000">Rayon: 25km</option>
            <option value="50000">Rayon: 50km</option>
            <option value="100000">Rayon: 100km (recommandé)</option>
            <option value="200000">Rayon: 200km</option>
          </select>
        </div>

        {/* Infos et toggle vue */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-2">
            <p className="text-gray-600">
              {garages.length} garage{garages.length > 1 ? 's' : ''} trouvé{garages.length > 1 ? 's' : ''}
            </p>

            {userLocation && (
              <div className="text-sm bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-700">
                  <span>📍</span>
                  <span className="font-medium">Position détectée</span>
                </div>
                {userAddress && (
                  <div className="text-green-600 text-xs mt-1">
                    {userAddress}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                viewMode === 'list' ? 'bg-white shadow' : 'text-gray-600'
              }`}
            >
              <List className="h-4 w-4" />
              Liste
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                viewMode === 'map' ? 'bg-white shadow' : 'text-gray-600'
              }`}
            >
              <Map className="h-4 w-4" />
              Carte
            </button>
          </div>
        </div>
      </div>

      {/* Résultats */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {viewMode === 'map' ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <MapView
                garages={garages}
                userLocation={userLocation}
                userAddress={userAddress}
                onGarageSelect={handleGarageSelect}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {garages.map((garage) => (
                <div key={garage._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-semibold text-gray-800">{garage.nom}</h3>
                      
                      <div className="flex flex-col items-end gap-1">
                        {garage.distance && (
                          <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
                            📏 {garage.distance} km
                          </span>
                        )}
                        {garage.drivingDistance && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <Car className="h-3 w-3" />
                            {garage.drivingDistance} km ({garage.estimatedTime})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">
                          {garage.streetAddress && `${garage.streetAddress}, `}
                          {garage.cityName}, {garage.governorateName}
                        </span>
                      </div>

                      {garage.telephoneProfessionnel && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span className="text-sm">{garage.telephoneProfessionnel}</span>
                        </div>
                      )}

                      {garage.estimatedTime && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm text-green-600">
                            Temps: {garage.estimatedTime}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => handleGarageSelect(garage._id)}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                      >
                        Voir détails
                      </button>
                      <button
                        onClick={() => getDirections(garage)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <Navigation className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Détails du garage sélectionné */}
      {selectedGarage && (
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6 border-l-4 border-blue-500">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-800">{selectedGarage.nom}</h2>
            <button
              onClick={() => setSelectedGarage(null)}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Informations */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Informations</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span>📍</span>
                  <div>
                    <p className="font-medium">{selectedGarage.streetAddress}</p>
                    <p className="text-sm text-gray-500">
                      {selectedGarage.cityName}, {selectedGarage.governorateName}
                    </p>
                  </div>
                </div>

                {selectedGarage.telephoneProfessionnel && (
                  <div className="flex items-center gap-3">
                    <span>📞</span>
                    <a href={`tel:${selectedGarage.telephoneProfessionnel}`} className="hover:text-blue-600">
                      {selectedGarage.telephoneProfessionnel}
                    </a>
                  </div>
                )}

                {selectedGarage.emailProfessionnel && (
                  <div className="flex items-center gap-3">
                    <span>✉️</span>
                    <a href={`mailto:${selectedGarage.emailProfessionnel}`} className="hover:text-blue-600">
                      {selectedGarage.emailProfessionnel}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Services */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Services proposés</h3>
              
              {services.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {services.map((service) => (
                    <div key={service._id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold">{service.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          service.statut?.toLowerCase() === 'actif'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {service.statut}
                        </span>
                      </div>
                      {service.description && (
                        <p className="text-gray-600 text-sm mt-2">{service.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Aucun service disponible</p>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t flex justify-end">
            <button
              onClick={() => handleReservation(selectedGarage)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Réserver
            </button>
          </div>
        </div>
      )}

      {/* Message aucun résultat */}
      {garages.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Aucun garage trouvé</p>
          <p className="text-gray-400 mt-2">Essayez d'élargir vos critères de recherche</p>
        </div>
      )}
      {/* Bouton chat flottant */}
<button
  onClick={() => setShowChatModal(true)}
  className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50 hover:scale-110"
>
  <Mail className="h-6 w-6" />
  {unreadMessages > 0 && (
    <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
      {unreadMessages}
    </span>
  )}
</button>

{/* Modal de chat */}
{showChatModal && (
  <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
    <ClientReservationManagement onClose={() => setShowChatModal(false)} />
  </div>
)}
    </div>
  );
};

export default GarageSearch;