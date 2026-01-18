"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Connexion en cours...");

  useEffect(() => {
    const token = searchParams.get("token");
    const userEncoded = searchParams.get("user");

    if (!token || !userEncoded) {
      router.push("/auth/sign-in?error=missing_data");
      return;
    }

    try {
      // Décoder les données
      const userDataString = Buffer.from(decodeURIComponent(userEncoded), 'base64').toString('utf-8');
      const userData = JSON.parse(userDataString);

      // Sauvegarder
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      Cookies.set("token", token, { expires: 7 });

      console.log("Données sauvegardées:", { token: token.substring(0, 20), userData });

      setStatus("Redirection...");
      
      setTimeout(() => {
        router.push("/chercher-garage");
      }, 1000);

    } catch (error) {
      console.error("Erreur:", error);
      router.push("/auth/sign-in?error=processing_failed");
    }
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-900 via-red-900 to-pink-900">
      <div className="text-center p-8 bg-white/10 backdrop-blur-lg rounded-2xl">
        <h2 className="text-2xl font-bold text-white mb-3">Connexion Google</h2>
        <p className="text-orange-200">{status}</p>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-900 via-red-900 to-pink-900">
        <div className="text-center p-8 bg-white/10 backdrop-blur-lg rounded-2xl">
          <h2 className="text-2xl font-bold text-white mb-3">Connexion Google</h2>
          <p className="text-orange-200">Chargement...</p>
        </div>
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  );
}