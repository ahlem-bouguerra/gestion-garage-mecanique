"use client";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function LocationMarker({ location, setLocation }: any) {
  useMapEvents({
    click(e) {
      setLocation([e.latlng.lat, e.latlng.lng]);
    },
  });

  return location ? <Marker position={location} icon={markerIcon} /> : null;
}

export default function MapComponent({ location, setLocation }: any) {
  return (
    <MapContainer
      center={location || [36.8065, 10.1815]} // Par défaut Tunis
      zoom={13}
      style={{ height: "300px", width: "100%", marginTop: 20 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker location={location} setLocation={setLocation} />
    </MapContainer>
  );
}
