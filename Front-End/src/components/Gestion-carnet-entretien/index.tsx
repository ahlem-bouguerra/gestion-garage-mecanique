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
  BookOpen,
  Plus,
  X,
  Save
} from 'lucide-react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';

const API_BASE_URL = "http://localhost:5000/api";

interface HistoriqueEntretien {
  _id: string;
  dateCommencement: Date;
  totalTTC: number;
  typeEntretien: string;
  kilometrageEntretien?: number;
  devisInfo?: {
    id: string;
    inspectionDate: string;
    status: string;
  };
  source: 'carnet' | 'devis' | 'ordre';

  // CHAMPS POUR LES ORDRES DE TRAVAIL
  numeroOrdre?: string;
  taches?: Array<{
    quantite: number;
    description: string;
    serviceNom: string;
  }>;

  // CHAMPS POUR LES SERVICES DU CARNET
  services?: Array<{
    nom: string;
    description?: string;
    quantite?: number;
    prix?: number;
  }>;
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
  
  // ✅ NOUVEAUX ÉTATS POUR LE FORMULAIRE
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // État pour le formulaire d'ajout
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    taches: [{ description: '', quantite: 1, prix: 0 }],
    cout: 0
  });

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

  // ✅ FONCTION POUR AJOUTER UNE ENTRÉE MANUELLE
  const ajouterEntretienManuel = async () => {
    if (!vehiculeId) return;

    try {
      setSaving(true);
      
      const response = await axios.post(`${API_BASE_URL}/creer-manuel`, {
        vehiculeId,
        date: formData.date,
        taches: formData.taches.map(tache => ({
          nom: 'Entretien',
          description: tache.description,
          quantite: tache.quantite,
          prix: tache.prix
        })),
        cout: formData.cout
      });

      // Rafraîchir les données
      await fetchCarnetEntretien(vehiculeId);
      
      // Réinitialiser le formulaire
      setFormData({
        date: new Date().toISOString().split('T')[0],
        taches: [{ description: '', quantite: 1, prix: 0 }],
        cout: 0
      });
      setShowAddForm(false);

    } catch (error: any) {
      console.error("Erreur ajout entretien:", error);
      setError(error.response?.data?.error || "Erreur lors de l'ajout");
    } finally {
      setSaving(false);
    }
  };

  // Ajouter une tâche au formulaire
  const ajouterTache = () => {
    setFormData(prev => ({
      ...prev,
      taches: [...prev.taches, { description: '', quantite: 1, prix: 0 }]
    }));
  };

  // Supprimer une tâche du formulaire
  const supprimerTache = (index: number) => {
    if (formData.taches.length > 1) {
      setFormData(prev => ({
        ...prev,
        taches: prev.taches.filter((_, i) => i !== index)
      }));
    }
  };

  // Mettre à jour une tâche
  const mettreAJourTache = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      taches: prev.taches.map((tache, i) => 
        i === index ? { ...tache, [field]: value } : tache
      )
    }));
  };

  // Calculer le coût total automatiquement
  useEffect(() => {
    const total = formData.taches.reduce((sum, tache) => sum + (tache.prix * tache.quantite), 0);
    setFormData(prev => ({ ...prev, cout: total }));
  }, [formData.taches]);

  const getTypeEntretienIcon = (type: string) => {
    switch (type) {
      case 'revision': return <Calendar className="w-4 h-4" />;
      case 'reparation': return <Wrench className="w-4 h-4" />;
      case 'maintenance': return <Wrench className="w-4 h-4 text-orange-600" />;
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
              <span className={`px-2 py-1 text-xs rounded-full ${data.vehicule.proprietaire.type === 'professionnel'
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
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Historique des Entretiens</h3>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter Entretien</span>
            </button>
          </div>

          {/* Formulaire d'ajout */}
          {showAddForm && (
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h4 className="text-md font-semibold text-gray-900 mb-4">Nouvel Entretien</h4>
              
              {/* Date */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Date d'entretien</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Tâches */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Tâches effectuées</label>
                  <button
                    type="button"
                    onClick={ajouterTache}
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Ajouter tâche</span>
                  </button>
                </div>
                
                {formData.taches.map((tache, index) => (
                  <div key={index} className="flex space-x-2 mb-2 items-end">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Description de la tâche"
                        value={tache.description}
                        onChange={(e) => mettreAJourTache(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="w-20">
                      <input
                        type="number"
                        placeholder="Qté"
                        min="1"
                        value={tache.quantite}
                        onChange={(e) => mettreAJourTache(index, 'quantite', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        placeholder="Prix"
                        min="0"
                        step="0.001"
                        value={tache.prix}
                        onChange={(e) => mettreAJourTache(index, 'prix', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    {formData.taches.length > 1 && (
                      <button
                        type="button"
                        onClick={() => supprimerTache(index)}
                        className="p-2 text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Coût total */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Coût Total (TND)</label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.cout}
                  onChange={(e) => setFormData(prev => ({ ...prev, cout: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Calculé automatiquement: {formatPrice(formData.taches.reduce((sum, t) => sum + (t.prix * t.quantite), 0))}
                </p>
              </div>

              {/* Boutons */}
              <div className="flex space-x-3">
                <button
                  onClick={ajouterEntretienManuel}
                  disabled={saving || !formData.taches.some(t => t.description.trim())}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

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
                            {entretien.source === 'ordre' ? 'Ordre de Travail' : 'Entretien'} du {formatDate(entretien.dateCommencement)}
                          </h4>
                        </div>

                        {entretien.source === 'ordre' && entretien.numeroOrdre && (
                          <p className="text-sm text-gray-600">
                            N° Ordre: {entretien.numeroOrdre}
                          </p>
                        )}

                        {entretien.kilometrageEntretien && (
                          <p className="text-sm text-gray-600">
                            Kilométrage: {entretien.kilometrageEntretien.toLocaleString('fr-FR')} km
                          </p>
                        )}

                        {entretien.dateCommencement && (
                          <p className="text-sm text-gray-600">
                            Commence le: {formatDate(entretien.dateCommencement)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">TOTAL TTC</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatPrice(entretien.totalTTC)}
                      </p>
                    </div>
                  </div>

                  {/* AFFICHAGE DES TÂCHES/SERVICES - TOUJOURS VISIBLE */}
                  {((entretien.taches && entretien.taches.length > 0) || 
                    (entretien.services && entretien.services.length > 0)) && (
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">
                        {entretien.source === 'ordre' ? 'Tâches réalisées:' : 'Services effectués:'}
                      </h5>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="space-y-3">
                          
                          {/* AFFICHER LES TÂCHES D'ORDRE */}
                          {entretien.taches && entretien.taches.map((tache, index) => (
                            <div key={`tache-${index}`} className="border-b border-gray-200 last:border-b-0 pb-2 last:pb-0">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{tache.description} - Quantité: {tache.quantite}</p>
                                  <p className="text-xs text-gray-500">
                                    Service: {tache.serviceNom || 'Non spécifié'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* AFFICHER LES SERVICES DE CARNET */}
                          {entretien.services && entretien.services.map((service, index) => (
                            <div key={`service-${index}`} className="border-b border-gray-200 last:border-b-0 pb-2 last:pb-0">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">
                                    {service.nom} 
                                    {service.quantite && ` - Quantité: ${service.quantite}`}
                                  </p>
                                  {service.description && (
                                    <p className="text-xs text-gray-500">{service.description}</p>
                                  )}
                                </div>
                                {service.prix && (
                                  <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">
                                      {formatPrice(service.prix)}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}

                        </div>
                      </div>
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