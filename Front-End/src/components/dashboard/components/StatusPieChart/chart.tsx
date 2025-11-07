"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

type PropsType = {
  data: { status: string; value: number; color: string }[];
};

export function StatusPieChartComponent({ data }: PropsType) {
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
        Aucun ordre disponible
      </div>
    );
  }

  if (!chartReady) {
    return null;
  }

  const total = validData.reduce((sum, item) => sum + item.value, 0);

  const chartOptions: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "inherit",
    },
    colors: validData.map((item) => item.color),
    labels: validData.map((item) => item.status),
    legend: {
      show: true,
      position: "bottom",
      itemMargin: {
        horizontal: 10,
        vertical: 5,
      },
      formatter: function(seriesName, opts) {
        const value = opts.w.globals.series[opts.seriesIndex];
        const percentage = ((value / total) * 100).toFixed(0);
        return `${seriesName}: ${value} (${percentage}%)`;
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          background: "transparent",
          labels: {
            show: true,
            total: {
              show: true,
              showAlways: true,
              label: "Total Ordres",
              fontSize: "16px",
              fontWeight: "400",
            },
            value: {
              show: true,
              fontSize: "28px",
              fontWeight: "bold",
              formatter: (val) => val.toString(),
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function(val, opts) {
        return opts.w.config.series[opts.seriesIndex];
      },
      style: {
        fontSize: '14px',
        fontWeight: 'bold',
      },
      dropShadow: {
        enabled: false,
      }
    },
    tooltip: {
      y: {
        formatter: function(val) {
          const percentage = ((val / total) * 100).toFixed(1);
          return `${val} ordres (${percentage}%)`;
        }
      }
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