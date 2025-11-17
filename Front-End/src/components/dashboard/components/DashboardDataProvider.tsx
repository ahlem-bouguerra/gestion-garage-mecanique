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

  // ✅ Fonction pour récupérer le token
  const getAuthToken = () => {
    // Vérifier d'abord localStorage, puis sessionStorage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!token) {
      console.error('❌ Aucun token trouvé dans localStorage ou sessionStorage');
    } else {
      console.log('✅ Token trouvé:', token.substring(0, 20) + '...');
    }
    
    return token;
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();

      if (!token) {
        throw new Error('Token d\'authentification manquant. Veuillez vous reconnecter.');
      }

      const params = new URLSearchParams({
        periode,
        ...(atelierId !== 'tous' && { atelier: atelierId })
      });

      const url = `http://localhost:5000/api/dashboard/charge-atelier?${params}`;
      console.log('📡 Requête dashboard:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 Réponse status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          // Token invalide ou expiré
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Erreur ${response.status}`);
      }

      const result = await response.json();
      console.log('📊 Données reçues:', result);

      // ✅ Vérification de la structure des données
      if (!result || !result.statistiques) {
        console.error('⚠️ Structure de données invalide:', result);
        throw new Error('Structure de données invalide reçue du serveur');
      }

      setData(result);
      setError(null);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('❌ Erreur lors de la récupération des données:', errorMessage);
      setError(errorMessage);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les données quand la période ou l'atelier change
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