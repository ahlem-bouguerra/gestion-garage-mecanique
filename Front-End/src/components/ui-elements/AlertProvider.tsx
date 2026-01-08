"use client";

import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Alert } from "./alert";

type Variant = "success" | "warning" | "error";

type AlertState = {
  variant: Variant;
  title: string;
  description: string;
} | null;

type AlertContextType = {
  showAlert: (variant: Variant, title: string, description: string) => void;
  clearAlert: () => void;
};

const AlertContext = createContext<AlertContextType | null>(null);

export function useGlobalAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useGlobalAlert must be used within AlertProvider");
  return ctx;
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alert, setAlert] = useState<AlertState>(null);
  const timerRef = useRef<number | null>(null);

  const clearAlert = useCallback(() => {
    setAlert(null);
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const showAlert = useCallback((variant: Variant, title: string, description: string) => {
    setAlert({ variant, title, description });

    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setAlert(null);
      timerRef.current = null;
    }, 5000);
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, clearAlert }}>
      {children}

      {/* ✅ Affichage global (top-right) */}
      {alert && (
        <div className="fixed bottom-4 right-4 z-[9999] w-[420px] max-w-[90vw]">
          <Alert
            variant={alert.variant}
            title={alert.title}
            description={alert.description}
            className="shadow-2xl"
          />
        </div>
      )}
    </AlertContext.Provider>
  );
}
