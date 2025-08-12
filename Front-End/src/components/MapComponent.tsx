// MapComponent.tsx - Version améliorée
"use client";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Popup } from "react-leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import LocationSelector from "./LocationSelector";

// Configuration de l'icône du marqueur avec une couleur personnalisée
const markerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationMarkerProps {
  location: [number, number];
  setLocation: (location: [number, number]) => void;
  isManuallySet: boolean;
}

function LocationMarker({ location, setLocation, isManuallySet }: LocationMarkerProps) {
  const map = useMapEvents({
    click(e) {
      const newLocation: [number, number] = [e.latlng.lat, e.latlng.lng];
      setLocation(newLocation);
      console.log("Position ajustée manuellement:", newLocation);
      
      // Animation douce vers la nouvelle position
      map.flyTo(e.latlng, map.getZoom(), { duration: 0.5 });
    },
  });

  return location ? (
    <Marker 
      position={location} 
      icon={markerIcon}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const position = marker.getLatLng();
          const newLocation: [number, number] = [position.lat, position.lng];
          setLocation(newLocation);
          console.log("Position déplacée par glisser-déposer:", newLocation);
        }
      }}
      draggable={true}
    >
      <Popup>
        <div style={{ textAlign: 'center' }}>
          <strong>📍 Votre localisation</strong><br/>
          <small>
            Lat: {location[0].toFixed(6)}<br/>
            Lng: {location[1].toFixed(6)}
          </small><br/>
          <small style={{ color: '#666' }}>
            {isManuallySet ? "Position ajustée manuellement" : "Position automatique"}
          </small>
        </div>
      </Popup>
    </Marker>
  ) : null;
}

// Composant pour centrer la carte quand la position change
function MapCenterUpdater({ center, zoom = 16 }: { center: [number, number], zoom?: number }) {
  const map = useMap();
  
  useEffect(() => {
    // Animation fluide vers la nouvelle position avec un zoom plus élevé
    map.flyTo(center, zoom, {
      duration: 2 // Animation plus longue pour être plus visible
    });
  }, [center, zoom, map]);
  
  return null;
}

interface MapComponentProps {
  location: [number, number];
  setLocation: (location: [number, number]) => void;
}

