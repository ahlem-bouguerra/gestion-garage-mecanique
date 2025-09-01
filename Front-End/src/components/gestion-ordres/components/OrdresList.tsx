import React, { useState, useEffect } from 'react';
import { Eye, Play, CheckCircle, Edit2, Trash2, Clock, Wrench, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface Atelier {
  _id: string;
  name: string;
  localisation: string;
}

interface OrdreTravail {
  _id: string;
  numeroOrdre?: string;
  devisId: string;
  dateCommence: string;
  atelierId?: string;
  atelierNom?: string;
  priorite: 'faible' | 'normale' | 'elevee' | 'urgente';
  status: 'en_attente' | 'en_cours' | 'termine' | 'suspendu' | 'supprime';
  description: string;
  clientInfo?: {
    nom: string;
  };
  vehiculeInfo?: string;
  taches?: any[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Filters {
  status: string;
  atelier: string;
  priorite: string;
  dateDebut: string;
  dateFin: string;
}

interface Statistiques {
  total: number;
  termines: number;
  enCours: number;
  suspendus: number;
}

interface OrdresListProps {
  onViewDetails: (ordreId: string) => void;
  onStartEdit: (ordre: OrdreTravail) => void;
  onDemarrer: (ordreId: string) => void;
  onTerminer: (ordreId: string) => void;
  onSupprimer: (ordreId: string) => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

const OrdresList: React.FC<OrdresListProps> = ({
  onViewDetails,
  onStartEdit,
  onDemarrer,
  onTerminer,
  onSupprimer,
  onError,
  onSuccess
}) => {
  const [ordresTravail, setOrdresTravail] = useState<OrdreTravail[]>([]);
  const [ateliers, setAteliers] = useState<Atelier[]>([]);
  const [statistiques, setStatistiques] = useState<Statistiques | null>(null);
  const [loading, setLoading] = useState(false);

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const [filters, setFilters] = useState<Filters>({
    status: '',
    atelier: '',
    priorite: '',
    dateDebut: '',
    dateFin: ''
  });

  const statusOptions = {
    'en_attente': { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    'en_cours': { label: 'En cours', color: 'bg-blue-100 text-blue-800', icon: Wrench },
    'termine': { label: 'Terminé', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    'suspendu': { label: 'Suspendu', color: 'bg-red-100 text-red-800', icon: AlertCircle }
  };

  const prioriteOptions = {
    'faible': { label: 'Faible', color: 'bg-gray-100 text-gray-800' },
    'normale': { label: 'Normale', color: 'bg-blue-100 text-blue-800' },
    'elevee': { label: 'Élevée', color: 'bg-orange-100 text-orange-800' },
    'urgente': { label: 'Urgente', color: 'bg-red-100 text-red-800' }
  };

  const loadAteliers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/getAllAteliers');
      setAteliers(response.data);
    } catch (error) {
      console.error('Erreur chargement ateliers:', error);
      setAteliers([]);
    }
  };

  const loadOrdresTravail = async (page = 1) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      let baseUrl = 'http://localhost:5000/api';

      if (filters.status) {
        baseUrl = `http://localhost:5000/api/ordres/status/${filters.status}`;
        const statusParams = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString()
        });

        const response = await axios.get(`${baseUrl}?${statusParams}`);

        if (response.data.ordres) {
          setOrdresTravail(response.data.ordres);
          setPagination(prev => ({
            ...prev,
            total: response.data.total,
            currentPage: page
          }));
        }
      } else if (filters.atelier) {
        baseUrl = `http://localhost:5000/api/ordres/atelier/${filters.atelier}`;
        const atelierParams = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString()
        });

        const response = await axios.get(`${baseUrl}?${atelierParams}`);

        if (response.data.ordres) {
          setOrdresTravail(response.data.ordres);
          setPagination(prev => ({
            ...prev,
            total: response.data.total,
            currentPage: page
          }));
        }
      } else {
        const response = await axios.get(`${baseUrl}?${params}`);

        if (response.data.ordres) {
          setOrdresTravail(response.data.ordres);
          setPagination(prev => ({
            ...prev,
            ...response.data.pagination
          }));
        } else {
          setOrdresTravail(Array.isArray(response.data) ? response.data : []);
        }
      }

    } catch (error) {
      console.error('Erreur chargement ordres:', error);
      setOrdresTravail([]);
    } finally {
      setLoading(false);
    }
  };

  const loadOrdresSupprimes = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/ordres/status/supprime');

      if (response.data.ordres) {
        setOrdresTravail(response.data.ordres);
        setPagination(prev => ({
          ...prev,
          total: response.data.total,
          currentPage: 1
        }));
      }
    } catch (error) {
      console.error('Erreur chargement ordres supprimés:', error);
      setOrdresTravail([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistiques = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/statistiques');

      if (response.data.success) {
        setStatistiques(response.data.statistiques);
      }
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAteliers();
    loadOrdresTravail();
    loadStatistiques();
  }, []);

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      {statistiques && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Statistiques des Ordres de Travail</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{statistiques.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{statistiques.termines}</div>
              <div className="text-sm text-gray-600">Terminés</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">{statistiques.enCours}</div>
              <div className="text-sm text-gray-600">En Cours</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{statistiques.suspendus}</div>
              <div className="text-sm text-gray-600">Suspendus</div>
            </div>
          </div>
        </div>
      )}

      {/* Conteneur principal */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Liste des Ordres de Travail</h2>
        </div>

        {/* Filtres */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              {Object.entries(statusOptions).map(([key, option]) => (
                <option key={key} value={key}>{option.label}</option>
              ))}
            </select>

            <select
              value={filters.atelier}
              onChange={(e) => setFilters(prev => ({ ...prev, atelier: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les ateliers</option>
              {ateliers.map(atelier => (
                <option key={atelier._id} value={atelier._id}>
                  {atelier.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => loadOrdresTravail(1)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Filtrer
            </button>
            <button
              onClick={loadOrdresSupprimes}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
              title="Voir les ordres supprimés (Admin)"
            >
              Ordres Supprimés
            </button>
          </div>
        </div>

        {/* Contenu */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-2">Chargement...</p>
          </div>
        ) : ordresTravail.length === 0 ? (
          <div className="text-center py-12">
            <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucun ordre de travail trouvé</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      N° Ordre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Véhicule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Début
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Atelier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priorité
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ordresTravail.map((ordre) => {
                    const StatusIcon = statusOptions[ordre.status]?.icon || Clock;
                    return (
                      <tr key={ordre._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {ordre.numeroOrdre}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ordre.clientInfo?.nom || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ordre.vehiculeInfo || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ordre.dateCommence ? new Date(ordre.dateCommence).toLocaleDateString('fr-FR') : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ordre.atelierNom || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${prioriteOptions[ordre.priorite]?.color || prioriteOptions.normale.color}`}>
                            {prioriteOptions[ordre.priorite]?.label || 'Normale'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusOptions[ordre.status]?.color || statusOptions.en_attente.color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusOptions[ordre.status]?.label || 'En attente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => onViewDetails(ordre._id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Voir détails"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {ordre.status === 'en_attente' && (
                              <button
                                onClick={() => onDemarrer(ordre._id)}
                                className="text-green-600 hover:text-green-900"
                                title="Démarrer"
                              >
                                <Play className="h-4 w-4" />
                              </button>
                            )}

                            {ordre.status === 'en_cours' && (
                              <button
                                onClick={() => onTerminer(ordre._id)}
                                className="text-green-600 hover:text-green-900"
                                title="Terminer"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}

                            {ordre.status !== 'termine' && ordre.status !== 'supprime' && (
                              <button
                                onClick={() => onStartEdit(ordre)}
                                className="text-yellow-600 hover:text-yellow-900"
                                title="Modifier"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                            )}

                            <button
                              onClick={() => onSupprimer(ordre._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Affichage {((pagination.page - 1) * pagination.limit) + 1} à {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total} résultats
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => loadOrdresTravail(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Précédent
                  </button>

                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, pagination.page - 2) + i;
                    if (pageNum > pagination.totalPages) return null;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => loadOrdresTravail(pageNum)}
                        className={`px-3 py-1 text-sm border rounded ${pageNum === pagination.page
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => loadOrdresTravail(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrdresList;