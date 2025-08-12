"use client";

import { createPortal } from "react-dom";
import axios from "axios";
import { useRouter } from "next/navigation";
import { EmailIcon, PasswordIcon } from "@/assets/icons";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import InputGroup from "../../FormElements/InputGroup";
import { Checkbox } from "../../FormElements/checkbox";
import { useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import Cookies from "js-cookie";


// Icône Google SVG
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export default function SigninWithPassword() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [data, setData] = useState({
    email: process.env.NEXT_PUBLIC_DEMO_USER_MAIL || "",
    password: process.env.NEXT_PUBLIC_DEMO_USER_PASS || "",
    remember: false,
  });

  const searchParams = useSearchParams();
  const verified = searchParams.get("verified");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);




  useEffect(() => {
    if (verified === "true") {
      toast.success("✅ Email vérifié avec succès !");
    } else if (verified === "false") {
      toast.error("❌ Échec de la vérification de l'email.");
    }
  }, [verified]);

  // Charger le script Google API
  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (typeof window !== "undefined" && window.google) {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
        });
      }
    };

    // Charger le script Google si pas déjà chargé
    if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.body.appendChild(script);
    } else {
      initializeGoogleSignIn();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post("http://localhost:5000/api/login", {
        email: data.email,
        password: data.password,
      });

      localStorage.setItem("token", response.data.token);
      Cookies.set("token", response.data.token, { expires: 7, path: "/" });
      toast.success("Connexion réussie !");
      router.push("/auth/complete-profile");

    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la connexion");
    } finally {
      setLoading(false);
    }
  };

  // Callback pour Google Sign-In
  const handleGoogleCallback = async (response: any) => {
    setGoogleLoading(true);
    try {
      // Envoyer le token Google à votre backend
      const result = await axios.post("http://localhost:5000/api/auth/google", {
        credential: response.credential,
      });

      localStorage.setItem("token", result.data.token);
      toast.success("Connexion Google réussie !");
      router.push("/auth/complete-profile");

    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la connexion Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  // Déclencher la connexion Google
  const handleGoogleSignIn = () => {
      setGoogleLoading(true);
    // Rediriger vers le backend qui lance l'auth Google
    window.location.href = "http://localhost:5000/api/google";
  };

  return (
    <div className="w-full">
      
      {/* Formulaire classique */}
      <form onSubmit={handleSubmit}>
        <InputGroup
          type="email"
          label="Email"
          className="mb-4 [&_label]:text-orange-300 [&_input]:text-white py-[15px]"
          placeholder="Enter your email"
          name="email"
          handleChange={handleChange}
          value={data.email}
          icon={<EmailIcon />}
        />

        <InputGroup
          type="password"
          label="Password"
          className="mb-5 [&_label]:text-orange-300 [&_input]:text-white py-[15px]"
          placeholder="Enter your password"
          name="password"
          handleChange={handleChange}
          value={data.password}
          icon={<PasswordIcon />}
        />

        <div className="mb-6 flex items-center justify-between gap-2 py-2 font-medium">
          <Link
            href="/auth/forgot-password"
            className="hover:text-primary dark:text-white dark:hover:text-primary"
          >
            Forgot Password?
          </Link>
        </div>

        <div className="mb-4.5">
          <button
            type="submit"
            disabled={loading}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sign In
            {loading && (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent dark:border-primary dark:border-t-transparent" />
            )}
          </button>
        </div>
           {/* Séparateur */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-orange-300/20"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-gradient-to-br from-orange-900 via-red-900 to-pink-900 text-orange-200">
            ou continuer avec
          </span>
        </div>
      </div>
        {/* Bouton Google Sign-In */}
      <div className="mb-6">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg border border-orange-200/20 bg-white/5 p-4 font-medium text-orange-100 transition hover:bg-white/10 hover:border-orange-300/30 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
        >
          {googleLoading ? (
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-orange-300 border-t-transparent" />
          ) : (
            <GoogleIcon />
          )}
          {googleLoading ? "Connexion en cours..." : "Continue with Google" }
        </button>
      </div>

        {/* Sign-up Link */}
        <div className="text-center pt-4 border-t border-orange-500/20">
          <p className="text-sm text-orange-100/70">
            Don't have an account?{" "}
            <Link 
              href="/auth/sign-up"
              className="group font-semibold text-orange-400 hover:text-orange-300 transition-colors duration-200"
            >
              <span className="relative">
                Sign up
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-400 transition-all duration-300 group-hover:w-full"></span>
              </span>
              <span className="inline-block ml-1 transition-transform duration-200 group-hover:translate-x-1 text-orange-300">
                →
              </span>
            </Link>
          </p>
        </div>
      </form>
      
    </div>
  );
}

// Types pour TypeScript
declare global {
  interface Window {
    google: any;
  }
}