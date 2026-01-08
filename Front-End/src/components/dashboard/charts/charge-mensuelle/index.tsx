"use client";

import { useState, useEffect } from "react";
import { ChargeMensuelleChart } from "./chart";
import { ChargeMensuelleData } from "./types";

type PropsType = {
  atelierId?: string;
  className?: string;
};

export function ChargeMensuelle({ atelierId = "tous", className }: PropsType) {
  const [data, setData] = useState<ChargeMensuelleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasAccess, setHasAccess] = useState(true); // ← Ajouter
  
  const now = new Date();
  const [mois, setMois] = useState(now.getMonth() + 1);
  const [annee, setAnnee] = useState(now.getFullYear());

  // ✅ Fonction pour obtenir le token
  const getAuthToken = () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token && token !== 'null' && token !== 'undefined') {
      return token;
    }
    return null;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = getAuthToken();
        
        if (!token) {
          setHasAccess(false);
          setLoading(false);
          return;
        }

        const params = new URLSearchParams({
          mois: mois.toString(),
          annee: annee.toString(),
          ...(atelierId !== "tous" && { atelierId }),
        });

        const response = await fetch(
          `http://localhost:5000/api/dashboard/charge-mensuelle?${params}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setHasAccess(false);
            setLoading(false);
            return;
          }
          throw new Error('Erreur serveur');
        }

        const result = await response.json();
        setData(result);
        setHasAccess(true);
      } catch (error) {
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mois, annee, atelierId]);

  const totaux = data?.donnees.reduce(
    (acc, jour) => ({
      ordres: acc.ordres + jour.nombreOrdres,
    }),
    { ordres: 0 }
  );

  // ✅ Afficher message si pas d'accès
  if (!hasAccess) {
    return (
      <div className={`rounded-lg bg-white p-6 shadow-md ${className}`}>
        <div className="flex h-[350px] flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun accès</h3>
          <p className="text-gray-600">Vous n'avez pas accès à ces données</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg bg-white p-6 shadow-md ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          Charge Mensuelle
        </h2>
        
        <div className="flex gap-2">
          <select
            value={mois}
            onChange={(e) => setMois(Number(e.target.value))}
            className="rounded border px-3 py-1"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2024, i).toLocaleDateString("fr-FR", { month: "long" })}
              </option>
            ))}
          </select>
          
          <select
            value={annee}
            onChange={(e) => setAnnee(Number(e.target.value))}
            className="rounded border px-3 py-1"
          >
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex h-[350px] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
        </div>
      ) : data ? (
        <>
          <ChargeMensuelleChart
            data={data.donnees}
            mois={mois}
            annee={annee}
          />

          <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {totaux?.ordres || 0}
              </p>
              <p className="text-sm text-gray-600">Total ordres</p>
            </div>
          </div>
        </>
      ) : (
        <p className="text-center text-gray-500">Aucune donnée</p>
      )}
    </div>
  );
}