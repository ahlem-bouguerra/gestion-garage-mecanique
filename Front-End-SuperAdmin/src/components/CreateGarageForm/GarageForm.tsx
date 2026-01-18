import { Building2, Loader2, ArrowRight, Clock, MapPin } from 'lucide-react';
import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">Chargement de la carte...</div>
});

interface GarageFormProps {
  garageData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  onLocationChange?: (location: [number, number]) => void;
}
interface HoraireGroup {
  jours: string[];
  horaire: string;
}

export default function GarageForm({ garageData, onChange, onSubmit, loading, onLocationChange }: GarageFormProps) {
  const [phoneError, setPhoneError] = useState("");
  const [horaires, setHoraires] = useState({
    lundi: { debut: '08:00', fin: '19:00', ferme: false },
    mardi: { debut: '08:00', fin: '19:00', ferme: false },
    mercredi: { debut: '08:00', fin: '19:00', ferme: false },
    jeudi: { debut: '08:00', fin: '19:00', ferme: false },
    vendredi: { debut: '08:00', fin: '19:00', ferme: false },
    samedi: { debut: '08:00', fin: '17:00', ferme: false },
    dimanche: { debut: '', fin: '', ferme: true }
  });

  // États pour gouvernorats et villes
  const [governoratesList, setGovernoratesList] = useState<any[]>([]);
  const [citiesList, setCitiesList] = useState<any[]>([]);
  const [governorateId, setGovernorateId] = useState("");
  const [cityId, setCityId] = useState("");
  const [mechanicLocation, setMechanicLocation] = useState<[number, number] | null>(null);
  const [manualLocationSet, setManualLocationSet] = useState(false); // 🔥 Flag pour position manuelle

  // --- Récupération Gouvernorats ---
  useEffect(() => {
    const fetchGovernorate = async () => {
      try {
        console.log('📍 Chargement des gouvernorats...');
        const response = await fetch("http://localhost:5000/api/governorates");
        const data = await response.json();
        setGovernoratesList(data);
        console.log('✅ Gouvernorats chargés:', data.length);
      } catch (err) {
        console.error("❌ Erreur gouvernorats:", err);
      }
    };
    fetchGovernorate();
  }, []);

  // --- Récupération Villes selon gouvernorat ---
  useEffect(() => {
    const fetchCities = async () => {
      if (!governorateId) {
        setCitiesList([]);
        return;
      }
      try {
        console.log('🏙️ Chargement des villes pour gouvernorat:', governorateId);
        const response = await fetch(`http://localhost:5000/api/cities/${governorateId}`);
        const data = await response.json();
        setCitiesList(data);
        console.log('✅ Villes chargées:', data.length);
      } catch (err) {
        console.error("❌ Erreur villes:", err);
      }
    };
    fetchCities();
  }, [governorateId]);

  // Géocodage automatique quand ville + adresse changent
  useEffect(() => {
    const geocodeAddress = async () => {
      // 🔥 Ne pas géocoder si l'utilisateur a déplacé manuellement le marqueur
      if (manualLocationSet) {
        console.log('⏭️ Géocodage ignoré : position manuelle définie');
        return;
      }

      if (!cityId || !garageData.streetAddress?.trim()) return;

      const selectedCity = citiesList.find((c: any) => c._id === cityId);
      if (!selectedCity) return;

      const fullAddress = `${garageData.streetAddress}, ${selectedCity.name}, Tunisia`;
      
      try {
        console.log('🔍 Géocodage:', fullAddress);
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(fullAddress)}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.length > 0) {
          const newLocation: [number, number] = [
            parseFloat(data[0].lat),
            parseFloat(data[0].lon)
          ];
          setMechanicLocation(newLocation);
          if (onLocationChange) onLocationChange(newLocation);
          console.log('✅ Position géocodée:', newLocation);
        } else {
          // Fallback sur la position de la ville
          if (selectedCity.location?.coordinates) {
            const cityCoords: [number, number] = [
              selectedCity.location.coordinates[1],
              selectedCity.location.coordinates[0]
            ];
            setMechanicLocation(cityCoords);
            if (onLocationChange) onLocationChange(cityCoords);
            console.log('📍 Position centrée sur la ville:', cityCoords);
          }
        }
      } catch (error) {
        console.error("Erreur géocodage:", error);
      }
    };

    const timer = setTimeout(geocodeAddress, 1000);
    return () => clearTimeout(timer);
  }, [cityId, garageData.streetAddress, citiesList, onLocationChange, manualLocationSet]);

  // Handler pour changement de gouvernorat
const handleGovernorateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const value = e.target.value;
  setGovernorateId(value);
  setCityId("");
  setManualLocationSet(false);
  
  const selectedGov = governoratesList.find((g: any) => g._id === value);
  
  // 🔥 Réinitialiser l'adresse
  const addressEvent = {
    target: { name: 'streetAddress', value: '' }
  } as React.ChangeEvent<HTMLInputElement>;
  onChange(addressEvent);
  
  // 🔥 Envoyer l'ID du gouvernorat
  const idEvent = {
    target: { name: 'governorateId', value: value }
  } as React.ChangeEvent<HTMLInputElement>;
  onChange(idEvent);
  
  // 🔥 Envoyer le nom du gouvernorat
  const nameEvent = {
    target: { name: 'governorateName', value: selectedGov?.name || '' }
  } as React.ChangeEvent<HTMLSelectElement>;
  onChange(nameEvent);
};

const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const value = e.target.value;
  setCityId(value);
  setManualLocationSet(false);
  
  const selectedCity = citiesList.find((c: any) => c._id === value);
  
  // 🔥 Réinitialiser l'adresse
  const addressEvent = {
    target: { name: 'streetAddress', value: '' }
  } as React.ChangeEvent<HTMLInputElement>;
  onChange(addressEvent);
  
  if (selectedCity?.location?.coordinates) {
    const cityCoords: [number, number] = [
      selectedCity.location.coordinates[1],
      selectedCity.location.coordinates[0]
    ];
    
    if (!garageData.streetAddress?.trim()) {
      setMechanicLocation(cityCoords);
      if (onLocationChange) onLocationChange(cityCoords);
    }
  }
  
  // 🔥 Envoyer l'ID de la ville
  const idEvent = {
    target: { name: 'cityId', value: value }
  } as React.ChangeEvent<HTMLInputElement>;
  onChange(idEvent);
  
  // 🔥 Envoyer le nom de la ville
  const nameEvent = {
    target: { name: 'cityName', value: selectedCity?.name || '' }
  } as React.ChangeEvent<HTMLSelectElement>;
  onChange(nameEvent);
};

  // Handler pour changement de ville


  // ✅ Validation téléphone tunisien (8 chiffres)
  const validateTunisianPhone = (phone: string) => {
    const cleaned = phone.replace(/[\s\-+]/g, '');
    const number = cleaned.startsWith('216') ? cleaned.slice(3) : cleaned;
    const tunisianPattern = /^[24579]\d{7}$/;

    if (!number) return "Numéro requis";
    if (number.length !== 8) return "Le numéro doit contenir exactement 8 chiffres";
    if (!tunisianPattern.test(number)) return "Numéro invalide (doit commencer par 2, 4, 5, 7 ou 9)";
    return "";
  };

  // ✅ Formater le numéro pendant la saisie
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const limited = cleaned.slice(0, 8);
    
    if (limited.length <= 2) return limited;
    if (limited.length <= 5) return `${limited.slice(0, 2)} ${limited.slice(2)}`;
    return `${limited.slice(0, 2)} ${limited.slice(2, 5)} ${limited.slice(5)}`;
  };

  // ✅ Gérer le changement de téléphone avec formatage
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        name: 'telephoneProfessionnel',
        value: formatted
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChange(syntheticEvent);
    
    const error = validateTunisianPhone(formatted);
    setPhoneError(error);
  };

  // ✅ Générer la chaîne horaires pour le backend
