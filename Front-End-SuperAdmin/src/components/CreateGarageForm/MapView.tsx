// MapView.tsx
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix de l'icône Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
  location: [number, number];
  setLocation: (location: [number, number]) => void;
}

export default function MapView({ location, setLocation }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    // Initialiser la carte seulement une fois
    if (!mapRef.current) {
      mapRef.current = L.map('map').setView(location, 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);

      // Ajouter le marqueur
      markerRef.current = L.marker(location, { draggable: true })
        .addTo(mapRef.current)
        .bindPopup('📍 Position de votre garage');

      // Événement drag du marqueur
      markerRef.current.on('dragend', () => {
        if (markerRef.current) {
          const pos = markerRef.current.getLatLng();
          setLocation([pos.lat, pos.lng]);
        }
      });

      // Clic sur la carte pour déplacer le marqueur
      mapRef.current.on('click', (e: L.LeafletMouseEvent) => {
        const newPos: [number, number] = [e.latlng.lat, e.latlng.lng];
        if (markerRef.current) {
          markerRef.current.setLatLng(newPos);
        }
        setLocation(newPos);
      });
    }

    return () => {
      // Cleanup
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Mettre à jour la position quand location change
  useEffect(() => {
    if (mapRef.current && markerRef.current && location) {
      mapRef.current.setView(location, 13);
      markerRef.current.setLatLng(location);
    }
  }, [location]);

  return <div id="map" style={{ height: '400px', width: '100%' }} />;
}