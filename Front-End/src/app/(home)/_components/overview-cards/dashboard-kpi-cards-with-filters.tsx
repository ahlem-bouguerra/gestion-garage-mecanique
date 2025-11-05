// src/app/(home)/_components/overviewCards/dashboard-kpi-cards-with-filters.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { OverviewCard } from './card';
import * as icons from "./icons";

interface DashboardData {
  statistiques: {
    total: number;
    totalHeuresEstimees: number;
    totalHeuresReelles: number;
    enAttente: number;
    enCours: number;
    termines: number;
    suspendus: number;
  };
  tempsMoyenInterventions: {
    tempsMoyenEstime: number;
    tempsMoyenReel: number;
  };
}

export function DashboardKPICardsWithFilters() {
  const [periode, setPeriode] = useState<'jour' | 'semaine' | 'mois'>('jour');

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          periode
        });

        const response = await fetch(
          `http://localhost:5000/api/dashboard/charge-atelier?${params}`
        );
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [periode]);

  if (!data && !loading) {
    return (
      <div className="text-center py-12 text-gray-500">
        Aucune donnée disponible
      </div>
    );
  }

  const { statistiques, tempsMoyenInterventions } = data || {
    statistiques: {
      total: 0,
      totalHeuresEstimees: 0,
      totalHeuresReelles: 0,
      enAttente: 0,
      enCours: 0,
      termines: 0,
      suspendus: 0
    },
    tempsMoyenInterventions: {
      tempsMoyenEstime: 0,
      tempsMoyenReel: 0
    }
  };

  // Calculs des métriques
  const tauxCompletion = statistiques.total > 0 && statistiques.termines
    ? ((statistiques.termines / statistiques.total) * 100)
    : 0;

  const progressionTravaux = statistiques.total > 0
    ? (((statistiques.enCours + statistiques.termines) / statistiques.total) * 100)
    : 0;

  const capaciteTheorique = 40;
  const chargeWorkload = statistiques.totalHeuresEstimees > 0
    ? (statistiques.totalHeuresEstimees / capaciteTheorique) * 100
    : 0;

  const tempsMoyenGrowth = tempsMoyenInterventions.tempsMoyenReel && 
    tempsMoyenInterventions.tempsMoyenEstime > 0
    ? ((tempsMoyenInterventions.tempsMoyenEstime - tempsMoyenInterventions.tempsMoyenReel) 
       / tempsMoyenInterventions.tempsMoyenReel) * 100
    : periode === 'jour' ? 0 : 5;

  const performanceMetric = {
    value: tauxCompletion > 0 
      ? `${tauxCompletion.toFixed(0)}%` 
      : `${progressionTravaux.toFixed(0)}%`,
    growthRate: tauxCompletion > 0
      ? (tauxCompletion >= 80 ? 5 : -3)
      : (progressionTravaux >= 70 ? 8 : -2)
  };

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-4 rounded-[10px] bg-white p-4 shadow-1 dark:bg-gray-dark">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-dark dark:text-white">
            Période:
          </label>
          <select
            value={periode}
            onChange={(e) => setPeriode(e.target.value as 'jour' | 'semaine' | 'mois')}
            className="rounded-md border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-dark-3"
          >
            <option value="jour">Jour</option>
            <option value="semaine">Semaine</option>
            <option value="mois">Mois</option>
          </select>
        </div>

   

        {periode === 'jour' && (
          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
            📅 Données d'aujourd'hui uniquement
          </div>
        )}
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 2xl:gap-7.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark"
            >
              <div className="animate-pulse">
                <div className="size-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="mt-6 flex items-end justify-between">
                  <div>
                    <div className="mb-1.5 h-7 w-18 rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-5 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                  </div>
                  <div className="h-5 w-15 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 2xl:gap-7.5">
          <OverviewCard
            label="Total Ordres"
            data={{
              value: statistiques.total,
              growthRate: periode === 'jour' ? 0 : 12
            }}
            Icon={icons.ActivityIcon}
          />

          <OverviewCard
            label="Temps Moyen"
            data={{
              value: tempsMoyenInterventions.tempsMoyenEstime > 0 
                ? `${tempsMoyenInterventions.tempsMoyenEstime.toFixed(1)}h` 
                : '0h',
              growthRate: Number(tempsMoyenGrowth.toFixed(1))
            }}
            Icon={icons.ClockIcon}
          />

          <OverviewCard
            label="Charge Totale"
            data={{
              value: `${statistiques.totalHeuresEstimees.toFixed(0)}h`,
              growthRate: chargeWorkload >= 100 ? -10 : chargeWorkload >= 80 ? -5 : 8
            }}
            Icon={icons.CalendarIcon}
          />

          <OverviewCard
            label="Performance"
            data={performanceMetric}
            Icon={icons.PerformanceIcon}
          />
        </div>
      )}
    </div>
  );
}