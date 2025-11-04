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
  
  // Mois et année actuels
  const now = new Date();
  const [mois, setMois] = useState(now.getMonth() + 1);
  const [annee, setAnnee] = useState(now.getFullYear());

  // Fetch des données
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          mois: mois.toString(),
          annee: annee.toString(),
          ...(atelierId !== "tous" && { atelierId }),
        });

        const response = await fetch(
          `http://localhost:5000/api/dashboard/charge-mensuelle?${params}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Erreur chargement charge mensuelle:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mois, annee, atelierId]);

  // Calculer les totaux
  const totaux = data?.donnees.reduce(
    (acc, jour) => ({
      ordres: acc.ordres + jour.nombreOrdres,
      
    }),
    { ordres: 0 }
  );

  return (
    <div className={`rounded-lg bg-white p-6 shadow-md ${className}`}>
      {/* Header avec sélecteur de mois */}
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

      {/* Graphique */}
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

          {/* Résumé */}
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