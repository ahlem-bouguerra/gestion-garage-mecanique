// src/components/dashboard/components/DashboardFilters.tsx
import React from 'react';

interface DashboardFiltersProps {
  selectedAtelier: string;
  selectedPeriod: string;
  onPeriodChange: (value: string) => void;
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  selectedAtelier,
  selectedPeriod,
  onPeriodChange
}) => {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      
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