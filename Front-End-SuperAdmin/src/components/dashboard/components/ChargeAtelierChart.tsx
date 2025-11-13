"use client";
// src/components/dashboard/components/ChargeAtelierChart.tsx
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChargeData {
  _id: { year: number; week: number };
  chargeEstimee: number;
  nombreOrdres: number;
}

interface ChargeAtelierChartProps {
  data: ChargeData[];
}

const ChargeAtelierChart: React.FC<ChargeAtelierChartProps> = ({ data }) => {
  const chartData = data.map(item => ({
    semaine: `S${item._id.week}`,
    estimee: item.chargeEstimee,
    ordres: item.nombreOrdres
  }));

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Charge Atelier - Évolution Hebdomadaire</h2>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="semaine" />
          <YAxis />
          <Tooltip 
            formatter={(value: any, name: string) => [
              `${value}h`, 
              name === 'estimee' ? 'Estimée' : 'Réelle'
            ]}
          />
          <Area 
            type="monotone" 
            dataKey="estimee" 
            stackId="1" 
            stroke="#3b82f6" 
            fill="#3b82f6" 
            fillOpacity={0.3}
          />
          <Area 
            type="monotone" 
            dataKey="reelle" 
            stackId="2" 
            stroke="#10b981" 
            fill="#10b981" 
            fillOpacity={0.6}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChargeAtelierChart;