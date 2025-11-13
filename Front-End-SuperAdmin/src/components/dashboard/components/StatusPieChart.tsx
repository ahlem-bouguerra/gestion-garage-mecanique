"use client";
// src/components/dashboard/components/StatusPieChart.tsx
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface StatusData {
  enAttente: number;
  enCours: number;
  termines: number;
  suspendus: number;
}

interface StatusPieChartProps {
  statistiques: StatusData;
}

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'];

const StatusPieChart: React.FC<StatusPieChartProps> = ({ statistiques }) => {
const statusData = [
  { name: 'En attente', value: statistiques.enAttente, color: '#f59e0b' },
  { name: 'En cours', value: statistiques.enCours, color: '#3b82f6' },
  { name: 'Terminés', value: statistiques.termines, color: '#10b981' },
].filter(item => item.value > 0);  // ← AJOUTEZ CETTE LIGNE

  const renderLabel = ({ name, percent }: any) => 
    `${name}: ${(percent * 100).toFixed(0)}%`;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Répartition des Ordres par Statut</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={statusData}
            cx="50%"
            cy="50%"
            outerRadius={100}
            dataKey="value"
            label={renderLabel}
            labelLine={false}
          >
            {statusData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value: any) => [`${value}`, 'Ordres']} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatusPieChart;