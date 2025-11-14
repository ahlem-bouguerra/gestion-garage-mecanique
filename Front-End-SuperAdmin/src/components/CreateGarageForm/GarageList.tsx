// components/garage/GarageList.tsx
import { Plus, Building2 } from 'lucide-react';
import GarageCard from './GarageCard';

interface GarageListProps {
  garages: any[];
  onCreateGarage: () => void;
  onViewDetails: (garage: any) => void;
}

export default function GarageList({ garages, onCreateGarage,onViewDetails }: GarageListProps) {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Garages</h1>
        <button
          onClick={onCreateGarage}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Créer un Garage
        </button>
      </div>

      {garages.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun garage</h3>
          <p className="text-gray-600 mb-6">Commencez par créer votre premier garage</p>
          <button
            onClick={onCreateGarage}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Créer un Garage
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {garages.map((garage) => (
            <GarageCard
              key={garage._id || garage.id}
              garage={garage}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
}