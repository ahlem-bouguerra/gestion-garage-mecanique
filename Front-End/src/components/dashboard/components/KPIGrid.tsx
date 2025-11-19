"use client";
import React from 'react';
import { Activity, Clock, Calendar, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<any>;
  color?: string;
  trend?: string;
}

interface KPIGridProps {
  statistiques: {
    total: number;
    totalHeuresEstimees: number;
    totalOrdresTermines?: number;
    totalOrdresEnRetard?: number;
    totalOrdresATemps?: number;
    enCours?: number;
    termines?: number;
  };
  tempsMoyenInterventions: {
    tempsMoyenEstime: number;
    tempsMoyenReel?: number;
  };
  periode: 'jour' | 'semaine' | 'mois';
  date?: string;
  hasAccess?: boolean; // ← Ajouter
}

const KPICard: React.FC<KPICardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = '#3b82f6', 
  trend 
}) => (
  <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderLeftColor: color }}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        {trend && (
          <div className="flex items-center mt-2">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm text-green-500">{trend}</span>
          </div>
        )}
      </div>
      <Icon className="h-8 w-8" style={{ color }} />
    </div>
  </div>
);

const KPIGrid: React.FC<KPIGridProps> = ({ 
  statistiques, 
  tempsMoyenInterventions, 
  periode, 
  date,
  hasAccess = true // ← Ajouter avec valeur par défaut
}) => {
  // ✅ Afficher message si pas d'accès
  if (!hasAccess) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-300">
            <div className="flex flex-col items-center justify-center py-4">
              <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
              <p className="text-sm text-gray-600 text-center">Aucun accès</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Vérifications de sécurité (loading state)
  if (!statistiques || !tempsMoyenInterventions) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-gray-300">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const tauxCompletion = statistiques.total > 0
    ? Math.round(((statistiques.totalOrdresTermines || 0) / statistiques.total) * 100)
    : null;

  const tauxPonctualite = statistiques.totalOrdresATemps && statistiques.totalOrdresTermines && statistiques.totalOrdresTermines > 0
    ? Math.round((statistiques.totalOrdresATemps / statistiques.totalOrdresTermines) * 100)
    : null;

  const efficaciteTemps = tempsMoyenInterventions.tempsMoyenReel && tempsMoyenInterventions.tempsMoyenEstime > 0
    ? Math.round((tempsMoyenInterventions.tempsMoyenEstime / tempsMoyenInterventions.tempsMoyenReel) * 100)
    : null;

  const capaciteTheorique = 40;
  const chargeWorkload = Math.round((statistiques.totalHeuresEstimees / capaciteTheorique) * 100);

  const getSubtitle = (baseText: string) => {
    switch(periode) {
      case 'jour':
        return date ? `${baseText} - ${new Date(date).toLocaleDateString('fr-FR')}` : `${baseText} - Aujourd'hui`;
      case 'semaine':
        return `${baseText} - Cette semaine`;
      case 'mois':
        return `${baseText} - Ce mois`;
      default:
        return baseText;
    }
  };

  const getPercentageColor = (percentage: number, reverse: boolean = false) => {
    if (reverse) {
      if (percentage >= 100) return '#ef4444';
      if (percentage >= 80) return '#f59e0b';
      return '#10b981';
    } else {
      if (percentage >= 90) return '#10b981';
      if (percentage >= 70) return '#f59e0b';
      return '#ef4444';
    }
  };

  const getEfficiencyMetric = () => {
    if (tauxCompletion !== null) {
      return {
        value: `${tauxCompletion}%`,
        subtitle: tauxCompletion === 0 ? "Aucun ordre terminé" : "Taux de complétion",
        color: getPercentageColor(tauxCompletion),
        icon: CheckCircle
      };
    }
    
    if (statistiques.total > 0 && statistiques.enCours !== undefined && statistiques.termines !== undefined) {
      const progressionTravaux = Math.round(
        ((statistiques.enCours + statistiques.termines) / statistiques.total) * 100
      );
      return {
        value: `${progressionTravaux}%`,
        subtitle: "Progression des travaux",
        color: getPercentageColor(progressionTravaux),
        icon: Activity
      };
    }
    
    if (statistiques.total > 0 && statistiques.enCours !== undefined) {
      const efficaciteOperationnelle = Math.round(
        (statistiques.enCours / statistiques.total) * 100
      );
      return {
        value: `${efficaciteOperationnelle}%`,
        subtitle: "Travaux en cours",
        color: efficaciteOperationnelle > 50 ? '#10b981' : 
               efficaciteOperationnelle > 25 ? '#f59e0b' : '#ef4444',
        icon: TrendingUp
      };
    }
    
    return {
      value: `${chargeWorkload}%`,
      subtitle: "Charge de travail",
      color: getPercentageColor(chargeWorkload, true),
      icon: Clock
    };
  };

  const efficiencyMetric = getEfficiencyMetric();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <KPICard
        title="Total Ordres"
        value={statistiques.total}
        subtitle={getSubtitle('')}
        icon={Activity}
        color="#3b82f6"
        trend={periode === 'jour' ? undefined : "+12%"}
      />
      <KPICard
        title="Temps Moyen"
        value={tempsMoyenInterventions.tempsMoyenEstime > 0 
          ? `${tempsMoyenInterventions.tempsMoyenEstime.toFixed(1)}h` 
          : '0h'}
        subtitle={tempsMoyenInterventions.tempsMoyenReel 
          ? `Réel: ${tempsMoyenInterventions.tempsMoyenReel.toFixed(1)}h`
          : "Temps estimé"}
        icon={Clock}
        color="#10b981"
      />
      <KPICard
        title="Charge Totale"
        value={`${statistiques.totalHeuresEstimees}h`}
        subtitle={`${chargeWorkload}% de la capacité`}
        icon={Calendar}
        color="#f59e0b"
      />
      <KPICard
        title="Performance"
        value={efficiencyMetric.value}
        subtitle={getSubtitle(efficiencyMetric.subtitle)}
        icon={efficiencyMetric.icon}
        color={efficiencyMetric.color}
        trend={periode === 'jour' ? undefined : "+5%"}
      />
    </div>
  );
};

export default KPIGrid;