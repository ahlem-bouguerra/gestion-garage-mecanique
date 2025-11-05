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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getPaymentsOverviewData(timeFrame);
        setData(result);
      } catch (error) {
        console.error("Erreur chargement données:", error);
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
          Payments Overview
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
      ) : (
        <PaymentsOverviewChart data={data} />
      )}
    </div>
  );
}