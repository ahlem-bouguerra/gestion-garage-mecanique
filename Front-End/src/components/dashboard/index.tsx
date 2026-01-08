"use client";
import React, { useState, useEffect } from 'react';
import KPIGrid from './components/KPIGrid';
import DashboardFilters from './components/DashboardFilters';
import StatusPieChart from './components/StatusPieChart';
import { ChargeMensuelle } from "./charts/charge-mensuelle"
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

const Dashboard: React.FC = () => {
  const [periode, setPeriode] = useState<'jour' | 'semaine' | 'mois'>('jour');
  const [atelierId, setAtelierId] = useState<string>('tous');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasAccess, setHasAccess] = useState(true);

  const getAuthToken = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token && token !== 'null' && token !== 'undefined') {
      return token;
    }
    return null;
  };
const fetchDashboardData = async () => {
  setLoading(true);
  try {
    const token = getAuthToken();
    
    if (!token) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({
      periode,
      ...(atelierId !== 'tous' && { atelier: atelierId })
    });

    const response = await fetch(`http://localhost:5000/api/dashboard/charge-atelier?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        setHasAccess(false);
        setLoading(false);
        return;
      }
      throw new Error('Erreur serveur');
    }

    const result = await response.json();
    setData(result);
    setHasAccess(true);
  } catch (error) {
    setHasAccess(false);
  } finally {
    setLoading(false);
  }
};

  // Récupérer les données quand la période ou l'atelier change
  useEffect(() => {
    fetchDashboardData();
  }, [periode, atelierId]);

  // Gestionnaires pour les filtres
  const handleAtelierChange = (nouvelAtelier: string) => {
    setAtelierId(nouvelAtelier);
  };

  const handlePeriodChange = (nouvellePeriode: string) => {
    setPeriode(nouvellePeriode as 'jour' | 'semaine' | 'mois');
  };

  return (

      <div  className="space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Tableau de bord Atelier
          </h1>
          
          {/* Utilisation du composant DashboardFilters */}
          <DashboardFilters
            selectedAtelier={atelierId}
            selectedPeriod={periode}
            onAtelierChange={handleAtelierChange}
            onPeriodChange={handlePeriodChange}
          />

          {/* Message informatif pour le mode jour */}
          {periode === 'jour' && (
            <div className="flex items-center text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
              📅 Affichage des données d'aujourd'hui uniquement
            </div>
          )}
        </div>

        {/* Contenu principal */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : !hasAccess ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucun accès</h2>
                  <p className="text-gray-600">Vous n'avez pas accès à ces données</p>
                </div>
              </div>
            ) : data ? (
              <>
                <KPIGrid
                  statistiques={data.statistiques}
                  tempsMoyenInterventions={data.tempsMoyenInterventions}
                  periode={data.periode}
                  date={data.date}
                  hasAccess={hasAccess}
                />
           
            
            
            {/* Affichage conditionnel pour les données du jour */}
            {periode === 'jour' && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Résumé d'aujourd'hui ({data.date})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {data.statistiques.total}
                    </p>
                    <p className="text-sm text-gray-600">Ordres créés aujourd'hui</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {data.statistiques.totalHeuresEstimees}h
                    </p>
                    <p className="text-sm text-gray-600">Heures de travail planifiées</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {data.chargeParMecanicien ? data.chargeParMecanicien.length : 0}
                    </p>
                    <p className="text-sm text-gray-600">Mécaniciens actifs</p>
                  </div>
                </div>
              </div>
            )}

            {/* Charge par mécanicien */}
            {data.chargeParMecanicien && data.chargeParMecanicien.length > 0 && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     {/* StatusPieChart à gauche */}
                     <div className="bg-white rounded-lg shadow-md p-6">
                       <h2 className="text-xl font-semibold text-gray-900 mb-4">
                         Répartition des statuts
                       </h2>
                       <StatusPieChart statistiques={data.statistiques} />
                     </div>
             
                     {/* Charge par mécanicien à droite */}
                     {data.chargeParMecanicien && data.chargeParMecanicien.length > 0 && (
                       <div className="bg-white rounded-lg shadow-md p-6">
                         <h2 className="text-xl font-semibold text-gray-900 mb-4">
                           Charge par mécanicien {periode === 'jour' ? "(aujourd'hui)" : ''}
                         </h2>
                         <div className="space-y-4 max-h-96 overflow-y-auto">
                           {data.chargeParMecanicien.map((mecanicien, index) => (
                             <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                               <div>
                                 <h3 className="font-medium text-gray-900">
                                   {mecanicien._id.mecanicienNom}
                                 </h3>
                                 <p className="text-sm text-gray-600">
                                   {mecanicien.nombreTaches} tâche(s)
                                 </p>
                               </div>
                               <div className="text-right">
                                 <p className="text-lg font-semibold text-blue-600">
                                   {mecanicien.chargeEstimee}h
                                 </p>
                                 <p className="text-sm text-gray-500">Charge estimée</p>
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}
                   </div>
            )}
            <ChargeMensuelle atelierId={atelierId} className="mb-6" />
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucune donnée disponible</p>
          </div>
        )}
      </div>
 
  );
};

export default Dashboard;