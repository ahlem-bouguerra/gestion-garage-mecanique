"use client";
import React from 'react';
import { DashboardDataProvider, useDashboardData } from './DashboardDataProvider';
import StatusPieChart from '@/components/dashboard/components/StatusPieChart';
import KPIGrid from '@/components/dashboard/components/KPIGrid';
import DashboardFilters from '@/components/dashboard/components/DashboardFilters';
import { ChargeMensuelle } from "@/components/dashboard/charts/charge-mensuelle";

// Composant interne qui utilise les données du contexte
const DashboardContent: React.FC = () => {
  const { data, loading, periode, atelierId, setPeriode, setAtelierId } = useDashboardData();

  // Gestionnaires pour les filtres
  const handleAtelierChange = (nouvelAtelier: string) => {
    setAtelierId(nouvelAtelier);
  };

  const handlePeriodChange = (nouvellePeriode: string) => {
    setPeriode(nouvellePeriode as 'jour' | 'semaine' | 'mois');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec filtres */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Tableau de bord Atelier
        </h1>
        
        <DashboardFilters
          selectedAtelier={atelierId}
          selectedPeriod={periode}
          onAtelierChange={handleAtelierChange}
          onPeriodChange={handlePeriodChange}
        />

        {/* Message informatif pour le mode jour */}
        {periode === 'jour' && (
          <div className="flex items-center text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg mt-4">
            📅 Affichage des données d'aujourd'hui uniquement
          </div>
        )}
      </div>

      {/* KPI Grid */}
      <KPIGrid
        statistiques={data.statistiques}
        tempsMoyenInterventions={data.tempsMoyenInterventions}
        periode={data.periode}
        date={data.date}
      />

     

      {/* Résumé d'aujourd'hui (seulement pour période jour) */}
      {periode === 'jour' && (
        <div className="bg-white rounded-lg shadow-md p-6">
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

      {/* Grid avec StatusPieChart et Charge par mécanicien côte à côte */}
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
       {/* Charge Mensuelle - Pleine largeur */}
      <ChargeMensuelle atelierId={atelierId} />
    </div>
  );
};

// Composant principal exporté avec le Provider
export const HomeDashboardSection: React.FC = () => {
  return (
    <DashboardDataProvider initialPeriode="jour" initialAtelierId="tous">
      <DashboardContent />
    </DashboardDataProvider>
  );
};