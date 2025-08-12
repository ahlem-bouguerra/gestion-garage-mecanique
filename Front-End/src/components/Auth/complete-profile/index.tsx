// CompleteProfile.tsx (version corrigée)
"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { toast } from 'sonner'

const Map = dynamic(() => import("../../MapComponent"), { ssr: false });

export default function CompleteProfile() {
  const router = useRouter();
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
      
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/sign-in");
        return;
      }

      try {
        const response = await axios.get("http://localhost:5000/api/get-profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const user = response.data;
        console.log("Profil récupéré :", user);
        
        setUsername(user.username || "");
        setEmail(user.email || "");
        setPhone(user.phone || "");
        setCity(user.city || "");
        
        if (user.location && Array.isArray(user.location) && user.location.length === 2) {
          setLocation(user.location);
        } else {
          setLocation([36.8065, 10.1815]);
        }
        
      } catch (err: any) {
        console.error("Erreur récupération profil", err.response?.data || err.message);
        
        // Si le token est invalide, rediriger vers login
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
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
  }, [router]);

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

    const finalLocation = location || [36.8065, 10.1815];
    const loadingToast = toast.loading('Mise à jour du profil...');

    try {
      const response = await axios.post(
        "http://localhost:5000/api/complete-profile",
        { 
          username, 
          email, 
          phone, 
          city, 
          location: finalLocation 
        },
        {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` }
        }
      );
        // Remplacer le toast de loading par un toast de succès
      toast.success('Succès!', {
  position: 'top-center',
  duration: 4000,
});
      setMessage("Profil mis à jour avec succès  🎉");
      setError("");
    } catch (err: any) {
      console.error("Erreur de mise à jour", err.response?.data || err.message);
      
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        router.push("/auth/sign-in");
        return;
      }
      
      setError(err.response?.data?.message || "Erreur lors de la mise à jour");
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
        minHeight: '400px' 
      }}>
        <div>Chargement...</div>
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
      {/* Le reste du composant reste identique */}
      <h1 style={{ textAlign: 'center', marginBottom: 30, color: '#333' }}>
        Compléter votre profil
      </h1>
      
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
                padding: 10, 
                border: '1px solid #ddd', 
                borderRadius: 4,
                fontSize: 14
              }}
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
                padding: 10, 
                backgroundColor: '#f5f5f5',
                border: '1px solid #ddd', 
                borderRadius: 4,
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
              placeholder="Votre numéro de téléphone" 
              required 
              style={{ 
                width: '100%', 
                padding: 10, 
                border: '1px solid #ddd', 
                borderRadius: 4,
                fontSize: 14
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
              Ville *
            </label>
            <input 
              value={city} 
              onChange={e => setCity(e.target.value)} 
              placeholder="Votre ville" 
              required 
              style={{ 
                width: '100%', 
                padding: 10, 
                border: '1px solid #ddd', 
                borderRadius: 4,
                fontSize: 14
              }}
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
            <h2 style={{ marginTop: 0, marginBottom: 15, color: '#1976d2' }}>
              📍 Localisation précise
            </h2>
            <Map location={location} setLocation={setLocation} />
          </div>
        )}

        <button 
          type="submit" 
          disabled={isLoading}
          style={{ 
            padding: '12px 24px', 
            backgroundColor: isLoading ? '#ccc' : '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontSize: 16,
            fontWeight: 'bold',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            marginTop: 20,
            transition: 'background-color 0.3s'
          }}
        >
          {isLoading ? "⏳ Enregistrement..." : "💾 Enregistrer le profil"}
        </button>
      </form>
      
      {message && (
        <div style={{ 
          marginTop: 20,
          padding: 15, 
          color: "#2e7d32",
          backgroundColor: '#e8f5e8',
          border: '1px solid #4caf50',
          borderRadius: 4,
          textAlign: 'center',
          fontWeight: 'bold'
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
          border: '1px solid #f44336',
          borderRadius: 4,
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}