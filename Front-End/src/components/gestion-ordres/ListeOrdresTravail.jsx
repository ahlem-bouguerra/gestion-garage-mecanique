"use client"
import React from 'react';
import { X,Play, Eye, Edit2, Trash2, CheckCircle, Clock, Wrench, AlertCircle } from 'lucide-react';
import { ordresTravailAPI } from './services/ordresTravailAPI';

const ListeOrdresTravail = ({
  ordresTravail,
  ateliers,
  statistiques,
  pagination,
  filters,
  loading,
  onLoadOrdres,
  onLoadOrdreDetails,
  onFiltersChange,
  onError,
  onSuccess,
  onOrdreDeleted,
  onEditOrdre,
  onOrdresSupprimes
}) => {
  const statusOptions = {
    'en_attente': { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    'en_cours': { label: 'En cours', color: 'bg-blue-100 text-blue-800', icon: Wrench },
    'termine': { label: 'Terminé', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    'supprime': { label: 'supprime', color: 'bg-red-100 text-red-800', icon: AlertCircle },
    'supprime': { label: 'supprime', color: 'bg-red-100 text-red-800', icon: X },

  };

  const prioriteOptions = {
    'faible': { label: 'Faible', color: 'bg-gray-100 text-gray-800' },
    'normale': { label: 'Normale', color: 'bg-blue-100 text-blue-800' },
    'elevee': { label: 'Élevée', color: 'bg-orange-100 text-orange-800' },
    'urgente': { label: 'Urgente', color: 'bg-red-100 text-red-800' }
  };

  const demarrerOrdre = async (ordreId) => {
    const confirmation = window.confirm(
      'Êtes-vous sûr de vouloir démarrer cet ordre de travail ?\n\n' +
      'Cette action changera le statut à "En cours" et enregistrera la date de début réelle.'
    );

    if (!confirmation) return;

    try {
      await ordresTravailAPI.demarrerOrdre(ordreId);
      onSuccess('Ordre de travail démarré avec succès');
      onLoadOrdres();
    } catch (error) {
      onError(error.message || 'Erreur lors du démarrage de l\'ordre');
    }
  };

  const terminerOrdre = async (ordreId) => {
    const confirmation = window.confirm(
      'Êtes-vous sûr de vouloir terminer cet ordre de travail ?\n\n' +
      'Cette action changera le statut à "Terminé" et enregistrera la date de fin réelle.\n' +
      'Une fois terminé, l\'ordre ne pourra plus être modifié.'
    );

    if (!confirmation) return;

    try {
      await ordresTravailAPI.terminerOrdre(ordreId);
      onSuccess('Ordre de travail terminé avec succès');
      onLoadOrdres();
    } catch (error) {
      onError(error.message || 'Erreur lors de la fin de l\'ordre');
    }
  };

  const supprimerOrdre = async (ordreId) => {
    const ordre = ordresTravail.find(o => o._id === ordreId);
    const numeroOrdre = ordre?.numeroOrdre || ordreId;

    const confirmation = window.confirm(
      `⚠️ ATTENTION ⚠️\n\n` +
      `Êtes-vous sûr de vouloir supprimer l'ordre de travail ${numeroOrdre} ?\n\n` +
      `Cette action marquera l'ordre comme supprimé et il ne sera plus visible dans la liste principale.\n\n` +
      `Cette action est réversible uniquement par un administrateur.`
    );

    if (!confirmation) return;

    try {
      await ordresTravailAPI.deleteOrdre(ordreId);
      onSuccess(`Ordre de travail ${numeroOrdre} supprimé avec succès`);
      onOrdreDeleted();
    } catch (error) {
      onError(error.message || 'Erreur lors de la suppression');
    }
  };

const loadOrdresSupprimes = async () => {
    try {
      console.log('Appel API getOrdresSupprimes...');
      const data = await ordresTravailAPI.getOrdresSupprimes();
      console.log('Données reçues:', data);
      
      if (data.success && data.ordres) {
        // ✅ APPELER la fonction pour mettre à jour l'affichage
        onOrdresSupprimes(data.ordres, data.pagination);
        onSuccess(`${data.ordres.length} ordre(s) supprimé(s) chargé(s)`);
      } else {
        onSuccess('Aucun ordre supprimé trouvé');
      }
    } catch (error) {
      console.error('Erreur complète:', error);
      onError(`Erreur: ${error.message}`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Liste des Ordres de Travail</h2>
      </div>

      {/* Statistiques */}
      {statistiques && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Statistiques</h3>
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
              <div className="text-2xl font-bold text-red-600">{statistiques.supprime}</div>
              <div className="text-sm text-gray-600">Supprimés</div>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.status}
            onChange={(e) => onFiltersChange(prev => ({ ...prev, status: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les statuts</option>
            {Object.entries(statusOptions).map(([key, option]) => (
              <option key={key} value={key}>{option.label}</option>
            ))}
          </select>

          <select
            value={filters.atelier}
            onChange={(e) => onFiltersChange(prev => ({ ...prev, atelier: e.target.value }))}
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
            onClick={() => onLoadOrdres(1)}
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
                        {ordre.vehiculedetails?.nom || 'N/A'}
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusOptions[ordre.status]?.color}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusOptions[ordre.status]?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onLoadOrdreDetails(ordre._id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Voir détails"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {ordre.status === 'en_attente' && (
                            <button
                              onClick={() => demarrerOrdre(ordre._id)}
                              className="text-green-600 hover:text-green-900"
                              title="Démarrer"
                            >
                              <Play className="h-4 w-4" />
                            </button>
                          )}

                          {ordre.status === 'en_cours' && (
                            <button
                              onClick={() => terminerOrdre(ordre._id)}
                              className="text-green-600 hover:text-green-900"
                              title="Terminer"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}

                          {ordre.status !== 'termine' && ordre.status !== 'supprime' && (
                            <button
                              onClick={() => onEditOrdre(ordre)}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Modifier"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            onClick={() => supprimerOrdre(ordre._id)}
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
                  onClick={() => onLoadOrdres(pagination.page - 1)}
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
                      onClick={() => onLoadOrdres(pageNum)}
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
                  onClick={() => onLoadOrdres(pagination.page + 1)}
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
  );
};

export default ListeOrdresTravail;