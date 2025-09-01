import React from 'react';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
    <div className="border-b border-gray-200">
      <nav className="flex space-x-8 px-6">
        <button
          onClick={() => onTabChange('create')}
          className={`py-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'create'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Créer Ordre de Travail
        </button>
        <button
          onClick={() => onTabChange('list')}
          className={`py-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'list'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Liste des Ordres
        </button>
      </nav>
    </div>
  </div>
);