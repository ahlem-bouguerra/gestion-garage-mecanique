// CompleteProfile.tsx - Version corrigée pour Google OAuth
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
  const [garagenom, setGaragenom] = useState("");
  const [matriculefiscal, setMatriculefiscal] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [governorateId, setGovernorateId] = useState("");
  const [cityId, setCityId] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const [governoratesList, setGovernoratesList] = useState<any[]>([]);
  const [citiesList, setCitiesList] = useState<any[]>([]);
  
  const [mechanicLocation, setMechanicLocation] = useState<[number, number] | null>(null);
  const [cityBaseLocation, setCityBaseLocation] = useState<[number, number] | null>(null);

  // 🔧 FONCTION AMÉLIORÉE POUR RÉCUPÉRER LE TOKEN
  const getToken = () => {
    // Vérifier d'abord les URL params (Google callback)
    const urlToken = searchParams.get('token');
    if (urlToken) {
      console.log('🔐 Token trouvé dans URL params');
      return urlToken;
    }

    // Ensuite localStorage
    const localToken = localStorage.getItem("token");
    if (localToken) {
      console.log('🔐 Token trouvé dans localStorage');
      return localToken;
    }

    // Enfin cookies
    const cookieToken = Cookies.get("token");
    if (cookieToken) {
      console.log('🔐 Token trouvé dans cookies');
      return cookieToken;
    }

    console.log('❌ Aucun token trouvé');
    return null;
  };

  // 🔧 FONCTION POUR ATTENDRE LE TOKEN (retry logic)
  const waitForToken = async (maxAttempts = 10, delay = 500): Promise<string | null> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`🔍 Tentative ${attempt}/${maxAttempts} de récupération du token`);
      
      const token = getToken();
      if (token) {
        console.log('✅ Token trouvé !');
        return token;
      }

      if (attempt < maxAttempts) {
        console.log(`⏳ Attente ${delay}ms avant nouvelle tentative...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    console.log('❌ Token non trouvé après toutes les tentatives');
    return null;
  };

  // --- Récupération profil et token (VERSION CORRIGÉE) ---
  useEffect(() => {
    const fetchProfile = async () => {
      console.log('🚀 CompleteProfile - Démarrage fetchProfile');
      
      if (typeof window === 'undefined') {
        console.log('❌ Window undefined, retour');
        return;
      }

      try {
        // 🔧 ATTENDRE LE TOKEN avec retry logic
        const token = await waitForToken();
        
        if (!token) {
          console.log('❌ Aucun token après attente - Redirection vers sign-in');
          toast.error("Session expirée, veuillez vous reconnecter");
          router.push("/auth/sign-in");
          return;
        }

        // 🔧 SAUVEGARDER LE TOKEN si trouvé dans les params
        if (searchParams.get('token')) {
          console.log('💾 Sauvegarde du token depuis URL params');
          localStorage.setItem("token", token);
          Cookies.set("token", token, { expires: 7, path: "/" });
          
          // Nettoyer l'URL
          const url = new URL(window.location.href);
          url.searchParams.delete('token');
          url.searchParams.delete('google_success');
          window.history.replaceState({}, '', url.toString());
          
          if (searchParams.get('google_success') === 'true') {
            toast.success("Connexion Google réussie ! Veuillez compléter votre profil.");
          }
        }

        console.log('📡 Appel API get-profile avec token');
        const response = await axios.get("http://localhost:5000/api/get-profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const user = response.data;
        console.log('👤 Profil utilisateur récupéré:', user);

        setUsername(user.username || "");
        setGaragenom(user.garagenom || "");
        setMatriculefiscal(user.matriculefiscal || "");
        setEmail(user.email || "");
        setPhone(user.phone || "");
        setGovernorateId(user.governorateId || "");  // ✅ Maintenant c'est l'ObjectId
        setCityId(user.cityId || "");  
        setStreetAddress(user.streetAddress || "");
        
        
        // Récupérer la position précise existante
        if (user.location?.coordinates) {
          setMechanicLocation([user.location.coordinates[1], user.location.coordinates[0]]);
        }

        console.log('✅ Profil chargé avec succès');

      } catch (err: any) {
        console.error('❌ Erreur fetchProfile:', err);
        
        if (err.response?.status === 401) {
          console.log('❌ Token invalide - Nettoyage et redirection');
          localStorage.removeItem("token");
          Cookies.remove("token");
          toast.error("Session expirée, veuillez vous reconnecter");
          router.push("/auth/sign-in");
        } else {
          console.error('❌ Erreur serveur:', err.response?.data);
          setError("Erreur lors du chargement du profil: " + (err.response?.data?.message || err.message));
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
        console.log('📍 Chargement des gouvernorats...');
        const govRes = await axios.get("http://localhost:5000/api/governorates");
        setGovernoratesList(govRes.data);
        console.log('✅ Gouvernorats chargés:', govRes.data.length);
      } catch (err) {
        console.error("❌ Erreur gouvernorats:", err);
        toast.error("Erreur lors du chargement des gouvernorats");
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
        const cityRes = await axios.get(`http://localhost:5000/api/cities/${governorateId}`);
        setCitiesList(cityRes.data);
        console.log('✅ Villes chargées:', cityRes.data.length);
      } catch (err) {
        console.error("❌ Erreur villes:", err);
        toast.error("Erreur lors du chargement des villes");
      }
    };
    fetchCities();
  }, [governorateId]);

  // Géocodage automatique quand ville + adresse changent
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

    const timer = setTimeout(geocodeAddress, 1000);
    return () => clearTimeout(timer);
  }, [cityId, streetAddress, citiesList]);

  // Handler pour changement de ville
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

    const token = getToken();
    if (!token) {
      toast.error("Token manquant, veuillez vous reconnecter");
      router.push("/auth/sign-in");
      return;
    }

    if (!username.trim() ||!garagenom.trim()|| !matriculefiscal.trim() || !phone.trim() || !governorateId || !cityId) {
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
    const selectedGovernorate = governoratesList.find(g => g._id === governorateId);
    const selectedCity = citiesList.find(c => c._id === cityId);

    try {
      // Format GeoJSON pour MongoDB
      const locationData = {
        type: 'Point',
        coordinates: [mechanicLocation[1], mechanicLocation[0]] // [lng, lat] pour GeoJSON
      };

      await axios.post(
        "http://localhost:5000/api/complete-profile",
        {
          username: username.trim(),
          garagenom: garagenom.trim(),
          matriculefiscal: matriculefiscal.trim(),
          email,
          phone: phone.trim(),
          governorateId,
          cityId,
          streetAddress: streetAddress.trim(),
          location: locationData,
          governorateName: selectedGovernorate?.name || "",
          cityName: selectedCity?.name || "",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.dismiss(loadingToast);
      toast.success('Profil mis à jour avec succès ! 🎉');
      setMessage("Profil mis à jour avec succès ! Redirection...");
      setTimeout(() => router.push("/"), 2000);
    } catch (err: any) {
      toast.dismiss(loadingToast);
      console.error('❌ Erreur soumission:', err);
      setError(err.response?.data?.message || "Erreur lors de la mise à jour");
    } finally {
      setIsLoading(false);
    }
  };

  // 🔧 AMÉLIORATION DE L'AFFICHAGE DE CHARGEMENT
  if (isPageLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          width: 50,
          height: 50,
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: 20
        }}></div>
        <h3>🔄 Chargement du profil...</h3>
        <p style={{ color: '#666' }}>Vérification de votre session en cours...</p>
        
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

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
            <label>Nom de garage *</label>
            <input 
              value={garagenom} 
              onChange={e => setGaragenom(e.target.value)} 
              required 
              style={{ padding: 10, border: '1px solid #ddd', borderRadius: 4, width: '100%' }}
            />
          </div>
          <div>
            <label>Matricule Fiscale *</label>
            <input 
              value={matriculefiscal} 
              onChange={e => setMatriculefiscal(e.target.value)} 
              disabled
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