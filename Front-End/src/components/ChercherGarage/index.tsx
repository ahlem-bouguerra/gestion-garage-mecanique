"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, List, Map, Navigation, Phone, Mail, Clock, Car } from 'lucide-react';
import dynamic from 'next/dynamic';
import axios from 'axios';

// Types pour TypeScript
interface Governorate {
  _id: string;
  name: string;
}

interface City {
  _id: string;
  name: string;
}

interface Garage {
  _id: string;
  garagenom: string;
  streetAddress?: string;
  phone?: string;
  email?: string;
  governorateId?: { name: string };
  cityId?: { name: string };
  location?: {
    coordinates: [number, number];
  };
  distance?: number;
  drivingDistance?: number;
  estimatedTime?: string;
}

interface Service {
  _id: string;
  name: string;
  statut: string;
  description?: string;
}


const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">Chargement de la carte...</div>
});

const GarageSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [garages, setGarages] = useState<Garage[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('map');
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [userAddress, setUserAddress] = useState('');
  const [filters, setFilters] = useState({
    governorate: '',
    city: '',
    radius: 100000 // CHANGÉ: Défaut à 100km au lieu de 10km
  });
  const [services, setServices] = useState<Service[]>([]);
  const router = useRouter();


  // États pour les données de localisation
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [selectedGarage, setSelectedGarage] = useState<Garage | null>(null);

  // Fonction pour obtenir l'adresse à partir des coordonnées
  const getUserAddress = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=fr`
      );
      const data = await response.json();
      
      if (data.display_name) {
        const address = `${data.address?.city || data.address?.town || data.address?.village || ''}, ${data.address?.state || ''}`;
        setUserAddress(address);
      }
    } catch (error) {
      console.error('Erreur lors de la géolocalisation inverse:', error);
    }
  };

  // Charger les gouvernorats depuis l'API
  useEffect(() => {
    const loadGovernorates = async () => {
      setLoadingLocations(true);
      try {
        const response = await fetch('http://localhost:5000/api/governorates');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('La réponse n\'est pas du JSON valide');
        }

        const data = await response.json();
        
        if (Array.isArray(data)) {
          setGovernorates(data.map(gov => ({
            _id: gov._id,
            name: gov.name,
          })));
        } else if (data.success && Array.isArray(data.governorates)) {
          setGovernorates(data.governorates);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des gouvernorats:', error);
        setGovernorates([]);
      } finally {
        setLoadingLocations(false);
      }
    };

    loadGovernorates();
  }, []);

  // Charger les villes quand un gouvernorat est sélectionné
  useEffect(() => {
    const loadCities = async () => {
      if (!filters.governorate) {
        setCities([]);
        return;
      }

      setLoadingLocations(true);
      try {
        const response = await fetch(`http://localhost:5000/api/cities/${filters.governorate}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('La réponse n\'est pas du JSON valide');
        }

        const data = await response.json();
        
        if (Array.isArray(data)) {
          setCities(data.map(city => ({
            _id: city._id,
            name: city.name,
          })));
        } else if (data.success && Array.isArray(data.cities)) {
          setCities(data.cities);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des villes:', error);
        setCities([]);
      } finally {
        setLoadingLocations(false);
      }
    };

    loadCities();
  }, [filters.governorate]);

  // Obtenir la géolocalisation de l'utilisateur
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setUserLocation(location);
          
          // Obtenir l'adresse
          await getUserAddress(location.latitude, location.longitude);
        },
        (error) => {
          console.log('Géolocalisation non disponible:', error);
        }
      );
    }
  }, []);

  // Calcul de distance amélioré avec la formule de Haversine
  const calculateDistance = (garage: Garage) => {
    if (!userLocation || !garage.location?.coordinates) return null;
    
    const [garageLng, garageLat] = garage.location.coordinates;
    const { latitude: userLat, longitude: userLng } = userLocation;
    
    const R = 6371; // Rayon de la Terre en km
    const dLat = (garageLat - userLat) * Math.PI / 180;
    const dLng = (garageLng - userLng) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLat * Math.PI / 180) * Math.cos(garageLat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
  };

  // Calcul de distance routière avec OpenRouteService
  const calculateDrivingDistance = async (garage: Garage) => {
    if (!userLocation || !garage.location?.coordinates) return null;

    try {
      const [garageLng, garageLat] = garage.location.coordinates;
      const { latitude: userLat, longitude: userLng } = userLocation;

      // Utilisation d'OSRM (service gratuit pour les directions)
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${garageLng},${garageLat}?overview=false&alternatives=false&steps=false`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const distanceKm = route.distance / 1000;
          const durationMinutes = Math.round(route.duration / 60);
          
          return {
            distance: distanceKm,
            duration: durationMinutes
          };
        }
      }
    } catch (error) {
      console.error('Erreur calcul distance routière:', error);
    }
    
    return null;
  };

  // Fonction de recherche des garages améliorée
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

      console.log('🔍 Recherche avec paramètres:', {
        governorate: filters.governorate,
        city: filters.city,
        radius: filters.radius,
        userLocation
      });

      const response = await fetch(`http://localhost:5000/api/search?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.garages)) {
        // Calculer les distances pour chaque garage
        const garagesWithDistances = await Promise.all(
          data.garages.map(async (garage) => {
            const straightDistance = calculateDistance(garage);
            garage.distance = straightDistance;

            // Calculer la distance routière pour les garages les plus proches (limite à 100km maintenant)
            if (straightDistance && straightDistance < 100) {
              try {
                const drivingData = await calculateDrivingDistance(garage);
                if (drivingData) {
                  garage.drivingDistance = drivingData.distance;
                  
                  // Calcul du temps estimé plus précis
                  const hours = Math.floor(drivingData.duration / 60);
                  const minutes = drivingData.duration % 60;
                  
                  if (hours > 0) {
                    garage.estimatedTime = `${hours}h ${minutes}min`;
                  } else {
                    garage.estimatedTime = `${minutes} min`;
                  }
                }
              } catch (error) {
                console.error('Erreur calcul route:', error);
              }
            }

            return garage;
          })
        );

        // Trier par distance (privilégier la distance routière si disponible)
        garagesWithDistances.sort((a, b) => {
          const distA = a.drivingDistance || a.distance || Infinity;
          const distB = b.drivingDistance || b.distance || Infinity;
          return distA - distB;
        });

        setGarages(garagesWithDistances);
        console.log('✅ Garages trouvés:', garagesWithDistances.length);
      } else {
        setGarages([]);
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setGarages([]);
    } finally {
      setLoading(false);
    }
  };

  // Charger tous les garages au premier rendu
  useEffect(() => {
    if (!hasInitiallyLoaded) {
      searchGarages();
      setHasInitiallyLoaded(true);
    }
  }, [userLocation]);

  // Recherche automatique quand les filtres changent
  useEffect(() => {
    if (!hasInitiallyLoaded) return;

    const timer = setTimeout(() => {
      searchGarages();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, filters]);

const handleGarageSelect = (garageId: string) => {
  const garage = garages.find(g => g._id === garageId);
  if (garage) {
    setSelectedGarage(garage); // Mettre le garage sélectionné dans le state
  }
};

  const getDirections = (garage) => {
    if (!garage.location?.coordinates) return;
    
    const [lng, lat] = garage.location.coordinates;
    
    // Ouvrir Google Maps avec directions
    if (userLocation) {
      const url = `https://www.google.com/maps/dir/${userLocation.latitude},${userLocation.longitude}/${lat},${lng}`;
      window.open(url, '_blank');
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      window.open(url, '_blank');
    }
  };

  useEffect(() => {
  const fetchServices = async () => {
    if (!selectedGarage) return; // pas de garage => pas de services

    try {
      const res = await axios.get("http://localhost:5000/api/services/available-for-mechanics");
      
      if (Array.isArray(res.data)) {
        setServices(res.data);
      } else if (res.data.success && Array.isArray(res.data.services)) {
        setServices(res.data.services);
      } else {
        setServices([]);
      }
    } catch (err: any) {
      console.error("❌ Erreur lors du chargement des services:", err.response?.data || err.message);
      setServices([]);
    }
  };

  fetchServices();
}, [selectedGarage]);

const handleReservation = (garage) => {
  // Stocker les données du garage dans localStorage ou les passer via query params
  const garageData = {
    id: garage._id,
    name: garage.garagenom,
    address: garage.streetAddress,
    city: garage.cityId?.name,
    governorate: garage.governorateId?.name,
    phone: garage.phone,
    email: garage.email
  };
  
  // Passer les données via query params (plus fiable que localStorage)
  const queryParams = new URLSearchParams({
    garageId: garage._id,
    garageName: garage.garagenom,
    garageAddress: garage.streetAddress || '',
    garageCity: garage.cityId?.name || '',
    garageGovernorate: garage.governorateId?.name || '',
    garagePhone: garage.phone || '',
    garageEmail: garage.email || ''
  }).toString();
  
  router.push(`/demande-reservation?${queryParams}`);
};


  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header de recherche */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Trouvez un garage près de chez vous
        </h1>
        
        {/* Barre de recherche principale */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un garage par nom..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filtres */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Sélection gouvernorat */}
          <select 
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={filters.governorate}
            onChange={(e) => setFilters({...filters, governorate: e.target.value, city: ''})}
            disabled={loadingLocations}
          >
            <option value="">Tous les gouvernorats</option>
            {governorates.map((gov) => (
              <option key={gov._id} value={gov._id}>
                {gov.name}
              </option>
            ))}
          </select>
          
          {/* Sélection ville */}
          <select 
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={filters.city}
            onChange={(e) => setFilters({...filters, city: e.target.value})}
            disabled={!filters.governorate || loadingLocations}
          >
            <option value="">Toutes les villes</option>
            {cities.map((city) => (
              <option key={city._id} value={city._id}>
                {city.name} 
              </option>
            ))}
          </select>
          
          {/* Sélection rayon - MODIFIÉ avec des options plus larges */}
          <select 
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={filters.radius}
            onChange={(e) => setFilters({...filters, radius: parseInt(e.target.value)})}
          >
            <option value="10000">Dans un rayon de 10km</option>
            <option value="25000">Dans un rayon de 25km</option>
            <option value="50000">Dans un rayon de 50km</option>
            <option value="100000">Dans un rayon de 100km (recommandé)</option>
            <option value="200000">Dans un rayon de 200km</option>
            <option value="999999">Toute la Tunisie</option>
          </select>
        </div>

        {/* Toggle vue liste/carte */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-4">
  <p className="text-gray-600">
    {garages.length} garage{garages.length > 1 ? 's' : ''} trouvé{garages.length > 1 ? 's' : ''}
  </p>
  
  {userLocation && (
    <div className="text-sm bg-green-50 px-3 py-2 rounded-lg border border-green-200">
      <div className="flex items-center gap-2 text-green-700">
        <span className="text-green-600">📍</span>
        <span className="font-medium">Position détectée</span>
      </div>
      {userAddress && (
        <div className="text-green-600 text-xs mt-1">
          📍 {userAddress}
        </div>
      )}
      <div className="text-green-500 text-xs mt-1">
        Coordonnées: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
      </div>
      <div className="text-blue-500 text-xs mt-1 font-medium">
        Rayon de recherche: {filters.radius / 1000}km
      </div>
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
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">{garage.garagenom}</h3>
                        {garage.username && (
                          <p className="text-xl font-semibold text-blue-500">{garage.username}</p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {garage.distance && (
                          <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
                            📏 {garage.distance.toFixed(1)} km
                          </span>
                        )}
                        {garage.drivingDistance && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <Car className="h-3 w-3" />
                            {garage.drivingDistance.toFixed(1)} km ({garage.estimatedTime})
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">
                          {garage.streetAddress && `${garage.streetAddress}, `}
                          {garage.cityId?.name}, {garage.governorateId?.name}
                        </span>
                      </div>
                      
                      {garage.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span className="text-sm">{garage.phone}</span>
                        </div>
                      )}
                      
                      {garage.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span className="text-sm">{garage.email}</span>
                        </div>
                      )}

                      {garage.estimatedTime && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm text-green-600">
                            Temps de trajet: {garage.estimatedTime}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <button 
                        onClick={() => handleGarageSelect(garage._id)}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Voir détails
                      </button>
                      <button 
                        onClick={() => getDirections(garage)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
                      >
                        <Navigation className="h-4 w-4" />
                        Itinéraire
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>  
      )}
{selectedGarage && (
  <div className="bg-white rounded-lg shadow-lg p-6 mt-6 border-l-4 border-blue-500">
    <div className="flex justify-between items-start mb-4">
      <h2 className="text-2xl font-bold text-gray-800">{selectedGarage.garagenom}</h2>
      <button 
        onClick={() => setSelectedGarage(null)}
        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-200"
        aria-label="Fermer"
      >
        ×
      </button>
    </div>
    
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Informations principales */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
          Informations du garage
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-gray-700 p-2 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600">👤</span>
            </div>
            <span className="font-medium">{selectedGarage.username || 'Propriétaire non spécifié'}</span>
          </div>
          
          <div className="flex items-start gap-3 text-gray-700 p-2 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
              <span className="text-blue-600">📍</span>
            </div>
            <div className="flex-1">
              <p className="font-medium">
                {selectedGarage.streetAddress && `${selectedGarage.streetAddress}`}
              </p>
              <p className="text-sm text-gray-500">
                {selectedGarage.cityId?.name}, {selectedGarage.governorateId?.name}
              </p>
            </div>
          </div>
          
          {selectedGarage.phone && (
            <div className="flex items-center gap-3 text-gray-700 p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600">📞</span>
              </div>
              <a 
                href={`tel:${selectedGarage.phone}`} 
                className="font-medium hover:text-blue-600 transition-colors"
              >
                {selectedGarage.phone}
              </a>
            </div>
          )}
          
          {selectedGarage.email && (
            <div className="flex items-center gap-3 text-gray-700 p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600">✉️</span>
              </div>
              <a 
                href={`mailto:${selectedGarage.email}`} 
                className="font-medium hover:text-blue-600 transition-colors"
              >
                {selectedGarage.email}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Services proposés */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 flex items-center gap-2">
          <span className="text-blue-600">🔧</span>
          Services proposés
        </h3>
        
        {services.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {services.map((service) => (
              <div 
                key={service._id} 
                className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border-l-4 border-blue-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-800">{service.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    service.statut === 'Actif' || service.statut === 'actif' 
                      ? 'bg-green-100 text-green-700' 
                      : service.statut === 'Inactif' || service.statut === 'inactif'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {service.statut || 'Non défini'}
                  </span>
                </div>
                
                {service.description && (
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {service.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-gray-400 text-2xl">🔧</span>
            </div>
            <p className="text-gray-500 font-medium">Aucun service disponible</p>
            <p className="text-gray-400 text-sm mt-1">Ce garage n'a pas encore ajouté de services.</p>
          </div>
        )}
      </div>
    </div>

    {/* Footer optionnel pour actions */}
    <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end gap-3">
<button 
  onClick={() => handleReservation(selectedGarage)}
  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
>
  Réserver
</button>
    </div>
  </div>
)}


      {/* Message si aucun résultat */}
      {garages.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Aucun garage trouvé pour votre recherche.</p>
          <p className="text-gray-400 mt-2">Essayez d'élargir vos critères de recherche ou augmenter le rayon.</p>
          {userLocation && (
            <p className="text-blue-500 mt-2 text-sm">
              💡 Conseil: Augmentez le rayon de recherche à 100km ou plus pour trouver plus de garages.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default GarageSearch;