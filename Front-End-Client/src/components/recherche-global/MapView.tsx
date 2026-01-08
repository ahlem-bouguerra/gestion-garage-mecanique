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

const selectedGarageIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [30, 49],
  iconAnchor: [15, 49],
  popupAnchor: [1, -40],
  shadowSize: [49, 49],
});

interface MapViewProps {
  garages: any[];
  userLocation: { latitude: number; longitude: number } | null;
  userAddress: string;
  onGarageSelect: (id: string) => void;
  selectedGarageId?: string;
}

const MapView = ({ 
  garages, 
  userLocation, 
  userAddress, 
  onGarageSelect,
  selectedGarageId 
}: MapViewProps) => {
  const mapCenter = userLocation 
    ? [userLocation.latitude, userLocation.longitude] 
    : [33.8869, 9.5375]; // Centre de la Tunisie par défaut

  return (
    <div className="h-full w-full">
      <MapContainer
        center={mapCenter as [number, number]}
        zoom={userLocation ? 12 : 8}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        {/* Tuiles de carte avec style sombre pour correspondre au design */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {/* Alternative : style classique OpenStreetMap */}
        {/* <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        /> */}
        
        {/* Marqueur de l'utilisateur */}
        {userLocation && (
          <Marker 
            position={[userLocation.latitude, userLocation.longitude]} 
            icon={userIcon}
          >
            <Popup className="custom-popup">
              <div className="p-3 min-w-[200px]">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600 mb-2">
                    📍 Votre position
                  </div>
                  {userAddress && (
                    <p className="text-sm text-gray-600 mb-2">
                      {userAddress}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marqueurs des garages */}
        {garages.map((garage) => {
          if (!garage.location?.coordinates) return null;
          
          const [lng, lat] = garage.location.coordinates;
          const isSelected = selectedGarageId === garage._id;
          
          return (
            <Marker 
              key={garage._id}
              position={[lat, lng]} 
              icon={isSelected ? selectedGarageIcon : garageIcon}
              eventHandlers={{
                click: () => onGarageSelect(garage._id)
              }}
            >
              <Popup className="custom-popup">
                <div className="p-3 min-w-[250px]">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">
                    🔧 {garage.nom}
                  </h3>
                  
                  <div className="space-y-2 mb-3">
                    <p className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-base">📍</span>
                      <span>
                        {garage.streetAddress && `${garage.streetAddress}, `}
                        {garage.cityName}, {garage.governorateName}
                      </span>
                    </p>
                    
                    {garage.telephoneProfessionnel && (
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="text-base">📞</span>
                        <span>{garage.telephoneProfessionnel}</span>
                      </p>
                    )}
                    
                    {garage.distance && (
                      <div className="bg-blue-50 rounded-lg p-2 mt-2">
                        <p className="text-sm text-blue-700 font-semibold flex items-center gap-2">
                          <span className="text-base">📏</span>
                          Distance: {garage.distance} km
                        </p>
                      </div>
                    )}
                    
                    {garage.drivingDistance && (
                      <div className="bg-green-50 rounded-lg p-2">
                        <p className="text-sm text-green-700 font-semibold flex items-center gap-2">
                          <span className="text-base">🚗</span>
                          Route: {garage.drivingDistance} km
                        </p>
                        <p className="text-xs text-green-600 ml-6">
                          Temps estimé: {garage.estimatedTime}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onGarageSelect(garage._id);
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:shadow-lg transition-all hover:scale-105"
                  >
                    Voir les détails
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* CSS personnalisé pour les popups */}
      <style jsx global>{`
        .leaflet-container {
          font-family: inherit;
        }
        
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          padding: 0;
          overflow: hidden;
        }
        
        .custom-popup .leaflet-popup-content {
          margin: 0;
          width: auto !important;
        }
        
        .custom-popup .leaflet-popup-tip {
          box-shadow: 0 3px 14px rgba(0, 0, 0, 0.2);
        }
        
        .leaflet-popup-close-button {
          font-size: 24px !important;
          padding: 8px 12px !important;
          color: #6b7280 !important;
        }
        
        .leaflet-popup-close-button:hover {
          color: #1f2937 !important;
        }
      `}</style>
    </div>
  );
};

export default MapView;