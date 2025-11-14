// components/garage/GarageDetails.tsx
"use client";

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Clock, 
  Users, 
  Plus,
  Mail,
  Phone,
  Shield,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { getGarageById } from './api';

interface GarageDetailsProps {
  garageId: string;
  onBack: () => void;
  onAddGaragiste: (garage: any) => void;
}

export default function GarageDetails({ garageId, onBack, onAddGaragiste }: GarageDetailsProps) {
  const [garage, setGarage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGarageDetails();
  }, [garageId]);

  const fetchGarageDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getGarageById(garageId);
      setGarage(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <h3 className="text-red-900 font-semibold mb-1">Erreur</h3>
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
        <button
          onClick={onBack}
          className="mt-4 text-blue-600 hover:text-blue-700 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
      </div>
    );
  }

  if (!garage) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header avec bouton retour */}
      <button
        onClick={onBack}
        className="mb-6 text-gray-600 hover:text-gray-900 flex items-center gap-2 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour à la liste
      </button>

      {/* Informations du garage */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
       

        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="w-8 h-8 text-blue-600" />
                <h1 className="text-4xl font-bold text-gray-900">{garage.nom}</h1>
              </div>
              <p className="text-gray-500 text-lg">Matricule: {garage.matriculeFiscal}</p>
            </div>
          </div>

          {garage.description && (
            <p className="text-gray-700 text-lg mb-6 leading-relaxed">{garage.description}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {(garage.governorateName || garage.cityName || garage.streetAddress) && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Adresse</p>
                  <p className="text-gray-600">
                    {garage.streetAddress && <span>{garage.streetAddress}<br /></span>}
                    {[garage.cityName, garage.governorateName].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            )}

            {garage.horaires && (
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Horaires</p>
                  <p className="text-gray-600">{garage.horaires}</p>
                </div>
              </div>
            )}
          </div>

          {garage.services && garage.services.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Services proposés
              </h3>
              <div className="flex flex-wrap gap-2">
                {garage.services.map((service: string, idx: number) => (
                  <span
                    key={idx}
                    className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section Garagistes */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-7 h-7 text-blue-600" />
            Équipe du garage
          </h2>
          <button
            onClick={() => onAddGaragiste(garage)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Ajouter un garagiste
          </button>
        </div>

        {garage.garagistes && garage.garagistes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {garage.garagistes.map((garagiste: any) => (
              <div
                key={garagiste._id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{garagiste.username}</h3>
                      {garagiste.roles && garagiste.roles.length > 0 && (
                        <span className="inline-block mt-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded font-medium">
                          {garagiste.roles[0].name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${garagiste.email}`} className="hover:text-blue-600">
                      {garagiste.email}
                    </a>
                  </div>
                  
                  {garagiste.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <a href={`tel:${garagiste.phone}`} className="hover:text-blue-600">
                        {garagiste.phone}
                      </a>
                    </div>
                  )}

                  {garagiste.isVerified !== undefined && (
                    <div className="pt-2 mt-2 border-t border-gray-200">
                      <span className={`text-xs font-medium ${
                        garagiste.isVerified 
                          ? 'text-green-600' 
                          : 'text-orange-600'
                      }`}>
                        {garagiste.isVerified ? '✓ Compte vérifié' : '⚠ En attente de vérification'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun garagiste</h3>
            <p className="text-gray-600 mb-6">Ce garage n'a pas encore de membre dans l'équipe</p>
            <button
              onClick={() => onAddGaragiste(garage)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Ajouter le premier garagiste
            </button>
          </div>
        )}
      </div>
    </div>
  );
}