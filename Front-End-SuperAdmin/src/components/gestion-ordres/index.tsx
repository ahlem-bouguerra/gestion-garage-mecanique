// SuperAdminDashboard.tsx - VERSION AMÉLIORÉE AVEC DÉTAILS

"use client";
import React, { useState, useEffect } from 'react';
import { Filter, AlertCircle, TrendingUp, Plus, Eye } from 'lucide-react';
import { getAllGarages, getOrdresByGarage, getStatistiques, getDevisDetails } from './api';
import CreateOrderModal from './AjouterOrdre';
import OrderDetailsModal from './details-ordre';

interface Garage {
  _id: string;
  nom: string;
  matriculeFiscal: string;
  phone?: string;
  email?: string;
  garagisteAdmins?: any[];
}

interface OrdreTravail {
  _id: string;
  numeroOrdre: string;
  devisId: any;
  status: string;
  priorite: string;
  dateCommence: string;
  clientInfo?: {
    nom: string;
  };
  vehiculedetails?: {
    nom: string;
  };
}

interface Stats {
  statistiques?: {
    total: number;
    enAttente: number;
    enCours: number;
    termines: number;
    Supprimés: number;
  };
}

const SuperAdminDashboard: React.FC = () => {
  const [garages, setGarages] = useState<Garage[]>([]);
  const [selectedGarage, setSelectedGarage] = useState<Garage | null>(null);
  const [ordres, setOrdres] = useState<OrdreTravail[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDevisDetails, setSelectedDevisDetails] = useState<any>(null);
  const [filters, setFilters] = useState({
    status: '',
    priorite: '',
    page: 1,
    limit: 5,
  });
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });


    useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;

    if (showDetailsModal || selectedDevisDetails) {
      header.classList.add("hidden");
    } else {
      header.classList.remove("hidden");
    }
  }, [showDetailsModal ,selectedDevisDetails]);

  const handleCreateOrder = () => {
    if (!selectedGarage) {
      setError('Veuillez sélectionner un garage');
      return;
    }
    setShowCreateModal(true);
  };

  const handleOrderCreated = () => {
    setShowCreateModal(false);
    loadOrdres();
    loadStats();
  };

  // Fonction pour voir les détails d'un ordre
  const handleViewDetails = async (ordre: OrdreTravail) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Consultation détails ordre:', ordre.numeroOrdre);
      
      // Si vous avez un devisId, récupérer les détails
      if (ordre.devisId) {
        const devisId = typeof ordre.devisId === 'string' ? ordre.devisId : ordre.devisId._id;
        const devisDetails = await getDevisDetails(devisId, selectedGarage?._id);
        console.log('✅ Détails devis récupérés:', devisDetails);
        
        // Afficher le modal avec les détails
        setSelectedDevisDetails(devisDetails);
        setShowDetailsModal(true);
      } else {
        console.warn('⚠️ Pas de devisId pour cet ordre');
        setError('Cet ordre n\'a pas de devis associé');
      }
    } catch (error: any) {
      console.error('❌ Erreur consultation détails:', error);
      setError('Erreur lors de la consultation des détails: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedDevisDetails(null);
  };

  // Charger les garages au montage
  useEffect(() => {
    loadGarages();
  }, []);

  // Charger les ordres quand garage sélectionné ou filtres changent
  useEffect(() => {
    if (selectedGarage) {
      loadOrdres();
      loadStats();
    }
  }, [selectedGarage, filters.status, filters.priorite, filters.page]);

  const loadGarages = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📥 Chargement des garages...');
      
      const garages = await getAllGarages();
      if (garages) {
        setGarages(garages);
        console.log(`✅ ${garages.length} garages chargés`);
      }
    } catch (err: any) {
      console.error('❌ Erreur chargement garages:', err);
      setError('Erreur lors du chargement des garages');
    } finally {
      setLoading(false);
    }
  };

  const loadOrdres = async () => {
    if (!selectedGarage) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log('📥 Chargement des ordres pour garage:', selectedGarage.nom);
      
      const params = {
        page: filters.page,
        limit: filters.limit,
        ...(filters.status && { status: filters.status }),
        ...(filters.priorite && { priorite: filters.priorite }),
      };

      const response = await getOrdresByGarage(selectedGarage._id, params);
      
      if (response) {
        setOrdres(response.ordres || []);
        setPagination(response.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        });
        console.log(`✅ ${response.ordres?.length || 0} ordres chargés`);
      }
    } catch (err: any) {
      console.error('❌ Erreur chargement ordres:', err);
      setError('Erreur lors du chargement des ordres');
      setOrdres([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!selectedGarage) return;

    try {
      console.log('📊 Chargement des statistiques...');
      const response = await getStatistiques(selectedGarage._id);
      if (response) {
        setStats(response);
        console.log('✅ Statistiques chargées:', response);
      }
    } catch (err: any) {
      console.error('❌ Erreur chargement stats:', err);
    }
  };

  const handleGarageSelect = (garage: Garage) => {
    console.log('🏢 Garage sélectionné:', garage.nom);
    setSelectedGarage(garage);
    setFilters(prev => ({ ...prev, page: 1 }));
    setOrdres([]);
    setStats(null);
  };

  const handlePageChange = (newPage: number) => {
    console.log(`📄 Page changée: ${newPage}`);
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      en_attente: 'bg-yellow-100 text-yellow-800',
      en_cours: 'bg-blue-100 text-blue-800',
      termine: 'bg-green-100 text-green-800',
      supprime: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getPrioriteBadge = (priorite: string) => {
    const badges: Record<string, string> = {
      urgente: 'bg-red-100 text-red-800',
      elevee: 'bg-orange-100 text-orange-800',
      normale: 'bg-blue-100 text-blue-800',
      faible: 'bg-gray-100 text-gray-800',
    };
    return badges[priorite] || 'bg-gray-100 text-gray-800';
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  const formatPriorite = (priorite: string) => {
    return priorite.charAt(0).toUpperCase() + priorite.slice(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard SuperAdmin</h1>
            <p className="text-gray-600 mt-2">Sélectionnez un garage pour voir ses ordres de travail</p>
          </div>

          {selectedGarage && (
            <button
              onClick={handleCreateOrder}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Plus className="w-5 h-5" />
              Créer un Ordre
            </button>
          )}
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des garages */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">
                Garages ({garages.length})
              </h2>

              {loading && garages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-600 mt-4 text-sm">Chargement...</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto">
                  {garages.map((garage) => (
                    <button
                      key={garage._id}
                      onClick={() => handleGarageSelect(garage)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition ${
                        selectedGarage?._id === garage._id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <h3 className="font-semibold text-gray-900">{garage.nom}</h3>
                      <p className="text-sm text-gray-600 mt-1">{garage.matriculeFiscal}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Ordres de travail */}
          <div className="lg:col-span-2">
            {!selectedGarage ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700">
                  Sélectionnez un garage
                </h3>
                <p className="text-gray-500 mt-2">
                  Choisissez un garage dans la liste pour voir ses ordres de travail
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow">
                {/* Statistiques */}
                {stats?.statistiques && (
                  <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {stats.statistiques.total}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {stats.statistiques.enAttente}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">En attente</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {stats.statistiques.enCours}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">En cours</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {stats.statistiques.termines}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Terminés</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600">
                          {stats.statistiques.Supprimés}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Supprimés</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Liste des ordres */}
                <div className="divide-y max-h-[calc(100vh-450px)] overflow-y-auto">
                  {loading ? (
                    <div className="p-12 text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="text-gray-600 mt-4">Chargement...</p>
                    </div>
                  ) : ordres.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      Aucun ordre de travail trouvé
                    </div>
                  ) : (
                    ordres.map((ordre) => (
                      <div key={ordre._id} className="p-4 hover:bg-gray-50 transition">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <span className="font-semibold text-gray-900">
                                {ordre.numeroOrdre || ordre._id}
                              </span>
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(
                                  ordre.status
                                )}`}
                              >
                                {formatStatus(ordre.status)}
                              </span>
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${getPrioriteBadge(
                                  ordre.priorite
                                )}`}
                              >
                                {formatPriorite(ordre.priorite)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">
                              Client: {ordre.clientInfo?.nom || ordre.devisId?.clientName || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-600 truncate">
                              Véhicule: {ordre.vehiculedetails?.nom || ordre.devisId?.vehicleInfo || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Date: {new Date(ordre.dateCommence).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          
                          {/* Bouton Voir Détails */}
                          <button
                            onClick={() => handleViewDetails(ordre)}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                            title="Voir les détails de l'ordre"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="text-sm font-medium">Détails</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Pagination */}
                {ordres.length > 0 && (
                  <div className="p-4 border-t flex items-center justify-between">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPrev}
                      className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                    >
                      Précédent
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {pagination.page} / {pagination.totalPages} ({pagination.total} ordres)
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNext}
                      className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                    >
                      Suivant
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {selectedGarage && (
          <CreateOrderModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            garageId={selectedGarage._id}
            garageName={selectedGarage.nom}
            onSuccess={handleOrderCreated}
          />
        )}

        {/* Modal Détails */}
        {showDetailsModal && selectedDevisDetails && (
  <OrderDetailsModal
    ordre={ordres.find(o => o.devisId === selectedDevisDetails.id)}
    devisDetails={selectedDevisDetails}
    onClose={handleCloseDetails}
    onEdit={() => {
      // Votre logique de modification
      console.log('Modifier ordre');
    }}
    onDemarrer={async () => {
      // Votre logique de démarrage
      await ordresTravailAPI.demarrerOrdre(ordre._id);
      loadOrdres();
    }}
    onTerminer={async () => {
      // Votre logique de fin
      await ordresTravailAPI.terminerOrdre(ordre._id);
      loadOrdres();
    }}
    loading={loading}
  />
)}
      </div>
    </div>
  );
};

// Composant pour afficher les détails dans le modal
const OrderDetailsContent: React.FC<{ devisDetails: any; onClose: () => void }> = ({ 
  devisDetails, 
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'services' | 'pieces'>('info');

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      en_attente: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      en_cours: { bg: 'bg-blue-100', text: 'text-blue-800' },
      termine: { bg: 'bg-green-100', text: 'text-green-800' },
      valide: { bg: 'bg-green-100', text: 'text-green-800' },
    };
    return badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(price);
  };

  const StatusBadge = getStatusBadge(devisDetails.status);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 pb-4 border-b">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Détails de l'Ordre
          </h2>
          <p className="text-lg text-gray-600">
            Devis: <span className="font-semibold text-blue-600">{devisDetails.id}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${StatusBadge.bg}`}>
            <span className={`font-semibold ${StatusBadge.text}`}>
              {formatStatus(devisDetails.status)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-6 py-3 font-medium transition ${
              activeTab === 'info'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Informations Générales
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-6 py-3 font-medium transition ${
              activeTab === 'services'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Services ({devisDetails.services?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('pieces')}
            className={`px-6 py-3 font-medium transition ${
              activeTab === 'pieces'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pièces ({devisDetails.pieces?.length || 0})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Tab: Informations */}
        {activeTab === 'info' && (
          <>
            {/* Client */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Client</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Nom:</span>
                  <span className="ml-2 font-medium">{devisDetails.clientName}</span>
                </div>
                {devisDetails.clientPhone && (
                  <div>
                    <span className="text-gray-600">Tél:</span>
                    <span className="ml-2 font-medium">{devisDetails.clientPhone}</span>
                  </div>
                )}
                {devisDetails.clientEmail && (
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{devisDetails.clientEmail}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Véhicule */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Véhicule</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Modèle:</span>
                  <span className="ml-2 font-medium">{devisDetails.vehicleInfo}</span>
                </div>
                {devisDetails.vehiclePlate && (
                  <div>
                    <span className="text-gray-600">Immatriculation:</span>
                    <span className="ml-2 font-medium">{devisDetails.vehiclePlate}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Planification</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Créé le:</span>
                  <span className="ml-2 font-medium">{formatDate(devisDetails.createdAt)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Temps estimé:</span>
                  <span className="ml-2 font-medium">
                    {devisDetails.estimatedTime?.value} {devisDetails.estimatedTime?.unit}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Tab: Services */}
        {activeTab === 'services' && (
          <div className="space-y-3">
            {devisDetails.services && devisDetails.services.length > 0 ? (
              devisDetails.services.map((service: any) => (
                <div key={service._id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{service.name}</h4>
                      {service.description && (
                        <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                      )}
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span>Qté: {service.quantity}</span>
                        <span>Prix unitaire: {formatPrice(service.price)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">
                        {formatPrice(service.price * service.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">Aucun service</p>
            )}
          </div>
        )}

        {/* Tab: Pièces */}
        {activeTab === 'pieces' && (
          <div className="space-y-3">
            {devisDetails.pieces && devisDetails.pieces.length > 0 ? (
              devisDetails.pieces.map((piece: any) => (
                <div key={piece._id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{piece.name}</h4>
                      {piece.reference && (
                        <p className="text-sm text-gray-600 mt-1">Réf: {piece.reference}</p>
                      )}
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span>Qté: {piece.quantity}</span>
                        <span>Prix unitaire: {formatPrice(piece.price)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        {formatPrice(piece.price * piece.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">Aucune pièce</p>
            )}
          </div>
        )}
      </div>

      {/* Résumé financier */}
      <div className="mt-6 pt-6 border-t">
        <h3 className="font-semibold text-gray-900 mb-4">Résumé Financier</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Total HT</span>
            <span className="font-semibold">{formatPrice(devisDetails.totalHT)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">TVA ({devisDetails.tva}%)</span>
            <span className="font-semibold">
              {formatPrice(devisDetails.totalHT * (devisDetails.tva / 100))}
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="text-lg font-bold">Total TTC</span>
            <span className="text-2xl font-bold text-green-600">
              {formatPrice(devisDetails.totalTTC)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;