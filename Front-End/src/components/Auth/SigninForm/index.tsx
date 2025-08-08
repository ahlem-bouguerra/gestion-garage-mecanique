"use client";

import { createPortal } from "react-dom";
import axios from "axios";;
import { useRouter } from "next/navigation";
import { EmailIcon, PasswordIcon } from "@/assets/icons";
import Link from "next/link";
import React, { useState } from "react";
import InputGroup from "../../FormElements/InputGroup";
import { Checkbox } from "../../FormElements/checkbox";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";


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

  useEffect(() => {
    if (verified === "true") {
      toast.success("✅ Email vérifié avec succès !");
    } else if (verified === "false") {
      toast.error("❌ Échec de la vérification de l'email.");
    }
  }, [verified]);

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
  };

 const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setLoading(true);
  setError(""); // Tu peux ajouter un état error (voir plus bas)

  try {
    const response = await axios.post("http://localhost:5000/api/login", {
      email: data.email,
      password: data.password,
    });

    // Par exemple, si tu reçois un token JWT dans response.data.token
    // Tu peux le stocker dans localStorage ou cookie
    localStorage.setItem("token", response.data.token);

    toast.success("Connexion réussie !");
    // Puis rediriger l’utilisateur vers la page privée
    router.push("/profil"); // adapte la route selon ton app

  } catch (error: any) {
    toast.error(error.response?.data?.message || "Erreur lors de la connexion");
  } finally {
    setLoading(false);
  }
};


  return (
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
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition hover:bg-opacity-90"
        >
          Sign In
          {loading && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent dark:border-primary dark:border-t-transparent" />
          )}
        </button>
      </div>
           {/* Sign-up Link - Thème orange */}
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
    
  );
}
