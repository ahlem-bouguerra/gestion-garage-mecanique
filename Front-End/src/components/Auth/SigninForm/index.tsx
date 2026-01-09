"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { EmailIcon, PasswordIcon } from "@/assets/icons";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import InputGroup from "../../FormElements/InputGroup";
import { useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import Cookies from "js-cookie";

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
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [data, setData] = useState({
    email: process.env.NEXT_PUBLIC_DEMO_USER_MAIL || "",
    password: "",
    remember: false,
  });

  const verified = searchParams.get("verified");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ✅ Gérer le retour du callback Google
  useEffect(() => {
    const token = searchParams.get("token");
    const userEncoded = searchParams.get("user");
    const redirect = searchParams.get("redirect");
    const profileComplete = searchParams.get("profileComplete");

    if (token && userEncoded) {
      console.log("🔐 Token Google reçu");
      
      try {
        const userDataString = atob(decodeURIComponent(userEncoded));
        const userData = JSON.parse(userDataString);

        // Stocker dans localStorage et cookies
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));
        Cookies.set("token", token, { expires: 7, path: "/" });

        toast.success("🎉 Connexion Google réussie !");

        // ✅ VÉRIFIER SI LE PROFIL EST COMPLET
        setTimeout(() => {
          if (profileComplete === "false") {
            console.log("➡️ Profil incomplet - Redirection vers complete-profile");
            router.replace("/auth/complete-profile");
          } else if (redirect === "dashboard") {
            console.log("➡️ Profil complet - Redirection vers dashboard");
            router.replace("/dashboard-reservation");
          } else {
            router.replace("/dashboard-reservation");
          }
        }, 1500);

      } catch (error) {
        console.error("❌ Erreur traitement Google:", error);
        toast.error("Erreur lors de la connexion Google");
      }
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (verified === "true") {
      toast.success("✅ Email vérifié avec succès !");
    } else if (verified === "false") {
      toast.error("❌ Échec de la vérification de l'email.");
    }
  }, [verified]);

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

    console.log("🔐 Tentative de connexion depuis le frontend");
    console.log("📧 Email:", data.email);
    console.log("🔑 Password:", data.password ? "***" : "VIDE");

    try {
      const loginData = {
        email: data.email.trim(),
        password: data.password
      };
      
      console.log("📤 Données envoyées:", { email: loginData.email, password: loginData.password ? "***" : "VIDE" });
      
      const response = await axios.post("http://localhost:5000/api/login", loginData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log("✅ Réponse reçue:", response.status, response.data.message);

      if (response.data.token) {
        const token = response.data.token;
        const user = response.data.user;
        

        // Stocker les données
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        Cookies.set("token", token, { expires: 7, path: "/" });
        
        console.log("💾 Token stocké:", token.substring(0, 20) + "...");
       
        
        toast.success("Connexion réussie !");

        // ✅ REDIRECTION CONDITIONNELLE
       
          console.log("➡️ Profil complet - Redirection vers dashboard");
          router.push("/dashboard-reservation");
        
      } else {
        throw new Error("Token non reçu");
      }
    } catch (error: any) {
      console.error('Erreur login:', error);
      toast.error(error.response?.data?.message || "Erreur lors de la connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    console.log("🔄 Démarrage connexion Google...");
    setGoogleLoading(true);
    window.location.href = "http://localhost:5000/api/garage/google";
  };

  return (
    <div className="w-full">
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

        <div className="mb-5 [&_label]:text-orange-300 [&_input]:text-white py-[15px]">
          <label
            htmlFor="password"
            className="text-body-sm font-medium text-orange-300 block mb-3"
          >
            Password
          </label>
          <div className="relative mt-3">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter your password"
              onChange={handleChange}
              value={data.password}
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5.5 py-3 pr-14 text-white placeholder:text-gray-400 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:focus:border-primary"
            />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowPassword(!showPassword);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-300 transition-colors focus:outline-none cursor-pointer z-10 p-1"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={0}
            >
              {showPassword ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

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
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent" />
            )}
          </button>
        </div>

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
            {googleLoading ? "Connexion en cours..." : "Continue with Google"}
          </button>
        </div>

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