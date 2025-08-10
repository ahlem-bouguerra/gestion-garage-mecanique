'use client';

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Récupère email et token depuis l'URL
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token || !email) {
      setError("Lien invalide.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/reset-password", {
        email,
        token,
        newPassword,
      });

      setMessage(response.data.message);
      setError("");

      // Redirection après succès
      setTimeout(() => {
        router.push("auth/sign-in");
      }, 2000);
    } catch (err) {
      setError("Erreur lors de la réinitialisation");
    }
  };

  return (
    <div>
      <h1>Réinitialiser le mot de passe</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Nouveau mot de passe"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          required
        />
        <button type="submit">Réinitialiser</button>
      </form>
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
