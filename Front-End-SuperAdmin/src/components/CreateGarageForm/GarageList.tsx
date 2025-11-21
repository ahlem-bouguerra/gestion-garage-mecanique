// components/garage/GarageList.tsx
import { Building2, Plus, UserPlus, Eye, Edit ,Trash2} from 'lucide-react';

interface GarageListProps {
  garages: any[];
  onCreateGarage: () => void;
  onAddGaragiste: (garage: any) => void;
  onViewDetails: (garage: any) => void;
  onEditGarage: (garage: any) => void; // ⭐ NOUVEAU
  onDeleteGarage: (garage: any) => void; 
}

export default function GarageList({ 
  garages, 
  onCreateGarage, 
  onAddGaragiste, 
  onViewDetails,
  onEditGarage,
  onDeleteGarage
}: GarageListProps) {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-lg mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Building2 className="h-8 w-8" />
              Gestion des Garages
            </h1>
            <p className="text-blue-100 mt-2">
              {garages.length} garage{garages.length > 1 ? 's' : ''} enregistré{garages.length > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onCreateGarage}
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-md"
          >
            <Plus className="h-5 w-5" />
            Créer un Garage
          </button>
        </div>
      </div>

      {/* Liste des garages */}
      {garages.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun garage</h3>
          <p className="text-gray-500 mb-6">Commencez par créer votre premier garage</p>
          <button
            onClick={onCreateGarage}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Créer un Garage
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {garages.map((garage) => (
            <div
              key={garage._id}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-200"
            >
              {/* Header de la carte */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {garage.nom}
                </h3>
                {garage.matriculeFiscal && (
                  <p className="text-blue-100 text-sm mt-1">
                    MF: {garage.matriculeFiscal}
                  </p>
                )}
              </div>

              {/* Contenu */}
              <div className="p-4 space-y-3">
                {/* Email */}
                {garage.emailProfessionnel && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-gray-500 font-medium">📧</span>
                    <span className="text-gray-700">{garage.emailProfessionnel}</span>
                  </div>
                )}

                {/* Téléphone */}
                {garage.telephoneProfessionnel && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-gray-500 font-medium">📱</span>
                    <span className="text-gray-700">{garage.telephoneProfessionnel}</span>
                  </div>
                )}

                {/* Localisation */}
                {(garage.cityName || garage.governorateName) && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-gray-500 font-medium">📍</span>
                    <span className="text-gray-700">
                      {[garage.cityName, garage.governorateName]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                )}

                {/* Horaires */}
                {garage.horaires && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-gray-500 font-medium">🕒</span>
                    <span className="text-gray-700">{garage.horaires}</span>
                  </div>
                )}

                {/* Services */}
                {garage.services && garage.services.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                      Services
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {garage.services.slice(0, 3).map((service: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                        >
                          {service}
                        </span>
                      ))}
                      {garage.services.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{garage.services.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-4 bg-gray-50 border-t flex gap-4">
                <button
                  onClick={() => onViewDetails(garage)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Eye className="h-4 w-4" />
                
                </button>

                {/* ⭐ NOUVEAU BOUTON MODIFIER */}
                <button
                  onClick={() => onEditGarage(garage)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  <Edit className="h-4 w-4" />
               
                </button>

                <button
                  onClick={() => onAddGaragiste(garage)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  <UserPlus className="h-4 w-4" />
                
                </button>
                  <button
                  onClick={() => onDeleteGarage(garage)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  <Trash2 className="h-4 w-4" />
                 
                </button>
              </div>
           
            </div>
          ))}
        </div>
      )}
    </div>
  );
}