// src/components/dashboard/components/EfficaciteChart.tsx
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

interface MecanicienData {
  _id: { mecanicienNom: string };
  chargeEstimee: number;
  nombreTaches: number;
  chargeReelle?: number; // Optionnel si pas disponible
}

interface EfficaciteChartProps {
  data: MecanicienData[];
}

const EfficaciteChart: React.FC<EfficaciteChartProps> = ({ data }) => {
  // Transformation des données pour le graphique d'efficacité
  const efficaciteData = data.map(m => {
    // Si pas de chargeReelle, utiliser une estimation basée sur les tâches
    const chargeReelle = m.chargeReelle || (m.chargeEstimee * 0.9); // Exemple : 90% du temps estimé
    const efficacite = m.chargeEstimee > 0 ? Math.round((chargeReelle / m.chargeEstimee) * 100) : 0;
    const nom = m._id.mecanicienNom.split(' ')[0];
    
    return {
      nom,
      nomComplet: m._id.mecanicienNom,
      efficacite,
      chargeReelle,
      chargeEstimee: m.chargeEstimee,
      nombreTaches: m.nombreTaches,
      couleur: efficacite >= 95 ? '#10b981' :
               efficacite >= 85 ? '#3b82f6' :
               efficacite >= 75 ? '#f59e0b' :
               '#ef4444'
    };
  }).sort((a, b) => b.efficacite - a.efficacite);

  // Si pas de données réelles, afficher un message
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Efficacité par Mécanicien
        </h2>
        <div className="text-center py-8 text-gray-500">
          <p>Aucune donnée disponible pour cette période</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-md">
          <p className="font-medium text-gray-900">{data.nomComplet}</p>
          <div className="mt-2 space-y-1 text-sm">
            <p className="text-blue-600">
              Efficacité: <span className="font-medium">{data.efficacite}%</span>
            </p>
            <p className="text-gray-600">
              Temps réel: <span className="font-medium">{data.chargeReelle.toFixed(1)}h</span>
            </p>
            <p className="text-gray-600">
              Temps estimé: <span className="font-medium">{data.chargeEstimee.toFixed(1)}h</span>
            </p>
            <p className="text-gray-600">
              Nombre de tâches: <span className="font-medium">{data.nombreTaches}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const moyenneEfficacite = efficaciteData.length > 0 ? Math.round(
    efficaciteData.reduce((sum, item) => sum + item.efficacite, 0) / efficaciteData.length
  ) : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Efficacité par Mécanicien
        </h2>
        <div className="text-right">
          <p className="text-sm text-gray-500">Moyenne équipe</p>
          <p className="text-lg font-semibold text-blue-600">{moyenneEfficacite}%</p>
        </div>
      </div>

      <div className="mb-4">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={efficaciteData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="nom" 
              tick={{ fontSize: 12 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              domain={[0, 120]}
              tick={{ fontSize: 12 }}
              label={{ value: 'Efficacité (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="efficacite" radius={[4, 4, 0, 0]}>
              {efficaciteData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.couleur} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Légende des couleurs */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
          <span>≥95% - Excellent</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
          <span>85-94% - Bon</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
          <span>75-84% - Moyen</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
          <span>&lt;75% - À améliorer</span>
        </div>
      </div>

      {/* Statistiques rapides */}
      {efficaciteData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Meilleure performance</p>
              <p className="font-medium text-green-600">
                {efficaciteData[0]?.nom} ({efficaciteData[0]?.efficacite}%)
              </p>
            </div>
            <div>
              <p className="text-gray-500">À surveiller</p>
              <p className="font-medium text-orange-600">
                {efficaciteData.find(m => m.efficacite < 85)?.nom || 'Aucun'} 
                {efficaciteData.find(m => m.efficacite < 85) && 
                  ` (${efficaciteData.find(m => m.efficacite < 85)?.efficacite}%)`
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EfficaciteChart;