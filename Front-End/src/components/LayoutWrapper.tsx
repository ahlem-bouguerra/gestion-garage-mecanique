"use client";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Layouts/sidebar";
import { Header } from "@/components/Layouts/header";
import { SidebarProvider } from "@/components/Layouts/sidebar/sidebar-context";
import type { PropsWithChildren } from "react";

// Pages sans layout
const pagesWithoutLayout = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/404",
  "/500",
  "/auth/sign-in",
  "/auth/sign-up",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/complete-profile",
  "/auth/google-callback",
  "/Auth/SigninForm",
];

// Routes garagiste
const garagisteRoutes = [
  "/dashboard",
  "/dashboard-reservation",
  "/fiche-client",
  "/fiche-voiture",
  "/devis",
  "/gestion-factures",
  "/gestion-mecanicien",
  "/gestion-ordres",
  "/reservation-cote-garage",
];

// Routes client
const clientRoutes = [
  "/client/dashboard",
  "/client/reservations",
  "/client/vehicules",
  "/client/factures",
  "/client/devis",
  "/client/historique",
  "/client/garages",
  "/client/paiements",
  "/client/profil",
  "/client/parametres",
];

export function LayoutWrapper({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const hideLayout = pagesWithoutLayout.includes(pathname);
  
  // Déterminer le type d'utilisateur selon la route
  const userType = clientRoutes.some(route => pathname.startsWith(route))
    ? 'client'
    : garagisteRoutes.some(route => pathname.startsWith(route))
    ? 'garagiste'
    : 'garagiste'; // par défaut

  if (hideLayout) {
    return (
      <main className="min-h-screen">
        {children}
      </main>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar userType={userType} />
        <div className="w-full bg-gray-2 dark:bg-[#020d1a]">
          <Header userType={userType} />
          <main className="isolate mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}