"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import axios from "axios";
import Cookies from "js-cookie";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("processing"); // processing, success, error
  const [message, setMessage] = useState("Finalisation de votre authentification Google...");

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        const token = searchParams.get('token');
        const googleSuccess = searchParams.get('google_success');
        const error = searchParams.get('error');

        console.log('🔍 Google Callback - Params:', { token: token ? 'présent' : 'absent', googleSuccess, error });

        // Gestion des erreurs
        if (error) {
          setStatus("error");
          let errorMessage = "Erreur de connexion Google";
          
          switch (error) {
            case 'google_auth_failed':
              errorMessage = "Échec de l'authentification Google";
              setMessage("L'authentification avec Google a échoué. Veuillez réessayer.");
              break;
            case 'no_user':
              errorMessage = "Utilisateur non trouvé";
              setMessage("Impossible de récupérer vos informations Google.");
              break;
            case 'callback_error':
              errorMessage = "Erreur lors du traitement de la connexion";
              setMessage("Une erreur technique s'est produite.");
              break;
            default:
              errorMessage = `Erreur: ${error}`;
              setMessage("Une erreur inattendue s'est produite.");
          }
          
          toast.error(errorMessage);
          console.error('❌ Erreur Google OAuth:', error);
          
          // Redirection vers login après 3 secondes
          setTimeout(() => {
            router.push("/auth/sign-in");
          }, 3000);
          return;
        }

        // Traitement du succès
        if (token && googleSuccess === 'true') {
          console.log('✅ Token Google reçu');
          setMessage("Récupération de votre profil...");

          // Stocker le token immédiatement
          localStorage.setItem("token", token);
          Cookies.set("token", token, { expires: 7, path: "/" });
          console.log('💾 Token stocké');

          // Récupérer le profil utilisateur
          const response = await axios.get("http://localhost:5000/api/get-profile", {
            headers: { Authorization: `Bearer ${token}` },
          });

          const user = response.data;
          localStorage.setItem("user", JSON.stringify(user));
          console.log('👤 Profil utilisateur récupéré:', user.email);

          setStatus("success");
          setMessage("Connexion réussie ! Redirection en cours...");
          

          // Vérification complétude du profil
          const hasUsername = user.username && 
                             user.username.trim() !== "" && 
                             user.username.trim() !== "undefined";

          const hasPhone = user.phone && 
                          user.phone.trim() !== "" && 
                          user.phone.trim() !== "undefined" &&
                          user.phone.length >= 8;

          const hasCity = user.city && 
                         user.city.trim() !== "" && 
                         user.city.trim() !== "undefined" &&
                         user.city.length >= 2;

          const hasValidLocation = user.location && 
                                  Array.isArray(user.location.coordinates) &&
                                  user.location.coordinates.length === 2 &&
                                  !(user.location.coordinates[0] === 0 && user.location.coordinates[1] === 0) &&
                                  user.location.coordinates[0] !== null &&
                                  user.location.coordinates[1] !== null;

          const isComplete = hasUsername && hasPhone && hasCity && hasValidLocation;

          console.log('🔍 Vérification profil:', {
            hasUsername,
            hasPhone,
            hasCity,
            hasValidLocation,
            isComplete
          });

          // Redirection après animation de succès
          setTimeout(() => {
            if (isComplete) {
              console.log('➡️ Profil complet - Redirection vers accueil');
              router.push("/");
            } else {
              console.log('➡️ Profil incomplet - Redirection vers complétion');
              router.push("/auth/complete-profile");
            }
          }, 2000); // Délai de 2s pour voir l'animation de succès

        } else {
          // Paramètres manquants ou invalides
          setStatus("error");
          setMessage("Paramètres de connexion invalides.");
          toast.error("Erreur: paramètres de callback invalides");
          console.error('❌ Paramètres callback invalides');
          
          setTimeout(() => {
            router.push("/auth/sign-in");
          }, 3000);
        }

      } catch (err) {
        console.error("❌ Erreur lors du traitement callback:", err);
        setStatus("error");
        setMessage("Une erreur technique s'est produite lors de la connexion.");
        
        // Afficher message d'erreur détaillé
        if (err.response?.status === 401) {
          toast.error("Token d'authentification invalide");
        } else if (err.response?.status === 404) {
          toast.error("Profil utilisateur non trouvé");
        } else {
          toast.error("Erreur lors de la récupération du profil");
        }
        
        // Nettoyer le storage en cas d'erreur
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        Cookies.remove("token");
        
        // Redirection vers login après délai
        setTimeout(() => {
          router.push("/auth/sign-in");
        }, 3000);
      }
    };

    // Démarrer le traitement
    handleGoogleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-900 via-blue-900 to-pink-900 p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md w-full shadow-2xl border border-white/20">
        <div className="text-center">
          
          {/* État: Traitement en cours */}
          {status === "processing" && (
            <>
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200/30 border-t-orange-400 mx-auto mb-6"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Connexion en cours...</h2>
              <p className="text-orange-200 leading-relaxed">{message}</p>
              <div className="mt-4 flex justify-center">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </>
          )}
          
          {/* État: Succès */}
          {status === "success" && (
            <>
              <div className="relative mb-6">
                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-500 rounded-full">
                  <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="absolute -inset-1 bg-green-400 rounded-full animate-ping opacity-20"></div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Connexion réussie !</h2>
              <p className="text-green-200 leading-relaxed">{message}</p>
            </>
          )}
          
          {/* État: Erreur */}
          {status === "error" && (
            <>
              <div className="relative mb-6">
                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-blue-500 rounded-full">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Erreur de connexion</h2>
              <p className="text-blue-200 leading-relaxed mb-6">{message}</p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => router.push("/auth/sign-in")}
                  className="w-full px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all duration-200 transform hover:scale-105 font-medium"
                >
                  Retour à la connexion
                </button>
                
                <p className="text-sm text-orange-300">
                  Redirection automatique dans quelques secondes...
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}