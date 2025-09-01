import React from 'react';
import { X, User, MapPin, Wrench, Clock, UserCheck, CheckCircle, AlertCircle, FileText, Edit2, Play } from 'lucide-react';
import EditOrdreForm from './EditOrdreForm';

interface Tache {
  _id: string;
  description: string;
  quantite: number;
  serviceId: string;
  serviceNom?: string;
  mecanicienId: string;
  mecanicienNom?: string;
  estimationHeures: number;
  heuresReelles?: number;
  notes?: string;
  status?: string;
  dateDebut?: string;
  dateFin?: string;
}

interface OrdreTravail {
  _id: string;
  numeroOrdre?: string;
  devisId: string;
  dateCommence: string;
  dateFinPrevue?: string;
  atelierId?: string;
  atelier?: string;
  atelierNom?: string;
  priorite: 'faible' | 'normale' | 'elevee' | 'urgente';
  status: 'en_attente' | 'en_cours' | 'termine' | 'suspendu' | 'supprime';
  description: string;
  taches: Tache[];
  clientInfo?: {
    nom: string;
  };
  vehiculeInfo?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface OrdreDetailsModalProps {
  selectedOrdre: OrdreTravail;
  editMode: boolean;
  onClose: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onDemarrer: (ordreId: string) => void;
  onTerminer: (ordreId: string) => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onReloadDetails: (ordreId: string) => void;
  onReloadList: () => void;
}

const OrdreDetailsModal: React.FC<OrdreDetailsModalProps> = ({
  selectedOrdre,
  editMode,
  onClose,
  onStartEdit,
  onCancelEdit,
  onDemarrer,
  onTerminer,
  onSuccess,
  onError,
  onReloadDetails,
  onReloadList
}) => {
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

  const StatusIcon = statusOptions[selectedOrdre.status]?.icon || Clock;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full m-4 max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedOrdre.numeroOrdre || `Ordre de Travail ${selectedOrdre._id}`}
            </h2>
            <div className="flex items-center space-x-4">
              {/* Actions rapides */}
              {!editMode && (
                <>
                  {selectedOrdre.status === 'en_attente' && (
                    <button
                      onClick={() => onDemarrer(selectedOrdre._id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <Play className="h-4 w-4" />
                      <span>Démarrer</span>
                    </button>
                  )}
                  
                  {selectedOrdre.status === 'en_cours' && (
                    <button
                      onClick={() => onTerminer(selectedOrdre._id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Terminer</span>
                    </button>
                  )}

                  {selectedOrdre.status !== 'termine' && selectedOrdre.status !== 'supprime' && (
                    <button
                      onClick={onStartEdit}
                      className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center space-x-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      <span>Modifier</span>
                    </button>
                  )}
                </>
              )}

              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6 space-y-6">
          {editMode ? (
            <EditOrdreForm
              selectedOrdre={selectedOrdre}
              onCancel={onCancelEdit}
              onSuccess={onSuccess}
              onError={onError}
              onReloadDetails={onReloadDetails}
              onReloadList={onReloadList}
            />
          ) : (
            <>
              {/* Informations générales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Informations Client
                  </h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Nom:</span> {selectedOrdre.clientInfo?.nom || 'N/A'}</p>
                    <p><span className="font-medium">Véhicule:</span> {selectedOrdre.vehiculeInfo || 'N/A'}</p>
                    <p><span className="font-medium">Devis N°:</span> {selectedOrdre.devisId || 'N/A'}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Détails Opérationnels
                  </h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Date début:</span> {selectedOrdre.dateCommence ? new Date(selectedOrdre.dateCommence).toLocaleString('fr-FR') : 'N/A'}</p>
                    <p><span className="font-medium">Date fin prévue:</span> {selectedOrdre.dateFinPrevue ? new Date(selectedOrdre.dateFinPrevue).toLocaleString('fr-FR') : 'N/A'}</p>
                    <p><span className="font-medium">Atelier:</span> {selectedOrdre.atelierNom || 'N/A'}</p>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Priorité:</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${prioriteOptions[selectedOrdre.priorite]?.color}`}>
                        {prioriteOptions[selectedOrdre.priorite]?.label}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Statut:</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusOptions[selectedOrdre.status]?.color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusOptions[selectedOrdre.status]?.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedOrdre.description && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700">{selectedOrdre.description}</p>
                </div>
              )}

              {/* Liste des tâches */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                  <Wrench className="h-5 w-5 mr-2" />
                  Tâches Assignées ({selectedOrdre.taches?.length || 0})
                </h3>

                <div className="space-y-3">
                  {selectedOrdre.taches?.map((tache, index) => (
                    <div key={tache._id || index} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{tache.description}</h4>
                          <p className="text-sm text-gray-600">
                            Quantité: {tache.quantite} |
                            Estimation: {tache.estimationHeures}h |
                            Réelles: {tache.heuresReelles || 0}h
                          </p>
                          {tache.serviceNom && (
                            <p className="text-sm text-blue-600">Service: {tache.serviceNom}</p>
                          )}
                        </div>
                      </div>

                      {tache.mecanicienNom && (
                        <div className="bg-gray-50 p-3 rounded flex items-center">
                          <UserCheck className="h-4 w-4 text-blue-600 mr-2" />
                          <span className="text-sm">
                            <span className="font-medium">Mécanicien assigné:</span> {tache.mecanicienNom}
                          </span>
                        </div>
                      )}

                      {/* Section statut et actions */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {tache.mecanicienId ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <UserCheck className="h-3 w-3 mr-1" />
                              Assignée à {tache.mecanicienNom}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Clock className="h-3 w-3 mr-1" />
                              Non assignée
                            </span>
                          )}
                        </div>

                        {tache.serviceNom && (
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {tache.serviceNom}
                          </span>
                        )}
                      </div>

                      {(tache.dateDebut || tache.dateFin) && (
                        <div className="mt-3 text-xs text-gray-500 space-y-1">
                          {tache.dateDebut && (
                            <p>Démarré le: {new Date(tache.dateDebut).toLocaleString('fr-FR')}</p>
                          )}
                          {tache.dateFin && (
                            <p>Terminé le: {new Date(tache.dateFin).toLocaleString('fr-FR')}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-4">Aucune tâche assignée</p>
                  )}
                </div>
              </div>

              {/* Résumé statistique */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Résumé</h3>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{selectedOrdre.taches?.length || 0}</p>
                    <p className="text-sm text-gray-600">Tâches Total</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {selectedOrdre.taches?.filter(t => t.status === 'terminee').length || 0}
                    </p>
                    <p className="text-sm text-gray-600">Terminées</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">
                      {selectedOrdre.taches?.reduce((total, tache) => total + (tache.estimationHeures || 0), 0) || 0}h
                    </p>
                    <p className="text-sm text-gray-600">Temps Estimé</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">
                      {selectedOrdre.taches?.reduce((total, tache) => total + (tache.heuresReelles || 0), 0) || 0}h
                    </p>
                    <p className="text-sm text-gray-600">Temps Réel</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Fermer
          </button>
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            onClick={() => window.print()}
          >
            <FileText className="h-4 w-4" />
            <span>Imprimer</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrdreDetailsModal;