// charts.services.ts
import axios from "axios";

const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
  }
  return null;
};

// ✅ Types
export type PaymentsOverviewData = {
  total: { x: string; y: number }[];
  paid: { x: string; y: number }[];
};

export type WeeksProfitData = {
  week: string;
  profit: number;
  revenue: number;
  expenses: number;
}[];

export type DevicesUsedData = {
  device: string;
  value: number;
  percentage: number;
}[];

// ✅ Aperçu des paiements
export async function getPaymentsOverviewData(
  timeFrame: string = "monthly"
): Promise<PaymentsOverviewData> {
  try {
    const token = getAuthToken();
    
    if (!token) {
      console.warn("Pas de token disponible");
      return { total: [], paid: [] };
    }

    const response = await axios.get(
      "http://localhost:5000/api/factures/charts/payments-overview", 
      {
        params: { timeFrame },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.data;
  } catch (error) {
    console.error("Erreur récupération données paiements:", error);
    return { total: [], paid: [] };
  }
}

// ✅ Weeks Profit
export async function getWeeksProfitData(
  timeFrame: string = "this week"
): Promise<WeeksProfitData> {
  try {
    const token = getAuthToken();
    
    if (!token) {
      console.warn("Pas de token disponible");
      return [];
    }

    const response = await axios.get(
      "http://localhost:5000/api/factures/charts/weeks-profit", 
      {
        params: { timeFrame },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.data;
  } catch (error) {
    console.error("Erreur récupération profit hebdomadaire:", error);
    return [];
  }
}


export async function getDevicesUsedData(): Promise<DevicesUsedData> {
  try {
    const token = getAuthToken();
    
    if (!token) {
      console.warn("Pas de token disponible");
      return [
        { device: "Payé", value: 45, percentage: 45 },
        { device: "Non payé", value: 35, percentage: 35 },
        { device: "Partiellement payé", value: 20, percentage: 20 },
      ];
    }

    const response = await axios.get(
      "http://localhost:5000/api/factures/charts/devices-used", 
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // ✅ Vérifier que les données sont valides
    const apiData = response.data.data;
    if (!apiData || apiData.length === 0) {
      return [
        { device: "Aucune donnée", value: 1, percentage: 100 }
      ];
    }

    return apiData;
  } catch (error) {
    console.error("Erreur récupération données appareils:", error);
    // ✅ Données de fallback
    return [
      { device: "Payé", value: 45, percentage: 45 },
      { device: "Non payé", value: 35, percentage: 35 },
      { device: "Partiellement payé", value: 20, percentage: 20 },
    ];
  }
}