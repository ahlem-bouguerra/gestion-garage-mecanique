"use client";

import { cn } from "@/lib/utils";
import { StatusPieChartComponent } from "./chart";
import { useEffect, useState } from "react";

interface StatusData {
  enAttente: number;
  enCours: number;
  termines: number;
  suspendus: number;
}

interface StatusPieChartProps {
  statistiques?: StatusData;
  className?: string;
  atelierId?: string;
  periode?: 'jour' | 'semaine' | 'mois';
}

export default function StatusPieChart({ 
  statistiques, 
  className,
  atelierId = 'tous',
  periode = 'jour'
}: StatusPieChartProps) {
  const [data, setData] = useState<StatusData | null>(statistiques || null);
  const [loading, setLoading] = useState(!statistiques);
  const [shouldRender, setShouldRender] = useState(false);
  const [hasAccess, setHasAccess] = useState(true); // ← Ajouter

  // ✅ Fonction pour obtenir le token
  const getAuthToken = () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token && token !== 'null' && token !== 'undefined') {
      return token;
    }
    return null;
  };

  useEffect(() => {
    // Si les statistiques sont passées en prop, les utiliser directement
    if (statistiques) {
      setData(statistiques);
      setTimeout(() => {
        setShouldRender(true);
        setLoading(false);
      }, 100);
      return;
    }

    // Sinon, faire un appel API
    const fetchData = async () => {
      try {
        setLoading(true);
        setShouldRender(false);

        const token = getAuthToken();
        
        if (!token) {
          setHasAccess(false);
          setLoading(false);
          return;
        }

        const params = new URLSearchParams({
          periode,
          ...(atelierId !== 'tous' && { atelier: atelierId })
        });

        const response = await fetch(
          `http://localhost:5000/api/dashboard/charge-atelier?${params}`,
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
        setData(result.statistiques);
        setHasAccess(true);

        setTimeout(() => {
          setShouldRender(true);
          setLoading(false);
        }, 100);
      } catch (error) {
        setHasAccess(false);
        setLoading(false);
      }
    };

    fetchData();
  }, [statistiques, atelierId, periode]);

  // Transformer les données pour le chart
  const chartData = data ? [
    { status: 'En attente', value: data.enAttente, color: '#f59e0b' },
    { status: 'En cours', value: data.enCours, color: '#3b82f6' },
    { status: 'Terminés', value: data.termines, color: '#10b981' },
    { status: 'Suspendus', value: data.suspendus, color: '#ef4444' },
  ].filter(item => item.value > 0) : [];

  // ✅ Afficher message si pas d'accès
  if (!hasAccess) {
    return (
      <div
        className={cn(
          "rounded-[10px] bg-white px-7.5 pt-7.5 pb-6 shadow-1 dark:bg-gray-dark dark:shadow-card",
          className,
        )}
      >
        <h2 className="mb-4 text-body-2xlg font-bold text-dark dark:text-white">
          Répartition des Ordres par Statut
        </h2>
        
        <div className="flex h-[300px] flex-col items-center justify-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-gray-500">Aucun accès</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-[10px] bg-white px-7.5 pt-7.5 pb-6 shadow-1 dark:bg-gray-dark dark:shadow-card",
        className,
      )}
    >
      <h2 className="mb-4 text-body-2xlg font-bold text-dark dark:text-white">
        Répartition des Ordres par Statut
      </h2>

      {loading || !shouldRender ? (
        <div className="flex items-center justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary"></div>
        </div>
      ) : chartData.length > 0 ? (
        <StatusPieChartComponent data={chartData} />
      ) : (
        <div className="flex h-[300px] items-center justify-center text-gray-500">
          Aucune donnée disponible
        </div>
      )}
    </div>
  );
}