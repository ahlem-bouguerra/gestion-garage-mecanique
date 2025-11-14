// components/garage/GarageCard.tsx
import { Building2, MapPin, Users } from 'lucide-react';

interface GarageCardProps {
  garage: any;
  onAddGaragiste: (garage: any) => void;
  onViewDetails: (garage: any) => void;
}

export default function GarageCard({ garage, onAddGaragiste, onViewDetails }: GarageCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow overflow-hidden">


      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{garage.nom}</h3>
            <p className="text-sm text-gray-500">{garage.matriculefiscal}</p>
          </div>
          <Building2 className="w-8 h-8 text-blue-600" />
        </div>

        {garage.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{garage.description}</p>
        )}

        <div className="space-y-2 mb-4">
          {(garage.governorateName || garage.cityName) && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{[garage.cityName, garage.governorateName].filter(Boolean).join(', ')}</span>
            </div>
          )}

          {garage.horaires && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Horaires:</span>
              <span>{garage.horaires}</span>
            </div>
          )}
        </div>

        {garage.services && garage.services.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 mb-2">SERVICES</p>
            <div className="flex flex-wrap gap-2">
              {garage.services.slice(0, 3).map((service: string, idx: number) => (
                <span key={idx} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">
                  {service}
                </span>
              ))}
              {garage.services.length > 3 && (
                <span className="text-xs text-gray-500">+{garage.services.length - 3}</span>
              )}
            </div>
          </div>
        )}
<div className="flex flex-col gap-2">
  <button
    onClick={() => onAddGaragiste(garage)}
    className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
  >
    <Users className="w-4 h-4" />
    Ajouter un Garagiste
  </button>

  <button
    onClick={() => onViewDetails(garage)}
    className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
  >
    Voir détails
  </button>
</div>

      </div>
    </div>
  );
}