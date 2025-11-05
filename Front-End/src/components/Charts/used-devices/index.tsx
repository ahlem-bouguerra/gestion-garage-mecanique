'use client';

import { cn } from "@/lib/utils";
import { getDevicesUsedData, DevicesUsedData } from "@/services/charts.services";
import { UsedDevicesChart } from "./chart";
import { useEffect, useState } from 'react';

type PropsType = {
  className?: string;
};

export function UsedDevices({ className }: PropsType) {
  const [data, setData] = useState<DevicesUsedData>([]);
  const [loading, setLoading] = useState(true);
  const [shouldRender, setShouldRender] = useState(false); // ✅ NOUVEAU

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setShouldRender(false); // ✅ Reset avant chargement
        
        const result = await getDevicesUsedData();
        console.log('📊 Données reçues:', result);
        
        setData(result);
        
        // ✅ Attendre un tick avant de rendre le chart
        setTimeout(() => {
          setShouldRender(true);
          setLoading(false);
        }, 100);
        
      } catch (error) {
        console.error("❌ Erreur chargement données appareils:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div
      className={cn(
        "rounded-[10px] bg-white px-7.5 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card",
        className,
      )}
    >
      <h2 className="mb-4 text-body-2xlg font-bold text-dark dark:text-white">
        Devices Used
      </h2>

      {loading || !shouldRender ? (
        <div className="flex items-center justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary"></div>
        </div>
      ) : data.length > 0 ? (
        <UsedDevicesChart data={data} />
      ) : (
        <div className="flex h-[300px] items-center justify-center text-gray-500">
          Aucune donnée disponible
        </div>
      )}
    </div>
  );
}