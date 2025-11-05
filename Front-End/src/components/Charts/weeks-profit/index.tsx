'use client'; // ✅ IMPORTANT : Ajouter cette directive

import { PeriodPicker } from "@/components/period-picker";
import { cn } from "@/lib/utils";
import { getWeeksProfitData, WeeksProfitData } from "@/services/charts.services";
import { WeeksProfitChart } from "./chart";
import { useEffect, useState } from 'react';

type PropsType = {
  timeFrame?: string;
  className?: string;
};

export function WeeksProfit({ className, timeFrame = "this week" }: PropsType) {
  const [data, setData] = useState<WeeksProfitData>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ Charger les données côté client
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getWeeksProfitData(timeFrame);
        setData(result);
      } catch (error) {
        console.error("Erreur chargement données:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeFrame]); // ✅ Recharger quand timeFrame change

  return (
    <div
      className={cn(
        "rounded-[10px] bg-white px-7.5 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-body-2xlg font-bold text-dark dark:text-white">
          Profit {timeFrame}
        </h2>

        <PeriodPicker
          items={["this week", "last week"]}
          defaultValue={timeFrame}
          sectionKey="weeks_profit"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary"></div>
        </div>
      ) : (
        <WeeksProfitChart data={data} />
      )}
    </div>
  );
}