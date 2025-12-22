"use client"
import React from 'react';
import { X, User, MapPin, Wrench, UserCheck, Clock, FileText, Edit2, Play, CheckCircle } from 'lucide-react';
import { ordresTravailAPI } from './services/ordresTravailAPI';
import { useConfirm } from "@/components/ui-elements/ConfirmProvider";
import { useGlobalAlert } from '../ui-elements/AlertProvider';


const DetailOrdreTravail = ({
  ordre,
  onClose,
  onEdit,
  onError,
  onSuccess,
  onOrdreUpdated
}) => {
  const statusOptions = {
    'en_attente': { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    'en_cours': { label: 'En cours', color: 'bg-blue-100 text-blue-800', icon: Wrench },
    'termine': { label: 'Terminé', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    'suspendu': { label: 'Suspendu', color: 'bg-red-100 text-red-800', icon: Clock },
    'supprime': { label: 'supprime', color: 'bg-red-100 text-red-800', icon: X },
  };

  const { confirm: openConfirm } = useConfirm();

  const { showAlert } = useGlobalAlert();


  const prioriteOptions = {
    'faible': { label: 'Faible', color: 'bg-gray-100 text-gray-800' },
    'normale': { label: 'Normale', color: 'bg-blue-100 text-blue-800' },
    'elevee': { label: 'Élevée', color: 'bg-orange-100 text-orange-800' },
    'urgente': { label: 'Urgente', color: 'bg-red-100 text-red-800' }
  };

  const demarrerOrdre = async () => {
  const isConfirmed = await openConfirm({
    title: "Démarrer l'ordre de travail",
    message:
      'Êtes-vous sûr de vouloir démarrer cet ordre de travail ?\n\n' +
      'Cette action changera le statut à "En cours" et enregistrera la date de début réelle.',
    confirmText: "Démarrer",
    cancelText: "Annuler",
  });

  if (!isConfirmed) return;

  try {
    await ordresTravailAPI.demarrerOrdre(ordre._id);
    showAlert("success", "Succès", "Ordre de travail démarré avec succès");
    onOrdreUpdated();
  } catch (error) {
    onError(error.message || "Erreur lors du démarrage de l'ordre");
  }
};

const terminerOrdre = async () => {
  const isConfirmed = await openConfirm({
    title: "Terminer l'ordre de travail",
    message:
      'Êtes-vous sûr de vouloir terminer cet ordre de travail ?\n\n' +
      'Cette action changera le statut à "Terminé" et enregistrera la date de fin réelle.\n' +
      'Une fois terminé, l\'ordre ne pourra plus être modifié.',
    confirmText: "Terminer",
    cancelText: "Annuler",
  });

  if (!isConfirmed) return;

  try {
    await ordresTravailAPI.terminerOrdre(ordre._id);
    showAlert("success", "Succès", "Ordre de travail terminé avec succès");
    onOrdreUpdated();
  } catch (error) {
    onError(error.message || "Erreur lors de la fin de l'ordre");
  }
};


  const StatusIcon = statusOptions[ordre.status]?.icon || Clock;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full m-4 max-h-screen overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {ordre.numeroOrdre || `Ordre de Travail ${ordre._id}`}
            </h2>
            <div className="flex items-center space-x-2">
              {/* Actions rapides */}
              {ordre.status === 'en_attente' && (
                <button
                  onClick={demarrerOrdre}
                  className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  title="Démarrer l'ordre"
                >
                  <Play className="h-4 w-4" />
                  <span>Démarrer</span>
                </button>
              )}

              {ordre.status === 'en_cours' && (
                <button
                  onClick={terminerOrdre}
                  className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  title="Terminer l'ordre"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Terminer</span>
                </button>
              )}

              {ordre.status !== 'termine' && ordre.status !== 'supprime' && (
                <button
                  onClick={onEdit}
                  className="bg-yellow-600 text-white px-3 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center space-x-2"
                  title="Modifier l'ordre"
                >
                  <Edit2 className="h-4 w-4" />
                  <span>Modifier</span>
                </button>
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

        <div className="p-6 space-y-6">
          {/* Informations générales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Informations Client
              </h3>
              <div className="space-y-2">
                <p><span className="font-medium">Nom:</span> {ordre.clientInfo?.nom || 'N/A'}</p>
                <p><span className="font-medium">Véhicule:</span> {ordre.vehiculedetails?.nom || 'N/A'}</p>
                <p><span className="font-medium">Devis N°:</span> {ordre.devisId || 'N/A'}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Détails Opérationnels
              </h3>
              <div className="space-y-2">
                <p><span className="font-medium">Date début:</span> {ordre.dateCommence ? new Date(ordre.dateCommence).toLocaleString('fr-FR') : 'N/A'}</p>
                <p><span className="font-medium">Date fin prévue:</span> {ordre.dateFinPrevue ? new Date(ordre.dateFinPrevue).toLocaleString('fr-FR') : 'N/A'}</p>
                <p><span className="font-medium">Atelier:</span> {ordre.atelierNom || 'N/A'}</p>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Priorité:</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${prioriteOptions[ordre.priorite]?.color}`}>
                    {prioriteOptions[ordre.priorite]?.label}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Statut:</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusOptions[ordre.status]?.color}`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusOptions[ordre.status]?.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {ordre.description && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700">{ordre.description}</p>
            </div>
          )}

          {/* Liste des tâches */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4 flex items-center">
              <Wrench className="h-5 w-5 mr-2" />
              Tâches Assignées ({ordre.taches?.length || 0})
            </h3>

            <div className="space-y-3">
              {ordre.taches?.map((tache, index) => (
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
                    <div className="bg-gray-50 p-3 rounded flex items-center mb-3">
                      <UserCheck className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-sm">
                        <span className="font-medium">Mécanicien assigné:</span> {tache.mecanicienNom}
                      </span>
                    </div>
                  )}

                  {/* Notes */}
                  {tache.notes && (
                    <div className="bg-yellow-50 p-3 rounded mb-3">
                      <p className="text-sm"><span className="font-medium">Notes:</span> {tache.notes}</p>
                    </div>
                  )}

                  {/* Statut et assignation */}
                  <div className="flex items-center justify-between">
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

                    {/* Badge de statut de tâche */}
                    {tache.status && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        tache.status === 'terminee' 
                          ? 'bg-green-100 text-green-800' 
                          : tache.status === 'en_cours'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {tache.status === 'terminee' ? 'Terminée' : 
                         tache.status === 'en_cours' ? 'En cours' : 
                         'En attente'}
                      </span>
                    )}
                  </div>

                  {/* Dates de début et fin si disponibles */}
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
                <p className="text-2xl font-bold text-blue-600">{ordre.taches?.length || 0}</p>
                <p className="text-sm text-gray-600">Tâches Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {ordre.taches?.filter(t => t.status === 'terminee').length || 0}
                </p>
                <p className="text-sm text-gray-600">Terminées</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {ordre.taches?.reduce((total, tache) => total + (tache.estimationHeures || 0), 0) || 0}h
                </p>
                <p className="text-sm text-gray-600">Temps Estimé</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {ordre.taches?.reduce((total, tache) => total + (tache.heuresReelles || 0), 0) || 0}h
                </p>
                <p className="text-sm text-gray-600">Temps Réel</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer avec actions */}
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Fermer
          </button>
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            onClick={() => {
              window.print();
            }}
          >
            <FileText className="h-4 w-4" />
            <span>Imprimer</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailOrdreTravail;