// CompleteProfile.tsx - Version optimisée
"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from 'sonner';
import Cookies from "js-cookie";

// Import dynamique du MapComponent
const MapComponent = dynamic(() => import("../../MapComponent"), {
  ssr: false,
  loading: () => <p>Chargement de la carte...</p>
});

export default function CompleteProfile() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [governorateId, setGovernorateId] = useState("");
  const [cityId, setCityId] = useState("");
  const [streetAddress, setStreetAddress] = useState(""); // ✅ Changé en texte libre
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const [governoratesList, setGovernoratesList] = useState<any[]>([]);
  const [citiesList, setCitiesList] = useState<any[]>([]);
  
  // ✅ Position précise du mécanicien (coordinates GPS)
  const [mechanicLocation, setMechanicLocation] = useState<[number, number] | null>(null);
  const [cityBaseLocation, setCityBaseLocation] = useState<[number, number] | null>(null);

  // --- Récupération profil et token ---
  useEffect(() => {
    const fetchProfile = async () => {
      if (typeof window === 'undefined') return;
      let token = searchParams.get('token') || localStorage.getItem("token");
      if (!token) {
        router.push("/auth/sign-in");
        return;
      }
      if (searchParams.get('token')) {
        localStorage.setItem("token", token);
        Cookies.set("token", token, { expires: 7, path: "/" });
        const url = new URL(window.location.href);
        url.searchParams.delete('token');
        url.searchParams.delete('google_success');
        window.history.replaceState({}, '', url.toString());
        if (searchParams.get('google_success') === 'true') {
          toast.success("Connexion Google réussie ! Veuillez compléter votre profil.");
        }
      }

      try {
        const response = await axios.get("http://localhost:5000/api/get-profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = response.data;
        setUsername(user.username || "");
        setEmail(user.email || "");
        setPhone(user.phone || "");
        setGovernorateId(user.governorateId || "");
        setCityId(user.cityId || "");
        setStreetAddress(user.streetAddress || ""); // ✅ Récupérer l'adresse texte
        
        // ✅ Récupérer la position précise existante
        if (user.location?.coordinates) {
          setMechanicLocation([user.location.coordinates[1], user.location.coordinates[0]]);
        }
      } catch (err: any) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          Cookies.remove("token");
          router.push("/auth/sign-in");
        } else {
          setError("Erreur lors du chargement du profil");
        }
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchProfile();
  }, [router, searchParams]);

  // --- Récupération Gouvernorats ---
  useEffect(() => {
    const fetchGovernorate = async () => {
      try {
        const govRes = await axios.get("http://localhost:5000/api/governorates");
        setGovernoratesList(govRes.data);
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
        const cityRes = await axios.get(`http://localhost:5000/api/cities/${governorateId}`);
        setCitiesList(cityRes.data);
      } catch (err) {
        console.error("❌ Erreur villes:", err);
      }
    };
    fetchCities();
  }, [governorateId]);

  // ✅ Géocodage automatique quand ville + adresse changent
  useEffect(() => {
    const geocodeAddress = async () => {
      if (!cityId || !streetAddress.trim()) return;

      const selectedCity = citiesList.find((c: any) => c._id === cityId);
      if (!selectedCity) return;

      const fullAddress = `${streetAddress}, ${selectedCity.name}, Tunisia`;
      
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(fullAddress)}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.length > 0) {
          const newLocation: [number, number] = [
            parseFloat(data[0].lat),
            parseFloat(data[0].lon)
          ];
          setMechanicLocation(newLocation);
          toast.success("Position trouvée automatiquement ! Vérifiez sur la carte.");
        } else {
          // Fallback sur la position de la ville
          if (selectedCity.location?.coordinates) {
            const cityCoords: [number, number] = [
              selectedCity.location.coordinates[1],
              selectedCity.location.coordinates[0]
            ];
            setMechanicLocation(cityCoords);
            setCityBaseLocation(cityCoords);
            toast.info("Position centrée sur la ville. Ajustez manuellement sur la carte.");
          }
        }
      } catch (error) {
        console.error("Erreur géocodage:", error);
      }
    };

    // Délai pour éviter trop de requêtes
    const timer = setTimeout(geocodeAddress, 1000);
    return () => clearTimeout(timer);
  }, [cityId, streetAddress, citiesList]);

  // ✅ Handler pour changement de ville
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCityId = e.target.value;
    setCityId(selectedCityId);
    
    const selectedCity = citiesList.find((c: any) => c._id === selectedCityId);
    if (selectedCity?.location?.coordinates) {
      const cityCoords: [number, number] = [
        selectedCity.location.coordinates[1],
        selectedCity.location.coordinates[0]
      ];
      setCityBaseLocation(cityCoords);
      
      // Si pas d'adresse spécifique, centrer sur la ville
      if (!streetAddress.trim()) {
        setMechanicLocation(cityCoords);
      }
    }
  };

  // --- Soumission du formulaire ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/sign-in");
      return;
    }

    if (!username.trim() || !phone.trim() || !governorateId || !cityId) {
      setError("Veuillez remplir tous les champs obligatoires");
      setIsLoading(false);
      return;
    }

    if (!mechanicLocation) {
      setError("Veuillez définir votre position sur la carte");
      setIsLoading(false);
      return;
    }

    const loadingToast = toast.loading('Mise à jour du profil...');

    try {
      // ✅ Format GeoJSON pour MongoDB
      const locationData = {
        type: 'Point',
        coordinates: [mechanicLocation[1], mechanicLocation[0]] // [lng, lat] pour GeoJSON
      };

      await axios.post(
        "http://localhost:5000/api/complete-profile",
        {
          username: username.trim(),
          email,
          phone: phone.trim(),
          governorateId,
          cityId,
          streetAddress: streetAddress.trim(), // ✅ Adresse texte libre
          location: locationData // ✅ Position précise
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.dismiss(loadingToast);
      toast.success('Profil mis à jour avec succès ! 🎉');
      setMessage("Profil mis à jour avec succès ! Redirection...");
      setTimeout(() => router.push("/"), 2000);
    } catch (err: any) {
      toast.dismiss(loadingToast);
      setError(err.response?.data?.message || "Erreur lors de la mise à jour");
    } finally {
      setIsLoading(false);
    }
  };

  if (isPageLoading) return <div>Chargement du profil...</div>;

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 30 }}>🔧 Compléter votre profil de mécanicien</h1>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Informations personnelles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 15 }}>
          <div>
            <label>Nom d'utilisateur *</label>
            <input 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
              style={{ padding: 10, border: '1px solid #ddd', borderRadius: 4, width: '100%' }}
            />
          </div>

          <div>
            <label>Email</label>
            <input 
              value={email} 
              disabled 
              style={{ padding: 10, border: '1px solid #ddd', borderRadius: 4, width: '100%', backgroundColor: '#f5f5f5' }}
            />
          </div>

          <div>
            <label>Téléphone *</label>
            <input 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              required 
              style={{ padding: 10, border: '1px solid #ddd', borderRadius: 4, width: '100%' }}
            />
          </div>
        </div>

        {/* Localisation */}
        <div style={{ 
          border: '2px solid #2196f3', 
          borderRadius: 8, 
          padding: 20, 
          backgroundColor: '#f8f9ff' 
        }}>
          <h3>📍 Localisation de votre garage</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 15, marginBottom: 15 }}>
            <div>
              <label>Gouvernorat *</label>
              <select
                value={governorateId}
                onChange={e => setGovernorateId(e.target.value)}
                required
                style={{ padding: 10, border: '1px solid #ddd', borderRadius: 4, width: '100%' }}
              >
                <option value="">Sélectionner un gouvernorat</option>
                {governoratesList.map((g: any) => (
                  <option key={g._id} value={g._id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Ville *</label>
              <select
                value={cityId}
                onChange={handleCityChange}
                required
                style={{ padding: 10, border: '1px solid #ddd', borderRadius: 4, width: '100%' }}
              >
                <option value="">-- Choisir une ville --</option>
                {citiesList.map((c: any) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Adresse / Rue (optionnel)</label>
              <input
                type="text"
                value={streetAddress}
                onChange={e => setStreetAddress(e.target.value)}
                placeholder="Ex: Avenue Habib Bourguiba, Khezema..."
                style={{ padding: 10, border: '1px solid #ddd', borderRadius: 4, width: '100%' }}
              />
              <small style={{ color: '#666', fontSize: 12 }}>
                💡 Plus c'est précis, plus la localisation sera exacte
              </small>
            </div>
          </div>

          {/* Carte interactive */}
          {mechanicLocation && (
            <MapComponent 
              location={mechanicLocation}
              setLocation={setMechanicLocation}
            />
          )}
          
          <div style={{ 
            marginTop: 10, 
            padding: 10, 
            backgroundColor: '#e3f2fd', 
            borderRadius: 4, 
            fontSize: 13 
          }}>
            <strong>📌 Instructions :</strong> 
            <br />• Sélectionnez d'abord votre gouvernorat et ville
            <br />• Entrez votre adresse pour une localisation automatique
            <br />• Ajustez manuellement le marqueur sur la carte si nécessaire
            <br />• Cette position sera visible par vos clients
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          style={{
            padding: 15,
            backgroundColor: isLoading ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 'bold',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? "⏳ Enregistrement..." : "💾 Finaliser mon profil"}
        </button>
      </form>

      {message && (
        <div style={{ color: 'green', marginTop: 15, padding: 10, backgroundColor: '#e8f5e8', borderRadius: 4 }}>
          ✅ {message}
        </div>
      )}
      {error && (
        <div style={{ color: 'red', marginTop: 15, padding: 10, backgroundColor: '#ffeaea', borderRadius: 4 }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}