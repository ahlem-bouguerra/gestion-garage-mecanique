"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      toast.error("Erreur lors de la connexion Google");
      router.push("/auth/sign-in");
      return;
    }

    // Sauvegarde du token
    localStorage.setItem("token", token);
    Cookies.set("token", token, { expires: 7, path: "/" });

    // Récupération du profil
    axios.get("http://localhost:5000/api/get-profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => {
      const user = res.data;
      localStorage.setItem("user", JSON.stringify(user));
      const isComplete = user.username && user.phone && user.governorateId;

      if (isComplete) {
        router.push("/");
      } else {
        router.push("/auth/complete-profile");
      }
    })
    .catch(() => {
      toast.error("Impossible de récupérer le profil utilisateur");
      router.push("/auth/sign-in");
    });
  }, [router, searchParams]);

  return (
    <div className="text-center p-8 text-white">
      Connexion avec Google en cours...
    </div>
  );
}
