import React from 'react';
import { Statistiques as StatistiquesType } from '../types';

interface StatistiquesProps {
  statistiques: StatistiquesType;
}

export const Statistiques: React.FC<StatistiquesProps> = ({ statistiques }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Statistiques des Ordres de Travail</h3>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-blue-50 p-4 rounded-lg text-center">
        <div className="text-2xl font-bold text-blue-600">{statistiques.total}</div>
        <div className="text-sm text-gray-600">Total</div>
      </div>
      <div className="bg-green-50 p-4 rounded-lg text-center">
        <div className="text-2xl font-bold text-green-600">{statistiques.termines}</div>
        <div className="text-sm text-gray-600">Terminés</div>
      </div>
      <div className="bg-yellow-50 p-4 rounded-lg text-center">
        <div className="text-2xl font-bold text-yellow-600">{statistiques.enCours}</div>
        <div className="text-sm text-gray-600">En Cours</div>
      </div>
      <div className="bg-red-50 p-4 rounded-lg text-center">
        <div className="text-2xl font-bold text-red-600">{statistiques.suspendus}</div>
        <div className="text-sm text-gray-600">Suspendus</div>
      </div>
    </div>
  </div>
);