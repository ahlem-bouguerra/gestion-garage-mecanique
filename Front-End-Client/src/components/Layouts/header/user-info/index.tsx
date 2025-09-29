"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronUpIcon } from "@/assets/icons";
import { Dropdown, DropdownContent, DropdownTrigger } from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { LogOutIcon, SettingsIcon, UserIcon } from "./icons";
import Cookies from "js-cookie";
import axios from "axios";

export function UserInfo() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState({ name: "", email: "", img: "/images/user/user-03.png" });
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    // 🔹 Ne s'exécute que côté client
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser({
          name: parsedUser.name || parsedUser.username || "Utilisateur",
          email: parsedUser.email || "",
          img: parsedUser.img || "/images/user/user-03.png",
        });
      } catch (error) {
        console.error("Erreur parsing user depuis localStorage:", error);
      }
    } else {
      console.log("Aucun utilisateur trouvé dans localStorage");
    }
  }, []);

const handleLogout = async () => {
  setIsLoggingOut(true);
  try {
    const token = localStorage.getItem("token") || Cookies.get("token");

    if (!token) {
      clearLocalData();
      router.push("/auth/sign-in");
      return;
    }

    const response = await axios.post("http://localhost:5000/api/client/logout", {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.data.success) {
      console.log("Déconnexion réussie:", response.data.message);
    } else {
      console.error("Erreur logout API:", response.data.message);
    }

  } catch (error) {
    console.error("Erreur réseau ou serveur lors de la déconnexion:", error);
  } finally {
    clearLocalData();
    router.push("/auth/sign-in");
    setIsLoggingOut(false);
  }
};


  const clearLocalData = () => {
    // Supprimer toutes les données utilisateur
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("refreshToken"); // Si vous en utilisez un
    
    // Supprimer les cookies
    Cookies.remove("token");
    Cookies.remove("refreshToken");
    
    console.log("Données locales nettoyées");
  };

  return (
    <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
      <DropdownTrigger className="rounded align-middle outline-none ring-primary ring-offset-2 focus-visible:ring-1 dark:ring-offset-gray-dark">
        <span className="sr-only">My Account</span>
        <figure className="flex items-center gap-3">
          <Image
            src={user.img}
            className="size-12"
            alt={`Avatar of ${user.name}`}
            role="presentation"
            width={200}
            height={200}
          />
          <figcaption className="flex items-center gap-1 font-medium text-dark dark:text-dark-6 max-[1024px]:sr-only">
            <span>{user.name}</span>
            <ChevronUpIcon className={cn("rotate-180 transition-transform", isOpen && "rotate-0")} strokeWidth={1.5} />
          </figcaption>
        </figure>
      </DropdownTrigger>

      <DropdownContent
        className="border border-stroke bg-white shadow-md dark:border-dark-3 dark:bg-gray-dark min-[230px]:min-w-[17.5rem]"
        align="end"
      >
        <figure className="flex items-center gap-2.5 px-5 py-3.5">
          <Image src={user.img} className="size-12" alt={`Avatar for ${user.name}`} role="presentation" width={200} height={200} />
          <figcaption className="space-y-1 text-base font-medium">
            <div className="mb-2 leading-none text-dark dark:text-white">{user.name}</div>
            <div className="leading-none text-gray-6">{user.email}</div>
          </figcaption>
        </figure>

        <hr className="border-[#E8E8E8] dark:border-dark-3" />

        <div className="p-2 text-base text-[#4B5563] dark:text-dark-6 [&>*]:cursor-pointer">
          <Link 
            href="/profile" 
            onClick={() => setIsOpen(false)} 
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
          >
            <UserIcon />
            <span className="mr-auto text-base font-medium">View profile</span>
          </Link>

          <Link 
            href="/pages/settings" 
            onClick={() => setIsOpen(false)} 
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
          >
            <SettingsIcon />
            <span className="mr-auto text-base font-medium">Account Settings</span>
          </Link>
        </div>

        <hr className="border-[#E8E8E8] dark:border-dark-3" />

        <div className="p-2 text-base text-[#4B5563] dark:text-dark-6">
          <button
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white",
              isLoggingOut && "opacity-50 cursor-not-allowed"
            )}
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOutIcon />
            <span className="text-base font-medium">
              {isLoggingOut ? "Déconnexion..." : "Log out"}
            </span>
          </button>
        </div>
      </DropdownContent>
    </Dropdown>
  );
}