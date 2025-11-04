"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { ChargeJournaliere } from "./types";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type PropsType = {
  data: ChargeJournaliere[];
  mois: number;
  annee: number;
};

export function ChargeMensuelleChart({ data, mois, annee }: PropsType) {
  const isMobile = useIsMobile();

  // Préparer les données pour le graphique
  const categories = data.map(d => `${d.jour}`);
  const nombreOrdres = data.map(d => d.nombreOrdres);

  const options: ApexOptions = {
    chart: {
      height: 350,
      type: "line", // Type mixte (ligne + barre)
      toolbar: { show: false },
      fontFamily: "inherit",
    },
    colors: ["#3b82f6", "#10b981"], // Bleu pour ordres, vert pour heures
    stroke: {
      width: [0, 3], // 0 pour barres, 3 pour ligne
      curve: "smooth",
    },
    plotOptions: {
      bar: {
        columnWidth: "60%",
        borderRadius: 4,
      },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: true,
      position: "top",
    },
    xaxis: {
      categories: categories,
      title: {
        text: `Jours du mois (${mois}/${annee})`,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: [
      {
        title: { text: "Nombre d'ordres" },
        labels: {
          formatter: (val) => Math.round(val).toString(),
        },
      },
      
    ],
    grid: {
      strokeDashArray: 5,
      borderColor: "#e5e7eb",
    },
tooltip: {
    shared: true,
    intersect: false,
    custom: function({ seriesIndex, dataPointIndex, w }) {
      const jour = data[dataPointIndex];
      const statuts = jour.parStatut;
      
      // Fonction pour formater la date
      const formatDate = (dateStr: string) => {
        if (!dateStr) return 'Non définie';
        return new Date(dateStr).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      };
      
      // Couleurs par statut
      const statusColors = {
        en_attente: '#f59e0b',
        en_cours: '#3b82f6',
        termine: '#10b981',
        suspendu: '#ef4444'
      };
      
      const statusLabels = {
        en_attente: '⏳ En attente',
        en_cours: '🔵 En cours',
        termine: '✅ Terminé',
        suspendu: '⏸️ Suspendu'
      };
      
      let html = `
        <div class="p-4 bg-white shadow-xl rounded-lg min-w-[300px] max-w-[400px]">
          <div class="font-bold text-lg mb-3 border-b pb-2">
            📅 Jour ${jour.jour}
          </div>
          <div class="text-sm text-gray-600 mb-3">
            Total: <span class="font-semibold">${jour.nombreOrdres}</span> ordre(s) actifs
          </div>
      `;
      
      // Afficher chaque statut
      Object.keys(statuts).forEach((status) => {
        const detail = statuts[status as keyof typeof statuts];
        if (detail.count > 0) {
          html += `
            <div class="mb-3 border-l-4 pl-3" style="border-color: ${statusColors[status as keyof typeof statusColors]}">
              <div class="font-semibold mb-2" style="color: ${statusColors[status as keyof typeof statusColors]}">
                ${statusLabels[status as keyof typeof statusLabels]} (${detail.count})
              </div>
          `;
          
          // Lister les ordres de ce statut (max 3 pour ne pas surcharger)
          detail.ordres.slice(0, 3).forEach((ordre) => {
            html += `
              <div class="bg-gray-50 p-2 rounded mb-2 text-xs">
                <div class="font-medium text-gray-900">${ordre.numeroOrdre}</div>
                <div class="text-gray-600">${ordre.clientNom}</div>
                <div class="text-gray-500">${ordre.vehicule}</div>
                <div class="flex justify-between mt-1">
                  <span>📅 Fin: ${formatDate(ordre.dateFin)}</span>
                  <span class="text-blue-600">${ordre.heuresEstimees}h</span>
                </div>
                ${status === 'en_cours' ? `
                  <div class="mt-1">
                    <div class="w-full bg-gray-200 rounded-full h-1.5">
                      <div class="bg-blue-600 h-1.5 rounded-full" style="width: ${ordre.progression}%"></div>
                    </div>
                    <span class="text-xs text-gray-500">${ordre.progression}%</span>
                  </div>
                ` : ''}
              </div>
            `;
          });
          
          // Si plus de 3 ordres, afficher un message
          if (detail.ordres.length > 3) {
            html += `
              <div class="text-xs text-gray-500 italic">
                ... et ${detail.ordres.length - 3} autre(s)
              </div>
            `;
          }
          
          html += `</div>`;
        }
      });
      
      html += `
          <div class="mt-3 pt-2 border-t text-xs text-gray-500">
            💡 Cliquez pour voir tous les détails
          </div>
        </div>
      `;
      
      return html;
    }
  }
  };

  const series = [
    {
      name: "Nombre d'ordres",
      type: "column",
      data: nombreOrdres,
    },
   
  ];

  return (
    <div className="h-[350px]">
      <Chart options={options} series={series} type="line" height={350} />
    </div>
  );
}