"use client";

import React, { useState } from "react";
import { EmailIcon } from "@/assets/icons";
import InputGroup from "../../FormElements/InputGroup";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(""); // Reset le message précédent

    try {
      const res = await fetch("http://localhost:5000/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      
      // Affiche toujours un message de succès pour des raisons de sécurité
      setMessage(data.message || "Si cet email est enregistré, un lien vous a été envoyé.");
      
    } catch (error) {
      console.error("Erreur lors de l'envoi:", error);
      setMessage("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
  <label className="text-orange-300">Email</label>
  <input
    type="email"
    name="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    placeholder="Entrez votre email"
    className="w-full text-white py-[15px] px-4 rounded-lg"
    required
  />
</div>
        
        {/* Affichage du message */}
        {message && (
          <div className="mb-4 p-3 rounded-lg bg-blue-100 border border-blue-300 text-blue-800">
            {message}
          </div>
        )}
        
        <div className="mb-4.5">
          <button
            type="submit"
            disabled={isLoading || !email.trim()} // Désactiver si en cours de chargement ou email vide
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Envoi en cours..." : "Continuer"}
          </button>
        </div>
      </form>
    </div>
  );
}