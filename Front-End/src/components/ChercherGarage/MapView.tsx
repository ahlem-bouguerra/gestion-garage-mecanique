"use client";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Configuration nécessaire pour les icônes Leaflet
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Configuration des icônes de marqueurs
const userIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const garageIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapViewProps {
  garages: any[];
  userLocation: { latitude: number; longitude: number } | null;
  userAddress: string;
  onGarageSelect: (id: string) => void;
}

const MapView = ({ garages, userLocation, userAddress, onGarageSelect }: MapViewProps) => {
  const mapCenter = userLocation 
    ? [userLocation.latitude, userLocation.longitude] 
    : [33.8869, 9.5375]; // Centre de la Tunisie par défaut

  return (
    <div style={{ height: '500px', borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer
        center={mapCenter as [number, number]}
        zoom={userLocation ? 12 : 8}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Marqueur de l'utilisateur */}
        {userLocation && (
          <Marker 
            position={[userLocation.latitude, userLocation.longitude]} 
            icon={userIcon}
          >
            <Popup>
              <div style={{ textAlign: 'center', minWidth: '200px' }}>
                <strong>📍 Votre position</strong>
                {userAddress && (
                  <p style={{ margin: '5px 0', fontSize: '12px', color: '#6b7280' }}>
                    {userAddress}
                  </p>
                )}
                <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '5px' }}>
                  {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marqueurs des garages */}
        {garages.map((garage) => {
          if (!garage.location?.coordinates) return null;
          
          const [lng, lat] = garage.location.coordinates;
          
          return (
            <Marker 
              key={garage._id}
              position={[lat, lng]} 
              icon={garageIcon}
            >
              <Popup>
                <div style={{ minWidth: '200px' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#1f2937', fontSize: '16px' }}>
                    {garage.garagenom}
                  </h3>
                  <p style={{ margin: '5px 0', fontSize: '13px', color: '#6b7280' }}>
                    📍 {garage.streetAddress ? garage.streetAddress + ', ' : ''}
                    {garage.cityId?.name}, {garage.governorateId?.name}
                  </p>
                  {garage.phone && (
                    <p style={{ margin: '5px 0', fontSize: '13px', color: '#6b7280' }}>
                      📞 {garage.phone}
                    </p>
                  )}
                  {garage.distance && (
                    <p style={{ margin: '5px 0', fontSize: '13px', color: '#3b82f6', fontWeight: 'bold' }}>
                      📏 Distance: {garage.distance.toFixed(1)} km
                    </p>
                  )}
                  {garage.drivingDistance && (
                    <p style={{ margin: '5px 0', fontSize: '13px', color: '#10b981', fontWeight: 'bold' }}>
                      🚗 Route: {garage.drivingDistance.toFixed(1)} km ({garage.estimatedTime})
                    </p>
                  )}
                  <button 
                    onClick={() => onGarageSelect(garage._id)}
                    style={{
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      marginTop: '10px',
                      fontSize: '12px'
                    }}
                  >
                    Voir détails
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};


export default MapView;