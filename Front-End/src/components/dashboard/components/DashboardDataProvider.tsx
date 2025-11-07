"use client";
import React, { useState, useEffect, createContext, useContext } from 'react';

interface DashboardData {
  periode: 'jour' | 'semaine' | 'mois';
  date?: string;
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
  chargeParMecanicien: Array<{
    _id: {
      mecanicienId: string;
      mecanicienNom: string;
    };
    chargeEstimee: number;
    chargeReelle: number;
    nombreTaches: number;
  }>;
}

interface DashboardContextType {
  data: DashboardData | null;
  loading: boolean;
  periode: 'jour' | 'semaine' | 'mois';
  atelierId: string;
  setPeriode: (periode: 'jour' | 'semaine' | 'mois') => void;
  setAtelierId: (id: string) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboardData = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardData must be used within DashboardDataProvider');
  }
  return context;
};

interface DashboardDataProviderProps {
  children: React.ReactNode;
  initialPeriode?: 'jour' | 'semaine' | 'mois';
  initialAtelierId?: string;
}

export const DashboardDataProvider: React.FC<DashboardDataProviderProps> = ({
  children,
  initialPeriode = 'jour',
  initialAtelierId = 'tous'
}) => {
  const [periode, setPeriode] = useState<'jour' | 'semaine' | 'mois'>(initialPeriode);
  const [atelierId, setAtelierId] = useState<string>(initialAtelierId);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          periode,
          ...(atelierId !== 'tous' && { atelier: atelierId })
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

    fetchDashboardData();
  }, [periode, atelierId]);

  return (
    <DashboardContext.Provider
      value={{
        data,
        loading,
        periode,
        atelierId,
        setPeriode,
        setAtelierId
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};