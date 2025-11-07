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

        const params = new URLSearchParams({
          periode,
          ...(atelierId !== 'tous' && { atelier: atelierId })
        });

        const response = await fetch(
          `http://localhost:5000/api/dashboard/charge-atelier?${params}`
        );
        const result = await response.json();

        setData(result.statistiques);

        setTimeout(() => {
          setShouldRender(true);
          setLoading(false);
        }, 100);
      } catch (error) {
        console.error("❌ Erreur chargement données statut:", error);
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