export default function MapComponent({ location, setLocation }: MapComponentProps) {
  const [isManuallySet, setIsManuallySet] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const defaultPosition: [number, number] = [36.8065, 10.1815];
  const mapCenter = location || defaultPosition;

  const handleLocationSelect = (coordinates: [number, number], details: any) => {
    console.log("Localisation sélectionnée:", details, coordinates);
    setLocation(coordinates);
    setIsManuallySet(false); // Reset le statut manuel
  };

  const handleManualLocationUpdate = (newLocation: [number, number]) => {
    console.log("Position ajustée manuellement:", newLocation);
    setLocation(newLocation);
    setIsManuallySet(true);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par ce navigateur");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation: [number, number] = [
          position.coords.latitude,
          position.coords.longitude
        ];
        setLocation(newLocation);
        setIsManuallySet(true);
        console.log("Position GPS obtenue:", newLocation);
      },
      (error) => {
        console.error("Erreur géolocalisation:", error);
        alert("Impossible d'obtenir votre position GPS");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Fonction de recherche géographique avec Nominatim (OpenStreetMap)
  const handleSearch = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    
    try {
      // Prioriser les résultats en Tunisie
      const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&countrycodes=tn&q=${encodeURIComponent(query + ", Tunisia")}`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'MapComponent/1.0' // Requis par Nominatim
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
        setShowSearchResults(true);
        console.log("Résultats de recherche:", data);
      }
    } catch (error) {
      console.error("Erreur de recherche:", error);
      alert("Erreur lors de la recherche");
    } finally {
      setIsSearching(false);
    }
  };

  // Gérer la sélection d'un résultat de recherche
  const handleSearchResultSelect = (result: any) => {
    const newLocation: [number, number] = [
      parseFloat(result.lat),
      parseFloat(result.lon)
    ];
    setLocation(newLocation);
    setIsManuallySet(true);
    setSearchQuery(result.display_name);
    setShowSearchResults(false);
    console.log("Localisation sélectionnée depuis la recherche:", newLocation);
  };

  // Fonction de recherche avec délai (debouncing)
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery.length >= 3) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 500); // Attendre 500ms après la dernière frappe

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  return (
    <div style={{ marginTop: 20 }}>
      {/* Sélecteur de localisation hiérarchique */}
      <LocationSelector 
        onLocationSelect={handleLocationSelect}
        initialLocation={location}
      />
      
      {/* Barre de recherche géographique */}
      <div style={{ position: 'relative', marginBottom: 15 }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Rechercher une adresse, rue, lieu... (ex: Avenue Habib Bourguiba, Sfax)"
            style={{
              width: '100%',
              padding: '12px 50px 12px 40px',
              border: '2px solid #e0e0e0',
              borderRadius: 25,
              fontSize: 14,
              outline: 'none',
              transition: 'border-color 0.3s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#2196f3';
              if (searchResults.length > 0) setShowSearchResults(true);
            }}
            onBlur={() => {
              // Délai pour permettre le clic sur les résultats
              setTimeout(() => setShowSearchResults(false), 200);
            }}
          />
          
          {/* Icône de recherche */}
          <div style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#666',
            fontSize: 16
          }}>
            🔍
          </div>
          
          {/* Bouton de nettoyage */}
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
                setShowSearchResults(false);
              }}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 18,
                color: '#999',
                padding: 0,
                width: 24,
                height: 24,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          )}
          
          {/* Indicateur de chargement */}
          {isSearching && (
            <div style={{
              position: 'absolute',
              right: 40,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#2196f3'
            }}>
              ⏳
            </div>
          )}
        </div>

        {/* Résultats de recherche */}
        {showSearchResults && searchResults.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            maxHeight: 300,
            overflowY: 'auto'
          }}>
            {searchResults.map((result, index) => (
              <div
                key={index}
                onClick={() => handleSearchResultSelect(result)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderBottom: index < searchResults.length - 1 ? '1px solid #f0f0f0' : 'none',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = '#f8f9fa';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = 'white';
                }}
              >
                <div style={{ fontWeight: 'bold', color: '#333', marginBottom: 4 }}>
                  📍 {result.display_name.split(',')[0]}
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  {result.display_name}
                </div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                  {result.type} • {parseFloat(result.lat).toFixed(4)}, {parseFloat(result.lon).toFixed(4)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Message si aucun résultat */}
        {showSearchResults && !isSearching && searchResults.length === 0 && searchQuery.length >= 3 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            padding: 16,
            textAlign: 'center',
            color: '#666'
          }}>
            🔍 Aucun résultat trouvé pour "{searchQuery}"
            <br />
            <small>Essayez avec un nom de rue, quartier ou ville</small>
          </div>
        )}
      </div>
      
      {/* Boutons d'aide */}
      <div style={{ 
        display: 'flex', 
        gap: 10, 
        marginBottom: 15, 
        flexWrap: 'wrap' 
      }}>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 'bold'
          }}
        >
          📱 Utiliser ma position GPS
        </button>
        
        <button
          type="button"
          onClick={() => setShowInstructions(!showInstructions)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 'bold'
          }}
        >
          {showInstructions ? '👁️ Masquer aide' : '❓ Afficher aide'}
        </button>
      </div>

      {/* Instructions conditionnelles */}
      {showInstructions && (
        <div style={{ 
          marginBottom: 15, 
          padding: 15, 
          backgroundColor: '#e3f2fd', 
          border: '1px solid #2196f3', 
          borderRadius: 6,
          fontSize: 14
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#1565c0' }}>
            🎯 Comment préciser votre localisation :
          </h4>
          <div style={{ display: 'grid', gap: 8 }}>
            <div><strong>Étape 1:</strong> Sélectionnez gouvernorat → ville → quartier dans les menus</div>
            <div><strong>Étape 2:</strong> 
              <span style={{ color: '#d32f2f', fontWeight: 'bold' }}> CLIQUEZ directement sur la carte</span> 
              pour ajuster la position exacte
            </div>
            <div><strong>Alternative:</strong> 
              <span style={{ color: '#1976d2', fontWeight: 'bold' }}> GLISSEZ le marqueur rouge</span> 
              vers l'endroit précis
            </div>
            <div><strong>Option GPS:</strong> Utilisez le bouton bleu pour votre position actuelle</div>
          </div>
        </div>
      )}

      {/* Carte interactive avec zoom plus élevé */}
      <MapContainer
        center={mapCenter}
        zoom={15} // Zoom initial plus élevé
        style={{ 
          height: "450px", // Carte plus haute
          width: "100%", 
          border: "2px solid #2196f3", // Bordure bleue plus visible
          borderRadius: "8px",
          cursor: "crosshair",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)" // Ombre pour plus de profondeur
        }}
      >
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19} // Zoom maximum plus élevé
        />
        <MapCenterUpdater center={mapCenter} zoom={16} />
        <LocationMarker 
          location={location} 
          setLocation={handleManualLocationUpdate}
          isManuallySet={isManuallySet}
        />
      </MapContainer>

      {/* Affichage des coordonnées avec plus de détails */}
      {location && (
        <div style={{ 
          marginTop: 15, 
          padding: 15,
          backgroundColor: isManuallySet ? '#e8f5e8' : '#fff3e0',
          border: `2px solid ${isManuallySet ? '#4caf50' : '#ff9800'}`,
          borderRadius: 6,
          fontSize: 14 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>📍 Position finale:</strong> {location[0].toFixed(6)}, {location[1].toFixed(6)}
              <br />
              <small style={{ color: '#666' }}>
                {isManuallySet ? '✅ Position ajustée manuellement' : '🎯 Position automatique du quartier'}
              </small>
            </div>
            <div style={{ 
              backgroundColor: isManuallySet ? '#4caf50' : '#ff9800',
              color: 'white',
              padding: '4px 8px',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 'bold'
            }}>
              {isManuallySet ? 'PRÉCISE' : 'GÉNÉRALE'}
            </div>
          </div>
          
          {!isManuallySet && (
            <div style={{ 
              marginTop: 10, 
              padding: 8, 
              backgroundColor: '#fff8e1', 
              borderRadius: 4,
              fontSize: 12,
              color: '#e65100'
            }}>
              💡 <strong>Conseil:</strong> Cliquez sur la carte ou utilisez le GPS pour une position plus précise
            </div>
          )}
        </div>
      )}

      {/* Légende des contrôles */}
      <div style={{ 
        marginTop: 10, 
        padding: 10,
        backgroundColor: '#f5f5f5',
        borderRadius: 4,
        fontSize: 12,
        color: '#666'
      }}>
        <strong>Contrôles de la carte:</strong> 
        Molette souris = Zoom | Clic gauche = Déplacer position | Glisser marqueur = Ajuster précisément
      </div>
    </div>
  );
}