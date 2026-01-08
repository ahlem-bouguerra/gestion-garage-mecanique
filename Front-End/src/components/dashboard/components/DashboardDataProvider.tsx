"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
    nombreTaches: number;
  }>;
}

interface DashboardContextType {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  periode: 'jour' | 'semaine' | 'mois';
  atelierId: string;
  setPeriode: (periode: 'jour' | 'semaine' | 'mois') => void;
  setAtelierId: (atelierId: string) => void;
  refetch: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

interface DashboardDataProviderProps {
  children: ReactNode;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthToken = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return token;
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();

      if (!token) {
        setError('Aucun accès');
        setData(null);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        periode,
        ...(atelierId !== 'tous' && { atelier: atelierId })
      });

      const url = `http://localhost:5000/api/dashboard/charge-atelier?${params}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          setError('Aucun accès');
        } else {
          setError('Aucun accès');
        }
        setData(null);
        setLoading(false);
        return;
      }

      const result = await response.json();

      if (!result || !result.statistiques) {
        setError('Aucun accès');
        setData(null);
        setLoading(false);
        return;
      }

      setData(result);
      setError(null);

    } catch (err) {
      setError('Aucun accès');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [periode, atelierId]);

  const contextValue: DashboardContextType = {
    data,
    loading,
    error,
    periode,
    atelierId,
    setPeriode,
    setAtelierId,
    refetch: fetchDashboardData
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboardData = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboardData must be used within a DashboardDataProvider');
  }
  return context;
};