"use client"
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Wrench, 
  DollarSign, 
  FileText, 
  Car,
  User,
  Building2,
  Phone,
  TrendingUp,
  Clock,
  BookOpen
} from 'lucide-react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';

const API_BASE_URL = "http://localhost:5000/api";

interface TacheService {
  pieceId: string;
  piece: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface HistoriqueEntretien {
  _id: string;
  dateCommencement: Date;
  dateFinCompletion?: Date;
  tachesService: TacheService[];
  totalTTC: number;
  statut: 'planifie' | 'en_cours' | 'termine' | 'annule';
  typeEntretien: string;
  notes?: string;
  kilometrageEntretien?: number;
  devisInfo?: {
    id: string;
    inspectionDate: string;
    status: string;
  };
  source: 'carnet' | 'devis';
}

interface VehiculeInfo {
  _id: string;
  marque: string;
  modele: string;
  immatriculation: string;
  typeCarburant: string;
  kilometrage?: number;
  annee?: number;
  proprietaire: {
    _id: string;
    nom: string;
    type: 'particulier' | 'professionnel';
    telephone?: string;
  };
}

interface Stats {
  totalEntretiens: number;
  totalDepense: number;
  dernierEntretien?: Date;
  entretiensMoyenParAn: number;
}

interface CarnetEntretienData {
  vehicule: VehiculeInfo;
  historique: HistoriqueEntretien[];
}

const CarnetEntretien: React.FC = () => {
  const [data, setData] = useState<CarnetEntretienData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const vehiculeId = searchParams.get('vehiculeId');

  useEffect(() => {
    if (vehiculeId) {
      fetchCarnetEntretien(vehiculeId);
    } else {
      setError("ID véhicule manquant");
      setLoading(false);
    }
  }, [vehiculeId]);

  const fetchCarnetEntretien = async (vehiculeId: string) => {
    try {
      setLoading(true);
      setError("");
      
      const response = await axios.get(`${API_BASE_URL}/carnet-entretien/vehicule/${vehiculeId}`);
      setData(response.data);
    } catch (error: any) {
      console.error("Erreur chargement carnet d'entretien:", error);
      setError(error.response?.data?.error || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return price.toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' TND';
  };

  const getStatutBadge = (statut: string) => {
    const badges = {
      'planifie': 'bg-blue-100 text-blue-800',
      'en_cours': 'bg-yellow-100 text-yellow-800',
      'termine': 'bg-green-100 text-green-800',
      'annule': 'bg-red-100 text-red-800'
    };

    const labels = {
      'planifie': 'Planifié',
      'en_cours': 'En cours',
      'termine': 'Terminé',
      'annule': 'Annulé'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[statut as keyof typeof badges] || badges.termine}`}>
        {labels[statut as keyof typeof labels] || statut}
      </span>
    );
  };

  const getTypeEntretienIcon = (type: string) => {
    switch (type) {
      case 'revision': return <Calendar className="w-4 h-4" />;
      case 'reparation': return <Wrench className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement du carnet d'entretien...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Erreur</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">Aucune donnée disponible</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header avec bouton retour */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Carnet d'Entretien</h1>
        </div>

        {/* Informations du véhicule */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Car className="w-8 h-8 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {data.vehicule.marque} {data.vehicule.modele}
                </h2>
                <p className="text-gray-600">{data.vehicule.immatriculation}</p>
                 <p className="text-gray-600">{data.vehicule.typeCarburant}</p>
                {data.vehicule.annee && (
                  <p className="text-sm text-gray-500">Année: {data.vehicule.annee}</p>
                )}
                {data.vehicule.typeCarburant && (
                <p className="text-sm text-gray-500">Type Carburant: {data.vehicule.typeCarburant}</p>
                )}

                {data.vehicule.kilometrage && (
                <p className="text-sm text-gray-500">Kilométrage: {data.vehicule.kilometrage.toLocaleString('fr-FR')} km</p>
                )}

                
              </div>
            </div>
          </div>

          {/* Propriétaire */}
          <div className="border-t pt-4">
            <div className="flex items-center space-x-2 mb-2">
              {data.vehicule.proprietaire.type === 'professionnel' ? (
                <Building2 className="w-4 h-4 text-blue-600" />
              ) : (
                <User className="w-4 h-4 text-green-600" />
              )}
              <span className="font-medium text-gray-900">
                {data.vehicule.proprietaire.nom}
              </span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                data.vehicule.proprietaire.type === 'professionnel' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {data.vehicule.proprietaire.type === 'professionnel' ? 'Professionnel' : 'Particulier'}
              </span>
            </div>
            {data.vehicule.proprietaire.telephone && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{data.vehicule.proprietaire.telephone}</span>
              </div>
            )}
          </div>
        </div>

       

        {/* Historique des entretiens */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Historique des Entretiens</h3>
          </div>

          {data.historique.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>Aucun entretien enregistré pour ce véhicule</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {data.historique.map((entretien) => (
                <div key={entretien._id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg mt-1">
                        {getTypeEntretienIcon(entretien.typeEntretien)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-gray-900">
                            Entretien du {formatDate(entretien.dateCommencement)}
                          </h4>
                          
                          
                        </div>
                        {entretien.devisInfo && (
                          <p className="text-sm text-gray-600">
                            Réf. Devis: {entretien.devisInfo.id}
                          </p>
                        )}
                        {entretien.kilometrageEntretien && (
                          <p className="text-sm text-gray-600">
                            Kilométrage: {entretien.kilometrageEntretien.toLocaleString('fr-FR')} km
                          </p>
                        )}
                        {entretien.dateFinCompletion && (
                          <p className="text-sm text-gray-600">
                            Terminé le: {formatDate(entretien.dateFinCompletion)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500"> TOTAL TTC</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatPrice(entretien.totalTTC)}
                      </p>
                    </div>
                  </div>

                  {/* Services/Tâches */}
                  {entretien.tachesService && entretien.tachesService.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Services effectués:</h5>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="space-y-2">
                          {entretien.tachesService.map((tache, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <div className="flex-1">
                                <span className="font-medium">{tache.piece}</span>
                                {tache.quantity > 1 && (
                                  <span className="text-gray-500 ml-1">x{tache.quantity}</span>
                                )}
                              </div>
                              <span className="text-gray-700 font-medium">
                                {formatPrice(tache.total)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {entretien.notes && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Notes:</strong> {entretien.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarnetEntretien;