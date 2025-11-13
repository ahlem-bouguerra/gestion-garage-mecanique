"use client";
// src/components/dashboard/components/ChargeJournaliereChart.tsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChargeJournaliereData {
  jour: string;
  charge: number;
  ordres: number;
}

interface ChargeJournaliereChartProps {
  data: ChargeJournaliereData[];
}

export const ChargeJournaliereChart: React.FC<ChargeJournaliereChartProps> = ({ data }) => {
  return (
    <div className="mt-8 bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Charge Journalière - 7 Derniers Jours</h2>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="jour" 
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getDate()}/${date.getMonth() + 1}`;
            }}
          />
          <YAxis />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip 
            labelFormatter={(value) => {
              const date = new Date(value as string);
              return date.toLocaleDateString('fr-FR');
            }}
            formatter={(value: any, name: string) => [
              name === 'charge' ? `${value}h` : value,
              name === 'charge' ? 'Charge' : 'Nombre d\'ordres'
            ]}
          />
          <Line 
            type="monotone" 
            dataKey="charge" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="ordres" 
            stroke="#10b981" 
            strokeWidth={2}
            yAxisId="right"
            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// src/components/dashboard/components/AlertsSection.tsx
import { AlertTriangle } from 'lucide-react';

export const AlertsSection: React.FC = () => {
  return (
    <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
      <div className="flex">
        <AlertTriangle className="h-5 w-5 text-yellow-400 mr-3" />
        <div>
          <p className="text-sm text-yellow-700">
            <strong>Alertes:</strong> 2 ordres en retard • Charge élevée prévue pour la semaine prochaine (100h)
          </p>
        </div>
      </div>
    </div>
  );
};