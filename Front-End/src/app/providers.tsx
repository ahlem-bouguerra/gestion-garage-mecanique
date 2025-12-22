"use client";

import { SidebarProvider } from "@/components/Layouts/sidebar/sidebar-context";
import { ThemeProvider } from "next-themes";
import { AlertProvider } from "@/components/ui-elements/AlertProvider";
import { ConfirmProvider } from "@/components/ui-elements/ConfirmProvider";


export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="light" attribute="class">
      <SidebarProvider>
        <AlertProvider>
          <ConfirmProvider>
            {children}
          </ConfirmProvider>
        </AlertProvider>
      </SidebarProvider>
    </ThemeProvider>
  );
}
