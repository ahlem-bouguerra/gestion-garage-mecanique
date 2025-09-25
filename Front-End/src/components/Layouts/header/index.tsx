// src/components/Layouts/header/index.tsx (remplacez votre header existant)
"use client";

import { SearchIcon } from "@/assets/icons";
import Image from "next/image";
import Link from "next/link";
import { useSidebarContext } from "../sidebar/sidebar-context";
import { MenuIcon } from "./icons";
import { Notification } from "./notification";
import { ThemeToggleSwitch } from "./theme-toggle";
import { UserInfo } from "./user-info";

interface HeaderProps {
  userType?: 'garagiste' | 'client';
}

export function Header({ userType = 'garagiste' }: HeaderProps) {
  const { toggleSidebar, isMobile } = useSidebarContext();

  // Fonction pour obtenir le titre selon le type d'utilisateur
  const getTitle = () => {
    return userType === 'garagiste' ? 'Espace Garagiste' : 'Mon Espace Client';
  };

  // Fonction pour obtenir la description selon le type d'utilisateur
  const getDescription = () => {
    return userType === 'garagiste' 
      ? 'Gestion de votre garage' 
      : 'Gérez vos réservations et véhicules';
  };

  // Fonction pour obtenir les styles selon le type d'utilisateur
  const getHeaderStyles = () => {
    if (userType === 'client') {
      return "sticky top-0 z-30 flex items-center justify-between border-b border-blue-200 bg-blue-600 text-white px-4 py-5 shadow-1";
    }
    return "sticky top-0 z-30 flex items-center justify-between border-b border-stroke bg-white px-4 py-5 shadow-1 dark:border-stroke-dark dark:bg-gray-dark md:px-5 2xl:px-10";
  };

  // Fonction pour obtenir les styles du bouton selon le type d'utilisateur
  const getButtonStyles = () => {
    if (userType === 'client') {
      return "rounded-lg border border-blue-400 bg-blue-700 px-1.5 py-1 hover:bg-blue-800 lg:hidden";
    }
    return "rounded-lg border px-1.5 py-1 dark:border-stroke-dark dark:bg-[#020D1A] hover:dark:bg-[#FFFFFF1A] lg:hidden";
  };

  // Fonction pour obtenir les styles de l'input selon le type d'utilisateur
  const getInputStyles = () => {
    if (userType === 'client') {
      return "flex w-full items-center gap-3.5 rounded-full border border-blue-300 bg-blue-100 text-gray-800 py-3 pl-[53px] pr-5 outline-none transition-colors focus-visible:border-blue-500 placeholder:text-gray-600";
    }
    return "flex w-full items-center gap-3.5 rounded-full border bg-gray-2 py-3 pl-[53px] pr-5 outline-none transition-colors focus-visible:border-primary dark:border-dark-3 dark:bg-dark-2 dark:hover:border-dark-4 dark:hover:bg-dark-3 dark:hover:text-dark-6 dark:focus-visible:border-primary";
  };

  return (
    <header className={getHeaderStyles()}>
      <button
        onClick={toggleSidebar}
        className={getButtonStyles()}
      >
        <MenuIcon />
        <span className="sr-only">Toggle Sidebar</span>
      </button>

      {isMobile && (
        <Link href={"/"} className="ml-2 max-[430px]:hidden min-[375px]:ml-4">
          <Image
            src={"/images/logo/logo-icon.svg"}
            width={32}
            height={32}
            alt=""
            role="presentation"
          />
        </Link>
      )}

      <div className="max-xl:hidden">
        <h1 className={`mb-0.5 text-heading-5 font-bold ${userType === 'client' ? 'text-white' : 'text-dark dark:text-white'}`}>
          {getTitle()}
        </h1>
        <p className={`font-medium ${userType === 'client' ? 'text-blue-100' : ''}`}>
          {getDescription()}
        </p>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 min-[375px]:gap-4">
        <div className="relative w-full max-w-[300px]">
          <input
            type="search"
            placeholder="Search"
            className={getInputStyles()}
          />

          <SearchIcon className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 max-[1015px]:size-5" />
        </div>

        <ThemeToggleSwitch />

        <Notification />

        <div className="shrink-0">
          <UserInfo />
        </div>
      </div>
    </header>
  );
}