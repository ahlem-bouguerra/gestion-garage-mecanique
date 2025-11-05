"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { compactFormat } from "@/lib/format-number";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

type PropsType = {
  data: { device: string; value: number; percentage: number }[];
};

export function UsedDevicesChart({ data }: PropsType) {
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    // Attendre que le composant soit monté
    const timer = setTimeout(() => setChartReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-gray-500">
        Aucune donnée disponible
      </div>
    );
  }

  const validData = data.filter(
    (item) =>
      item.value &&
      typeof item.value === "number" &&
      !isNaN(item.value) &&
      item.value > 0
  );

  if (validData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-gray-500">
        Données invalides
      </div>
    );
  }

  if (!chartReady) {
    return null; // Ne rien rendre tant que pas prêt
  }

  const chartOptions: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "inherit",
    },
    colors: ["#5750F1", "#5475E5", "#8099EC", "#ADBCF2"],
    labels: validData.map((item) => item.device),
    legend: {
      show: true,
      position: "bottom",
      itemMargin: {
        horizontal: 10,
        vertical: 5,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "80%",
          background: "transparent",
          labels: {
            show: true,
            total: {
              show: true,
              showAlways: true,
              label: "Total",
              fontSize: "16px",
              fontWeight: "400",
            },
            value: {
              show: true,
              fontSize: "28px",
              fontWeight: "bold",
              formatter: (val) => compactFormat(+val),
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    responsive: [
      {
        breakpoint: 2600,
        options: {
          chart: {
            width: 415,
          },
        },
      },
      {
        breakpoint: 640,
        options: {
          chart: {
            width: "100%",
          },
        },
      },
      {
        breakpoint: 370,
        options: {
          chart: {
            width: 260,
          },
        },
      },
    ],
  };

  return (
    <ReactApexChart
      options={chartOptions}
      series={validData.map((item) => item.value)}
      type="donut"
      height={350}
    />
  );
}