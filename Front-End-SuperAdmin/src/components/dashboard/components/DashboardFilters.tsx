// src/components/dashboard/components/DashboardFilters.tsx
import React from 'react';

interface DashboardFiltersProps {
  selectedAtelier: string;
  selectedPeriod: string;
  onAtelierChange: (value: string) => void;
  onPeriodChange: (value: string) => void;
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  selectedAtelier,
  selectedPeriod,
  onAtelierChange,
  onPeriodChange
}) => {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <select 
        value={selectedAtelier} 
        onChange={(e) => onAtelierChange(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="tous">Tous les ateliers</option>
        <option value="atelier1">Atelier Principal</option>
        <option value="atelier2">Atelier Secondaire</option>
      </select>
      
      <select 
        value={selectedPeriod} 
        onChange={(e) => onPeriodChange(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="jour">Par jour</option>
        <option value="semaine">Par semaine</option>
        <option value="mois">Par mois</option>
      </select>
    </div>
  );
};

export default DashboardFilters;