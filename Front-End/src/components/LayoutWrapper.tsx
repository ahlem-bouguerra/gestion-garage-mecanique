"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Layouts/sidebar";
import { Header } from "@/components/Layouts/header";
import type { PropsWithChildren } from "react";

// ✅ Ajoutez ici les routes où vous ne voulez pas de sidebar/navbar
const pagesWithoutLayout = [
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
  
  // Ajoutez d'autres routes ici selon vos besoins
];

export function LayoutWrapper({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const hideLayout = pagesWithoutLayout.includes(pathname);

  if (hideLayout) {
    return (
      <main className="min-h-screen">
        {children}
      </main>
    );
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <Sidebar />
      <div className="flex-1 min-w-0 bg-gray-2 dark:bg-[#020d1a] overflow-x-hidden">
        <Header />
        <main className="isolate mx-auto w-full max-w-screen-2xl overflow-x-hidden p-4 md:p-6 2xl:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}