import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface HeaderProps {
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onBack }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ordres de Travail</h1>
        <p className="text-gray-600">Gestion des ordres de travail pour l'atelier</p>
      </div>
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Retour</span>
        </button>
      )}
    </div>
  </div>
);
