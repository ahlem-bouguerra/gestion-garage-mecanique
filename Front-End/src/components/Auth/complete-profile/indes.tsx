"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import dynamic from "next/dynamic";

// Import dynamique pour éviter problème SSR avec Leaflet
const Map = dynamic(() => import("../../MapComponent"), { ssr: false });

export default function CompleteProfile() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [role, setRole] = useState("client");
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [message, setMessage] = useState("");

useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) return;  // pas de token, pas la peine de faire la requête

  axios.get("http://localhost:5000/api/get-profile", {
    headers: {
      Authorization: `Bearer ${token}`,  // <- envoi du token dans le header
    },
  })
  .then(res => {
    const user = res.data;
    setUsername(user.username ?? "") ;
    setEmail(user.email ?? "");
    setPhone(user.phone ?? "" );
    setCity(user.city ?? "");
    if (user.location) setLocation(user.location);
  })
  .catch(err => {
    console.error("Erreur récupération profil", err.response?.data || err.message);
  });
}, []);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    axios.post("http://localhost:5000/api/complete-profile", {
      username, phone, city, role, location
    }, { withCredentials: true })
      .then(res => setMessage(res.data.message))
      .catch(err => {
    console.error("Erreur de mettre a jour", err.response?.data || err.message);
  });
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Compléter votre profil</h1>
      <form onSubmit={handleSubmit}>
        <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Nom d'utilisateur" required />
        <input value={email} disabled />
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Téléphone" required />
        <input value={city} onChange={e => setCity(e.target.value)} placeholder="Ville" required />


        <Map location={location} setLocation={setLocation} />

        <button type="submit">Enregistrer</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