const generateHorairesString = (horaireData: typeof horaires): string => {
  const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  const joursAbrev: Record<string, string> = {
    lundi: 'Lun', mardi: 'Mar', mercredi: 'Mer', jeudi: 'Jeu',
    vendredi: 'Ven', samedi: 'Sam', dimanche: 'Dim'
  };

  const result: string[] = [];
  let tempGroup: HoraireGroup | null = null;

  jours.forEach((jour) => {
    const h = horaireData[jour as keyof typeof horaires];
    const horaire = h.ferme 
      ? 'Fermé' 
      : `${h.debut.replace(':', 'h')}-${h.fin.replace(':', 'h')}`;

    if (tempGroup && tempGroup.horaire === horaire) {
      tempGroup.jours.push(joursAbrev[jour]);
    } else {
      if (tempGroup) {
        // 🔥 Utiliser l'assertion de type ici aussi
        const group = tempGroup as HoraireGroup;
        const joursStr = group.jours.length > 1 
          ? `${group.jours[0]}-${group.jours[group.jours.length - 1]}`
          : group.jours[0];
        result.push(`${joursStr}: ${group.horaire}`);
      }
      tempGroup = { jours: [joursAbrev[jour]], horaire } as HoraireGroup;
    }
  });

  // 🔥 Et ici aussi !
  if (tempGroup) {
    const group = tempGroup as HoraireGroup;
    const joursStr = group.jours.length > 1 
      ? `${group.jours[0]}-${group.jours[group.jours.length - 1]}`
      : group.jours[0];
    result.push(`${joursStr}: ${group.horaire}`);
  }

  return result.join(', ');
};

  // ✅ Gérer le changement d'horaires
  const handleHoraireChange = (jour: string, field: 'debut' | 'fin' | 'ferme', value: string | boolean) => {
    const newHoraires = {
      ...horaires,
      [jour]: {
        ...horaires[jour as keyof typeof horaires],
        [field]: value
      }
    };
    
    setHoraires(newHoraires);
    
    const horaireString = generateHorairesString(newHoraires);
    
    const syntheticEvent = {
      target: {
        name: 'horaires',
        value: horaireString
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChange(syntheticEvent);
  };

  const joursAffiches = [
    { key: 'lundi', label: 'Lundi' },
    { key: 'mardi', label: 'Mardi' },
    { key: 'mercredi', label: 'Mercredi' },
    { key: 'jeudi', label: 'Jeudi' },
    { key: 'vendredi', label: 'Vendredi' },
    { key: 'samedi', label: 'Samedi' },
    { key: 'dimanche', label: 'Dimanche' }
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Informations du Garage</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom du Garage <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="garagenom"
            value={garageData.garagenom}
            onChange={onChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Garage Auto Plus"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Professionnel <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="emailProfessionnel"
            value={garageData.emailProfessionnel}
            onChange={onChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="contact@garage.tn"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Téléphone Professionnel <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="telephoneProfessionnel"
            value={garageData.telephoneProfessionnel}
            onChange={handlePhoneChange}
            required
            maxLength={10}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-colors
              ${phoneError ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}
            `}
            placeholder="20 123 456"
          />
          {phoneError && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <span>⚠️</span> {phoneError}
            </p>
          )}
          <p className="text-gray-500 text-xs mt-1">Format: 8 chiffres (ex: 20 123 456)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Matricule Fiscal <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="matriculefiscal"
            value={garageData.matriculefiscal}
            onChange={onChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="1234567/A/M/000"
          />
        </div>

        {/* ✅ SÉLECTEUR GOUVERNORAT */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gouvernorat <span className="text-red-500">*</span>
          </label>
          <select
            value={governorateId}
            onChange={handleGovernorateChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Sélectionner un gouvernorat</option>
            {governoratesList.map((g: any) => (
              <option key={g._id} value={g._id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* ✅ SÉLECTEUR VILLE */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ville <span className="text-red-500">*</span>
          </label>
          <select
            value={cityId}
            onChange={handleCityChange}
            required
            disabled={!governorateId}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Choisir une ville</option>
            {citiesList.map((c: any) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          {!governorateId && (
            <p className="text-gray-500 text-xs mt-1">Sélectionnez d'abord un gouvernorat</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Adresse / Rue
          </label>
          <input
            type="text"
            name="streetAddress"
            value={garageData.streetAddress}
            onChange={onChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: Avenue Habib Bourguiba, Khezema..."
          />
          <p className="text-gray-500 text-xs mt-1">
            💡 Plus c'est précis, plus la localisation sera exacte
          </p>
        </div>

        {/* ✅ APERÇU LOCALISATION */}
        {mechanicLocation && (
          <div className="md:col-span-2 border-2 border-blue-300 rounded-lg p-5 bg-blue-50">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">📍 Localisation de votre garage</h3>
            </div>
            
            <div className="bg-white rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Coordonnées GPS:</strong> {mechanicLocation[0].toFixed(6)}, {mechanicLocation[1].toFixed(6)}
              </p>
              <div className="text-xs text-gray-600 space-y-1">
                <p>• Sélectionnez d'abord votre gouvernorat et ville</p>
                <p>• Entrez votre adresse pour une localisation automatique</p>
                <p>• Ajustez manuellement le marqueur sur la carte si nécessaire</p>
                <p>• Cette position sera visible par vos clients</p>
              </div>
            </div>

            {/* 🗺️ CARTE INTERACTIVE */}
            <div className="rounded-lg overflow-hidden shadow-lg">
              <MapView 
                location={mechanicLocation}
                setLocation={(newLocation: [number, number]) => {
                  console.log('📍 Position manuelle définie:', newLocation);
                  setMechanicLocation(newLocation);
                  setManualLocationSet(true); // 🔥 Marquer que la position a été définie manuellement
                  if (onLocationChange) onLocationChange(newLocation);
                }}
              />
            </div>

            {/* 🔥 Bouton pour réactiver le géocodage automatique */}
            {manualLocationSet && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-800 text-sm">
                    📌 Position définie manuellement
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setManualLocationSet(false);
                    console.log('🔄 Géocodage automatique réactivé');
                  }}
                  className="text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transition-colors"
                >
                  Réactiver géocodage auto
                </button>
              </div>
            )}
          </div>
        )}

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            name="description"
            value={garageData.description}
            onChange={onChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Garage spécialisé dans la réparation et l'entretien automobile..."
          />
        </div>

        {/* ✅ SECTION HORAIRES */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            Horaires d'ouverture
          </label>
          
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            {joursAffiches.map(({ key, label }) => {
              const h = horaires[key as keyof typeof horaires];
              return (
                <div key={key} className="flex items-center gap-4 bg-white p-3 rounded-lg">
                  <div className="w-24 font-medium text-gray-700">{label}</div>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={h.ferme}
                      onChange={(e) => handleHoraireChange(key, 'ferme', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Fermé</span>
                  </label>

                  {!h.ferme && (
                    <>
                      <input
                        type="time"
                        value={h.debut}
                        onChange={(e) => handleHoraireChange(key, 'debut', e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <span className="text-gray-500">à</span>
                      <input
                        type="time"
                        value={h.fin}
                        onChange={(e) => handleHoraireChange(key, 'fin', e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {garageData.horaires && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Aperçu:</strong> {garageData.horaires}
              </p>
            </div>
          )}
        </div>

      </div>

      <div className="flex gap-4 pt-6 border-t">
        <button
          type="submit"
          disabled={loading || !!phoneError}
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Création en cours...
            </>
          ) : (
            <>
              Créer le Garage
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
