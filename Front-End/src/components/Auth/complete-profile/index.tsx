"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from 'sonner';
import Cookies from "js-cookie";

export default function CompleteProfile() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [governorateId, setGovernorateId] = useState("");  // ✅ Corrigé
  const [cityId, setCityId] = useState("");                // ✅ Corrigé
  const [streetId, setStreetId] = useState("");            // ✅ Corrigé
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const [governoratesList, setGovernoratesList] = useState<string[]>([]);
  const [citiesList, setCitiesList] = useState<string[]>([]);
  const [streetsList, setStreetsList] = useState<string[]>([]);
  const [cityLocation, setCityLocation] = useState(null);  // ✅ Location de la ville sélectionnée

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
        if (searchParams.get('google_success') === 'true') toast.success("Connexion Google réussie ! Veuillez compléter votre profil.");
      }

      try {
        const response = await axios.get("http://localhost:5000/api/get-profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = response.data;
        setUsername(user.username || "");
        setEmail(user.email || "");
        setPhone(user.phone || "");
        setGovernorateId(user.governorateId || "");  // ✅ Corrigé
        setCityId(user.cityId || "");                // ✅ Corrigé
        setStreetId(user.streetId || "");            // ✅ Corrigé
        setCityLocation(user.location || null);      // ✅ Location existante
      } catch (err: any) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          Cookies.remove("token");
          router.push("/auth/sign-in");
        } else setError("Erreur lors du chargement du profil");
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
        console.log("✅ Gouvernorats reçus:", govRes.data);
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
        console.log("✅ Villes reçues:", cityRes.data);
        setCitiesList(cityRes.data);
      } catch (err) {
        console.error("❌ Erreur villes:", err);
      }
    };
    fetchCities();
  }, [governorateId]);

  // --- Récupération Rues selon ville ---
  useEffect(() => {
    const fetchStreets = async () => {
      if (!cityId) {
        setStreetsList([]);
        return;
      }
      try {
        const streetRes = await axios.get(`http://localhost:5000/api/streets/${cityId}`);
        console.log("✅ Rues reçues:", streetRes.data);
        setStreetsList(streetRes.data);
      } catch (err) {
        console.error("❌ Erreur rues:", err);
      }
    };
    fetchStreets();
  }, [cityId]);

  // ✅ Handler pour changement de ville (récupère la location)
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCityId = e.target.value;
    setCityId(selectedCityId);
    
    // Trouver la ville sélectionnée et récupérer sa location
    const selectedCityObj = citiesList.find((c: any) => c._id === selectedCityId);
    
    if (selectedCityObj?.location?.coordinates) {
      setCityLocation({
        type: 'Point',
        coordinates: selectedCityObj.location.coordinates
      });
      console.log("📍 Location de la ville sélectionnée:", selectedCityObj.location);
    } else {
      setCityLocation(null);
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

    if (!cityLocation) {
      setError("Aucune localisation trouvée pour cette ville");
      setIsLoading(false);
      return;
    }

    const loadingToast = toast.loading('Mise à jour du profil...');

    try {
      await axios.post(
        "http://localhost:5000/api/complete-profile",
        {
          username: username.trim(),
          email,
          phone: phone.trim(),
          governorateId,     // ✅ Corrigé: envoie l'ID
          cityId,           // ✅ Corrigé: envoie l'ID
          streetId,         // ✅ Corrigé: envoie l'ID
          location: cityLocation // ✅ Location de la ville sélectionnée
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
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 30 }}>📝 Compléter votre profil</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 15 }}>
          <div>
            <label>Nom d'utilisateur *</label>
            <input value={username} onChange={e => setUsername(e.target.value)} required />
          </div>

          <div>
            <label>Email</label>
            <input value={email} disabled />
          </div>

          <div>
            <label>Téléphone *</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} required />
          </div>

          <div>
            <label>Gouvernorat *</label>
            <select
              value={governorateId}                           // ✅ Corrigé
              onChange={e => setGovernorateId(e.target.value)} // ✅ Corrigé
              required
            >
              <option value="">Sélectionner un gouvernorat</option>
              {governoratesList.map((g: { _id: string; name: string }) => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Ville *</label>
            <select
              value={cityId}        // ✅ Corrigé: value binding
              onChange={handleCityChange}
              required
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
            <label>Rue (optionnel)</label>
            <select
              value={streetId}                          // ✅ Corrigé
              onChange={e => setStreetId(e.target.value)} // ✅ Corrigé
              disabled={!cityId}
            >
              <option value="">-- Pas de rue spécifique --</option>
              {streetsList.map((s: { _id: string; name: string }) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ✅ Debug info */}
        {cityLocation && (
          <div style={{ padding: 10, backgroundColor: '#f0f8ff', borderRadius: 5 }}>
            📍 <strong>Localisation de la ville :</strong> {cityLocation.coordinates.join(', ')}
          </div>
        )}

        <button type="submit" disabled={isLoading}>
          {isLoading ? "⏳ Enregistrement..." : "💾 Finaliser mon profil"}
        </button>
      </form>

      {message && <div style={{ color: 'green' }}>✅ {message}</div>}
      {error && <div style={{ color: 'red' }}>⚠️ {error}</div>}
    </div>
  );
}