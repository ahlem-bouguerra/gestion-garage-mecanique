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

export default function SigninWithPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [data, setData] = useState({
    email: process.env.NEXT_PUBLIC_DEMO_USER_MAIL || "",
    password: process.env.NEXT_PUBLIC_DEMO_USER_PASS || "",
    remember: false,
  });

  const verified = searchParams.get("verified");
  const [loading, setLoading] = useState(false);

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

    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", {
        email: data.email,
        password: data.password,
      });

      if (response.data.token) {
        const token = response.data.token;
        localStorage.setItem("token", token);
        Cookies.set("token", token, { expires: 7, path: "/" });
        toast.success("Connexion réussie !");
        const user = response.data.user;
        localStorage.setItem("user", JSON.stringify(user));
        router.push("/chercher-garage");
        console.log("💾 Token dans localStorage:", localStorage.getItem("token"));
        console.log("💾 User dans localStorage:", localStorage.getItem("user"));

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

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Sign In
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Enter your credentials to access your account
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <InputGroup
          type="email"
          label="Email"
          className="mb-4"
          placeholder="Enter your email"
          name="email"
          handleChange={handleChange}
          value={data.email}
          icon={<EmailIcon />}
        />

        <InputGroup
          type="password"
          label="Password"
          className="mb-5"
          placeholder="Enter your password"
          name="password"
          handleChange={handleChange}
          value={data.password}
          icon={<PasswordIcon />}
        />

        <div className="mb-6 flex items-center justify-end">
          <Link
            href="/auth/forgot-password"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            Forgot Password?
          </Link>
        </div>

        <div className="mb-6">
          <button
            type="submit"
            disabled={loading}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-gray-900 dark:bg-white p-4 font-medium text-white dark:text-gray-900 transition hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                Signing in...
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white dark:border-gray-900 border-t-transparent" />
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </div>

        {/* Sign-up Link */}
        <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <Link
              href="/auth/sign-up"
              className="font-semibold text-gray-900 dark:text-white hover:underline transition-all"
            >
              Sign up
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}