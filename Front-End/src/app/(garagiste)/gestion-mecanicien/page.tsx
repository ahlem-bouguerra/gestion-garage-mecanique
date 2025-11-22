
"use client"
import React, { useState } from 'react';
import { Users, Building, Settings,Wrench } from 'lucide-react';
import MecaniciensManager from "@/components/gestion-mecanicien";
import AtelierManager from "@/components/gestion-atelier";
import ServicesManager from "@/components/gestion-service";

// Type definitions
type TabType = 'employé' | 'ateliers';

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ElementType;
  description: string;
  component: React.ComponentType<any>;
}

interface UnifiedManagementDashboardProps {
  selectedTimeFrame?: string;
  extractTimeFrame: any;
}

const UnifiedManagementDashboard: React.FC<UnifiedManagementDashboardProps> = ({ 
  selectedTimeFrame, 
  extractTimeFrame 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('employé');

  const tabs: TabConfig[] = [
    {
      id: 'employé',
      label: 'Employés',
      icon: Users,
      description: 'Gestion du personnel technique',
      component: MecaniciensManager
    },
    {
      id: 'ateliers',
      label: 'Ateliers',
      icon: Building,
      description: 'Gestion des espaces de travail',
      component: AtelierManager
    },
    {
      id: 'service',
      label: 'services',
      icon: Wrench,
      description: 'Gestion des services de travail',
      component: ServicesManager
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || (() => null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="px-6 py-8">
          {/* Navigation Tabs */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-2xl p-2 shadow-lg border border-gray-200">
              <div className="flex space-x-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-3 px-6 py-4 rounded-xl font-medium transition-all duration-300 ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${activeTab === tab.id ? 'text-white' : 'text-gray-500'}`} />
                      <div className="text-left">
                        <div className="font-semibold">{tab.label}</div>
                        <div className={`text-xs ${activeTab === tab.id ? 'text-blue-100' : 'text-gray-500'}`}>
                          {tab.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-8">
          <div className="transition-all duration-500 ease-in-out">
            <div className="col-span-12 xl:col-span-5">
              <ActiveComponent 
                selectedTimeFrame={selectedTimeFrame}
                extractTimeFrame={extractTimeFrame}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedManagementDashboard;