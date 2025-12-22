"use client";

import React, { createContext, useContext, useState } from "react";

type ConfirmOptions = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
};

type ConfirmContextType = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = (options: ConfirmOptions) =>
    new Promise<boolean>((resolve) => {
      setState({ options, resolve });
    });

  const handleCancel = () => {
    state?.resolve(false);
    setState(null);
  };

  const handleConfirm = () => {
    state?.resolve(true);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {state && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-3">
              {state.options.title}
            </h3>

            <p className="text-gray-600 mb-6">
              {state.options.message}
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
              >
                {state.options.cancelText ?? "Annuler"}
              </button>

              <button
                onClick={handleConfirm}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                {state.options.confirmText ?? "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
