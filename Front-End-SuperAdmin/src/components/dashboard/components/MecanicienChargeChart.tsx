"use client";
// src/components/dashboard/components/MecanicienChargeChart.tsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MecanicienData {
  _id: { mecanicienNom: string };
  chargeEstimee: number;
  chargeReelle: number;
  nombreTaches: number;
}

interface MecanicienChargeChartProps {
  data: MecanicienData[];
}

export const MecanicienChargeChart: React.FC<MecanicienChargeChartProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Charge par Mécanicien</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="_id.mecanicienNom" width={100} />
          <Tooltip formatter={(value: any) => [`${value}h`, 'Heures']} />
          <Bar dataKey="chargeEstimee" fill="#e5e7eb" name="Estimée" />
          <Bar dataKey="chargeReelle" fill="#3b82f6" name="Réelle" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// src/components/dashboard/components/EfficaciteChart.tsx
export const EfficaciteChart: React.FC<MecanicienChargeChartProps> = ({ data }) => {
  const efficaciteData = data.map(m => ({
    nom: m._id.mecanicienNom.split(' ')[0],
    efficacite: Math.round((m.chargeReelle / m.chargeEstimee) * 100),
    chargeReelle: m.chargeReelle,
    chargeEstimee: m.chargeEstimee
  }));

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Efficacité par Mécanicien</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={efficaciteData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="nom" />
          <YAxis domain={[0, 120]} />
          <Tooltip formatter={(value: any) => [`${value}%`, 'Efficacité']} />
          <Bar dataKey="efficacite" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};