// CompleteProfile.tsx (version corrigée pour Google OAuth)
"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from 'sonner';
import Cookies from "js-cookie";

const Map = dynamic(() => import("../../MapComponent"), { ssr: false });

export default function CompleteProfile() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [location, setLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      // Vérifier si on est côté client
      if (typeof window === 'undefined') return;
      
      // 🔥 CORRECTION : Récupérer le token depuis l'URL d'abord, puis localStorage
      let token = searchParams.get('token'); // Token depuis l'URL (Google OAuth)
      
      if (token) {
        console.log('🔗 Token reçu depuis URL (Google OAuth)');
        // Stocker le token pour la session
        localStorage.setItem("token", token);
        Cookies.set("token", token, { expires: 7, path: "/" });
        
        // Nettoyer l'URL après avoir récupéré le token
        const url = new URL(window.location.href);
        url.searchParams.delete('token');
        url.searchParams.delete('google_success');
        window.history.replaceState({}, '', url.toString());
        console.log('🧹 URL nettoyée');
        
        // Afficher message de succès Google si nécessaire
        const googleSuccess = searchParams.get('google_success');
        if (googleSuccess === 'true') {
          toast.success("Connexion Google réussie ! Veuillez compléter votre profil.");
        }
      } else {
        // Récupérer depuis localStorage si pas d'URL
        token = localStorage.getItem("token");
        console.log('💾 Token récupéré depuis localStorage');
      }

      // Si toujours pas de token, rediriger vers sign-in
      if (!token) {
        console.log('❌ Aucun token trouvé, redirection vers sign-in');
        router.push("/auth/sign-in");
        return;
      }

      try {
        console.log('👤 Récupération du profil utilisateur...');
        const response = await axios.get("http://localhost:5000/api/get-profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const user = response.data;
        console.log("✅ Profil récupéré :", user);

        setUsername(user.username || "");
        setEmail(user.email || "");
        setPhone(user.phone || "");
        setCity(user.city || "");
        
        // Gestion de la localisation
        if (user.location && Array.isArray(user.location.coordinates) && user.location.coordinates.length === 2) {
          // Vérifier si ce ne sont pas les coordonnées placeholder [0, 0]
          if (user.location.coordinates[0] !== 0 || user.location.coordinates[1] !== 0) {
            setLocation(user.location.coordinates as [number, number]);
            console.log('📍 Location existante:', user.location.coordinates);
          } else {
            // Coordonnées placeholder, utiliser Tunis par défaut
            setLocation([36.8065, 10.1815]);
            console.log('📍 Utilisation de la location par défaut (Tunis)');
          }
        } else {
          // Pas de location, utiliser Tunis par défaut
          setLocation([36.8065, 10.1815]);
          console.log('📍 Aucune location, utilisation de Tunis par défaut');
        }
        
      } catch (err: any) {
        console.error("❌ Erreur récupération profil", err.response?.data || err.message);
        
        // Si token invalide (401), nettoyer et rediriger
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          Cookies.remove("token");
          router.push("/auth/sign-in");
          return;
        }
        
        setError("Erreur lors du chargement du profil");
        setLocation([36.8065, 10.1815]);
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchProfile();
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");
    
    const token = localStorage.getItem("token");
    if (!token) {
      console.log('❌ Token manquant lors de la soumission');
      router.push("/auth/sign-in");
      return;
    }

    // Validation côté client
    if (!username.trim() || !phone.trim() || !city.trim()) {
      setError("Veuillez remplir tous les champs obligatoires");
      setIsLoading(false);
      return;
    }

    if (phone.trim().length < 8) {
      setError("Le numéro de téléphone doit contenir au moins 8 caractères");
      setIsLoading(false);
      return;
    }

    const finalLocation = location || [36.8065, 10.1815];
    const loadingToast = toast.loading('Mise à jour du profil...');

    console.log('📝 Soumission du profil:', {
      username: username.trim(),
      phone: phone.trim(),
      city: city.trim(),
      location: finalLocation
    });

    try {
      const response = await axios.post(
        "http://localhost:5000/api/complete-profile",
        { 
          username: username.trim(), 
          email, 
          phone: phone.trim(), 
          city: city.trim(), 
          location: finalLocation 
        },
        {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Succès
      toast.dismiss(loadingToast);
      toast.success('Profil mis à jour avec succès ! 🎉', {
        position: 'top-center',
        duration: 4000,
      });
      
      setMessage("Profil mis à jour avec succès ! Redirection en cours... 🎉");
      console.log('✅ Profil mis à jour, redirection vers accueil');
      
      // Redirection après un court délai pour que l'utilisateur voie le message
      setTimeout(() => {
        router.push("/");
      }, 2000);
      
      setError("");
    } catch (err: any) {
      console.error("❌ Erreur de mise à jour", err.response?.data || err.message);
      
      toast.dismiss(loadingToast);
      
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        Cookies.remove("token");
        router.push("/auth/sign-in");
        return;
      }
      
      const errorMessage = err.response?.data?.message || "Erreur lors de la mise à jour";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Afficher un loader pendant le chargement initial
  if (isPageLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        flexDirection: 'column',
        gap: 20
      }}>
        <div style={{ fontSize: 18 }}>Chargement du profil...</div>
        <div style={{ 
          width: 40, 
          height: 40, 
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #4caf50',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
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
    <div style={{ 
      padding: 20, 
      maxWidth: 800, 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        marginBottom: 30, 
        color: '#333',
        fontSize: 28,
        fontWeight: 'bold'
      }}>
        📝 Compléter votre profil
      </h1>

      <div style={{
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#e3f2fd',
        borderRadius: 8,
        textAlign: 'center',
        color: '#1976d2'
      }}>
        ℹ️ Veuillez compléter ces informations pour finaliser votre inscription
      </div>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 15 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
              Nom d'utilisateur *
            </label>
            <input 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              placeholder="Votre nom d'utilisateur" 
              required 
              style={{ 
                width: '100%', 
                padding: 12, 
                border: '2px solid #ddd', 
                borderRadius: 6,
                fontSize: 14,
                transition: 'border-color 0.3s'
              }}
              onFocus={e => e.target.style.borderColor = '#4caf50'}
              onBlur={e => e.target.style.borderColor = '#ddd'}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
              Email
            </label>
            <input 
              value={email} 
              disabled 
              style={{ 
                width: '100%', 
                padding: 12, 
                backgroundColor: '#f5f5f5',
                border: '2px solid #ddd', 
                borderRadius: 6,
                fontSize: 14,
                color: '#666'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
              Téléphone *
            </label>
            <input 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              placeholder="Ex: +216 12 345 678" 
              required 
              style={{ 
                width: '100%', 
                padding: 12, 
                border: '2px solid #ddd', 
                borderRadius: 6,
                fontSize: 14,
                transition: 'border-color 0.3s'
              }}
              onFocus={e => e.target.style.borderColor = '#4caf50'}
              onBlur={e => e.target.style.borderColor = '#ddd'}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
              Ville *
            </label>
            <input 
              value={city} 
              onChange={e => setCity(e.target.value)} 
              placeholder="Ex: Tunis, Sfax, Sousse..." 
              required 
              style={{ 
                width: '100%', 
                padding: 12, 
                border: '2px solid #ddd', 
                borderRadius: 6,
                fontSize: 14,
                transition: 'border-color 0.3s'
              }}
              onFocus={e => e.target.style.borderColor = '#4caf50'}
              onBlur={e => e.target.style.borderColor = '#ddd'}
            />
          </div>
        </div>

        {location && (
          <div style={{ 
            marginTop: 20,
            padding: 20,
            border: '2px solid #e3f2fd',
            borderRadius: 8,
            backgroundColor: '#fafafa'
          }}>
            <h2 style={{ 
              marginTop: 0, 
              marginBottom: 15, 
              color: '#1976d2',
              fontSize: 20
            }}>
              📍 Votre localisation précise
            </h2>
            <p style={{ marginBottom: 15, color: '#666', fontSize: 14 }}>
              Ajustez votre position sur la carte pour une localisation précise
            </p>
            <Map location={location} setLocation={setLocation} />
          </div>
        )}

        <button 
          type="submit" 
          disabled={isLoading}
          style={{ 
            padding: '15px 24px', 
            backgroundColor: isLoading ? '#ccc' : '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 'bold',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            marginTop: 20,
            transition: 'all 0.3s',
            transform: isLoading ? 'scale(0.98)' : 'scale(1)'
          }}
        >
          {isLoading ? "⏳ Enregistrement en cours..." : "💾 Finaliser mon profil"}
        </button>
      </form>
      
      {message && (
        <div style={{ 
          marginTop: 20,
          padding: 15, 
          color: "#2e7d32",
          backgroundColor: '#e8f5e8',
          border: '2px solid #4caf50',
          borderRadius: 8,
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: 16
        }}>
          {message}
        </div>
      )}
      
      {error && (
        <div style={{ 
          marginTop: 20,
          padding: 15, 
          color: "#c62828",
          backgroundColor: '#ffebee',
          border: '2px solid #f44336',
          borderRadius: 8,
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: 16
        }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}