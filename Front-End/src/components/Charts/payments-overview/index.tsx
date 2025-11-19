// src/components/Charts/payments-overview/index.tsx
'use client'; // ✅ AJOUTER CETTE LIGNE

import { PeriodPicker } from "@/components/period-picker";
import { cn } from "@/lib/utils";
import { getPaymentsOverviewData, PaymentsOverviewData } from "@/services/charts.services";
import { PaymentsOverviewChart } from "./chart";
import { useEffect, useState } from 'react';

type PropsType = {
  timeFrame?: string;
  className?: string;
};

export function PaymentsOverview({ className, timeFrame = "monthly" }: PropsType) {
  const [data, setData] = useState<PaymentsOverviewData>({ total: [], paid: [] });
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(true);

  const getAuthToken = () => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token && token !== 'null' && token !== 'undefined') {
    return token;
  }
  return null;
};

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      
      const token = getAuthToken();
      if (!token) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      const result = await getPaymentsOverviewData(timeFrame);
      
      // Vérifier si result est vide (pas d'accès)
      if (!result || (result.total.length === 0 && result.paid.length === 0)) {
        setHasAccess(false);
      } else {
        setData(result);
        setHasAccess(true);
      }
    } catch (error) {
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [timeFrame]);

  return (
    <div
      className={cn(
        "rounded-[10px] bg-white px-7.5 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-body-2xlg font-bold text-dark dark:text-white">
          Aperçu des paiements
        </h2>

        <PeriodPicker
          items={["daily", "weekly", "monthly", "yearly"]}
          defaultValue={timeFrame}
          sectionKey="payments_overview"
        />
      </div>

{loading ? (
  <div className="flex items-center justify-center py-10">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary"></div>
  </div>
) : !hasAccess ? (
  <div className="flex h-[300px] flex-col items-center justify-center">
    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
      <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <p className="text-gray-500">Aucun accès</p>
  </div>
) : (
  <PaymentsOverviewChart data={data} />
)}
    </div>
  );
}