// SuperAdminDashboard.tsx - VERSION COMPLÈTE AVEC MODIFICATION

"use client";
import React, { useState, useEffect } from 'react';
import { Filter, AlertCircle, Plus, Eye, Edit,Trash2 ,FileText} from 'lucide-react';
import { getAllGarages, getOrdresByGarage, getStatistiques, getDevisDetails,deleteOrdre } from './api';
import CreateOrderModal from './AjouterOrdre';
import EditOrderModal from './EditOrderModal';
import OrderDetailsModal from './details-ordre';

interface Garage {
  _id: string;
  nom: string;
  matriculeFiscal: string;
  phone?: string;
  email?: string;
}

interface OrdreTravail {
  _id: string;
  numeroOrdre: string;
  devisId: any;
  status: string;
  priorite: string;
  dateCommence: string;
  clientInfo?: { nom: string };
  vehiculedetails?: { nom: string };
  taches?: any[];
}
interface SuperAdminDashboardProps {
  selectedGarage?: Garage;  // Ajout
  onNavigate?: () => void;  // Ajout
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ 
  selectedGarage: garageFromProps,
  onNavigate 
}) => {
  const [garages, setGarages] = useState<Garage[]>([]);
   const [selectedGarage, setSelectedGarage] = useState<Garage | null>(garageFromProps || null);
  const [ordres, setOrdres] = useState<OrdreTravail[]>([]);
    const showGarageList = !garageFromProps;
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Données sélectionnées
  const [selectedOrdre, setSelectedOrdre] = useState<OrdreTravail | null>(null);
  const [selectedDevisDetails, setSelectedDevisDetails] = useState<any>(null);
  const [success,setSuccess] = useState("");
  
  const [filters, setFilters] = useState({
    status: '',
    priorite: '',
    page: 1,
    limit: 10,
  });
  
  const [stats, setStats] = useState<any>(null);
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

  // Gérer la visibilité du header
  useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;

    if (showDetailsModal || showEditModal || showCreateModal) {
      header.classList.add("hidden");
    } else {
      header.classList.remove("hidden");
    }
  }, [showDetailsModal, showEditModal, showCreateModal]);

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

  const handleCreateOrder = () => {
    if (!selectedGarage) {
      setError('Veuillez sélectionner un garage');
      return;
    }
    setShowCreateModal(true);
  };

  const handleEditOrder = (ordre: OrdreTravail) => {
    if (!selectedGarage) {
      setError('Veuillez sélectionner un garage');
      return;
    }
    console.log('✏️ Modification ordre:', ordre.numeroOrdre);
    setSelectedOrdre(ordre);
    setShowEditModal(true);
  };

  const handleViewDetails = async (ordre: OrdreTravail) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Consultation détails ordre:', ordre.numeroOrdre);
      
      if (ordre.devisId) {
        const devisId = typeof ordre.devisId === 'string' ? ordre.devisId : ordre.devisId._id;
        const devisDetails = await getDevisDetails(devisId, selectedGarage?._id);
        console.log('✅ Détails devis récupérés:', devisDetails);
        
        setSelectedOrdre(ordre);
        setSelectedDevisDetails(devisDetails);
        setShowDetailsModal(true);
      } else {
        console.warn('⚠️ Pas de devisId pour cet ordre');
        setError('Cet ordre n\'a pas de devis associé');
      }
    } catch (error: any) {
      console.error('❌ Erreur consultation détails:', error);
      setError('Erreur lors de la consultation des détails');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrdre = async (ordre: any) => {
  // Demander confirmation avec détails
  const confirmed = window.confirm(
    `⚠️ ATTENTION : Suppression définitive !\n\n` +
    `Ordre: ${ordre.numeroOrdre}\n` +
    `Client: ${ordre.clientInfo?.nom || 'N/A'}\n` +
    `Véhicule: ${ordre.vehiculedetails?.nom || 'N/A'}\n\n` +
    `Cette action est IRRÉVERSIBLE.\n` +
    `Êtes-vous absolument sûr ?`
  );
  
  if (!confirmed) return;

  try {
    setLoading(true);
    
    // Appeler l'API avec le garageId pour SuperAdmin
    await deleteOrdre(ordre._id, selectedGarage);
    
    // Message de succès
    setSuccess('✅ Ordre supprimé définitivement');
    
    // Recharger la liste des ordres
    await loadOrdres();
    
  } catch (error: any) {
    console.error('❌ Erreur suppression ordre:', error);
    setError(error.message || 'Erreur lors de la suppression');
  } finally {
    setLoading(false);
  }
};

  const handleOrderCreated = () => {
    setShowCreateModal(false);
    loadOrdres();
    loadStats();
  };

  const handleOrderUpdated = () => {
    setShowEditModal(false);
    setSelectedOrdre(null);
    loadOrdres();
    loadStats();
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedOrdre(null);
    setSelectedDevisDetails(null);
  };

  const handleEditFromDetails = () => {
    setShowDetailsModal(false);
    setShowEditModal(true);
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
 <div className="min-h-screen  p-3">
      <div className="w-full">
        {/* Header */}
       
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-lg mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FileText className="h-8 w-8" />
          Gestion des Ordres - Super Admin
        </h1>
        <p className="text-blue-100 mt-2">Consultez tous les ordres de vos garages</p>
      </div>

          {selectedGarage && (
            <button
              onClick={handleCreateOrder}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition mb-4"
            >
              <Plus className="w-5 h-5" />
              Créer un Ordre
            </button>
          )}
        

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
          
 {showGarageList && (
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
 )}

          {/* Ordres de travail */}
          <div className="lg:col-span-7">
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
                  <div className="p-9 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
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
                <div className="divide-y max-h-[calc(500vh-450px)] overflow-y-auto">
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
                          
                          {/* Boutons Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Bouton Modifier - Visible si pas terminé ou supprimé */}
                            {ordre.status !== 'termine' && ordre.status !== 'supprime' && (
                              <button
                                onClick={() => handleEditOrder(ordre)}
                                disabled={loading}
                                className="flex items-center gap-2 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Modifier l'ordre"
                              >
                                <Edit className="w-4 h-4" />
                                <span className="text-sm font-medium">Modifier</span>
                              </button>
                            )}

                            {/* Bouton Voir Détails */}
                            <button
                              onClick={() => handleViewDetails(ordre)}
                              disabled={loading}
                              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Voir les détails de l'ordre"
                            >
                              <Eye className="w-4 h-4" />
                              <span className="text-sm font-medium">Détails</span>
                            </button>
                            <button
                              onClick={() => handleDeleteOrdre(ordre)}
                              disabled={loading}
                              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Supprimer</span>
                            </button>
                          </div>
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

        {/* Modals */}
        {selectedGarage && (
          <>
            <CreateOrderModal
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              garageId={selectedGarage._id}
              garageName={selectedGarage.nom}
              onSuccess={handleOrderCreated}
            />

            {selectedOrdre && (
              <EditOrderModal
                isOpen={showEditModal}
                onClose={() => {
                  setShowEditModal(false);
                  setSelectedOrdre(null);
                }}
                ordre={selectedOrdre}
                garageId={selectedGarage._id}
                garageName={selectedGarage.nom}
                onSuccess={handleOrderUpdated}
              />
            )}

            {showDetailsModal && selectedOrdre && selectedDevisDetails && (
              <OrderDetailsModal
                ordre={selectedOrdre}
                devisDetails={selectedDevisDetails}
                onClose={handleCloseDetails}
                onEdit={handleEditFromDetails}
                loading={loading}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;