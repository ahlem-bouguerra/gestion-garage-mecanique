// LocationSelector.tsx
"use client";
import { useState, useEffect } from "react";

interface LocationData {
  governorate: string;
  city: string;
  district: string;
  coordinates: [number, number];
}

interface LocationSelectorProps {
  onLocationSelect: (location: [number, number], details: Omit<LocationData, 'coordinates'>) => void;
  initialLocation?: [number, number];
}

// Base de données des localisations tunisiennes
const TUNISIA_LOCATIONS = {
  "Sfax": {
    "Sfax": {
      "Centre Ville": [34.7406, 10.7603],
      "Jadida": [34.7506, 10.7703],
      "Sakiet Eddaier": [34.7206, 10.7403],
      "Sakiet Ezzit": [34.7306, 10.7503],
      "El Ain": [34.7156, 10.7353]
    },
    "Mahres": {
      "Centre Mahres": [34.5267, 10.5042],
      "Port Mahres": [34.5367, 10.5142]
    },
    "Skhira": {
      "Centre Skhira": [34.2989, 10.0703],
      "Port Skhira": [34.3089, 10.0803]
    }
  },
  "Sousse": {
    "Sousse": {
      "Médina": [35.8256, 10.6369],
      "Jawhra": [35.8356, 10.6469],
      "Riadh": [35.8156, 10.6269],
      "Sahloul": [35.8456, 10.6569],
      "Khezama": [35.8056, 10.6169]
    },
    "Msaken": {
      "Centre Msaken": [35.7267, 10.5803],
      "Msaken Est": [35.7367, 10.5903]
    },
    "Kalaa Kebira": {
      "Centre Kalaa Kebira": [35.8889, 10.3444],
      "Kalaa Industrial": [35.8989, 10.3544]
    }
  },
  "Tunis": {
    "Tunis": {
      "Médina": [36.8065, 10.1815],
      "Bab Bhar": [36.8165, 10.1915],
      "Lafayette": [36.8265, 10.2015],
      "Menzah": [36.8365, 10.2115],
      "Manar": [36.8465, 10.2215]
    },
    "Ariana": {
      "Centre Ariana": [36.8606, 10.1956],
      "Soukra": [36.8706, 10.2056],
      "Raoued": [36.8806, 10.2156]
    },
    "Ben Arous": {
      "Centre Ben Arous": [36.7542, 10.2181],
      "Fouchana": [36.7642, 10.2281],
      "Mohamedia": [36.7742, 10.2381]
    }
  },
  "Monastir": {
    "Monastir": {
      "Centre Monastir": [35.7772, 10.8264],
      "Skanes": [35.7872, 10.8364],
      "Dkhila": [35.7672, 10.8164]
    },
    "Ksar Hellal": {
      "Centre Ksar Hellal": [35.6475, 10.8842],
      "Ksar Industrial": [35.6575, 10.8942]
    }
  },
  "Gabès": {
    "Gabès": {
      "Centre Gabès": [33.8815, 10.0982],
      "Jara": [33.8915, 10.1082],
      "Chenini": [33.8715, 10.0882]
    },
    "Mareth": {
      "Centre Mareth": [33.6408, 10.2703],
      "Mareth Sud": [33.6308, 10.2603]
    }
  },
  "Bizerte": {
    "Bizerte": {
      "Centre Bizerte": [37.2744, 9.8739],
      "Corniche": [37.2844, 9.8839],
      "Menzel Bourguiba": [37.1544, 9.7839]
    },
    "Mateur": {
      "Centre Mateur": [37.0406, 9.6656],
      "Mateur Est": [37.0506, 9.6756]
    }
  }
};

export default function LocationSelector({ onLocationSelect, initialLocation }: LocationSelectorProps) {
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");

  const governorates = Object.keys(TUNISIA_LOCATIONS);
  const cities = selectedGovernorate ? Object.keys(TUNISIA_LOCATIONS[selectedGovernorate as keyof typeof TUNISIA_LOCATIONS]) : [];
  const districts = selectedGovernorate && selectedCity 
    ? Object.keys(TUNISIA_LOCATIONS[selectedGovernorate as keyof typeof TUNISIA_LOCATIONS][selectedCity as keyof typeof TUNISIA_LOCATIONS[keyof typeof TUNISIA_LOCATIONS]]) 
    : [];

  // Réinitialiser les sélections quand un niveau supérieur change
  useEffect(() => {
    setSelectedCity("");
    setSelectedDistrict("");
  }, [selectedGovernorate]);

  useEffect(() => {
    setSelectedDistrict("");
  }, [selectedCity]);

  // Déclencher la sélection de localisation
  useEffect(() => {
    if (selectedGovernorate && selectedCity && selectedDistrict) {
      const coordinates = TUNISIA_LOCATIONS[selectedGovernorate as keyof typeof TUNISIA_LOCATIONS][selectedCity as keyof typeof TUNISIA_LOCATIONS[keyof typeof TUNISIA_LOCATIONS]][selectedDistrict as keyof typeof TUNISIA_LOCATIONS[keyof typeof TUNISIA_LOCATIONS][keyof typeof TUNISIA_LOCATIONS[keyof typeof TUNISIA_LOCATIONS]]] as [number, number];
      
      onLocationSelect(coordinates, {
        governorate: selectedGovernorate,
        city: selectedCity,
        district: selectedDistrict
      });
    }
  }, [selectedGovernorate, selectedCity, selectedDistrict, onLocationSelect]);

  return (
    <div style={{ marginBottom: 20 }}>
      <h3>Sélectionnez votre localisation</h3>
      
      <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap', marginBottom: 15 }}>
        {/* Sélection du Gouvernorat */}
        <div style={{ minWidth: 150 }}>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
            Gouvernorat:
          </label>
          <select 
            value={selectedGovernorate} 
            onChange={(e) => setSelectedGovernorate(e.target.value)}
            style={{ 
              width: '100%', 
              padding: 8, 
              border: '1px solid #ddd', 
              borderRadius: 4,
              fontSize: 14
            }}
          >
            <option value="">Choisir un gouvernorat</option>
            {governorates.map(gov => (
              <option key={gov} value={gov}>{gov}</option>
            ))}
          </select>
        </div>

        {/* Sélection de la Ville */}
        {selectedGovernorate && (
          <div style={{ minWidth: 150 }}>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
              Ville:
            </label>
            <select 
              value={selectedCity} 
              onChange={(e) => setSelectedCity(e.target.value)}
              style={{ 
                width: '100%', 
                padding: 8, 
                border: '1px solid #ddd', 
                borderRadius: 4,
                fontSize: 14
              }}
            >
              <option value="">Choisir une ville</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        )}

        {/* Sélection du Quartier/Place */}
        {selectedCity && (
          <div style={{ minWidth: 150 }}>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
              Quartier/Place:
            </label>
            <select 
              value={selectedDistrict} 
              onChange={(e) => setSelectedDistrict(e.target.value)}
              style={{ 
                width: '100%', 
                padding: 8, 
                border: '1px solid #ddd', 
                borderRadius: 4,
                fontSize: 14
              }}
            >
              <option value="">Choisir un quartier</option>
              {districts.map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Affichage de la sélection actuelle */}
      {selectedGovernorate && selectedCity && selectedDistrict && (
        <div style={{ 
          padding: 10, 
          backgroundColor: '#f0f8ff', 
          border: '1px solid #0066cc', 
          borderRadius: 4,
          fontSize: 14
        }}>
          <strong>Localisation sélectionnée:</strong> {selectedDistrict}, {selectedCity}, {selectedGovernorate}
        </div>
      )}
    </div>
  );
}