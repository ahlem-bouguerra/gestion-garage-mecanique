"use client"
import React, { useState, useEffect } from 'react';
import { X, Save, User, MapPin, Wrench, UserCheck, Clock } from 'lucide-react';
import { ordresTravailAPI } from './services/ordresTravailAPI';

const ModificationOrdreTravail = ({
  ordre,
  services,
  ateliers,
  mecaniciens,
  onLoadMecaniciensByService,
  onClose,
  onCancel,
  onSaved,
  onError,
  loading,
  setLoading
}) => {
  const [editFormData, setEditFormData] = useState({
    dateCommence: '',
    atelier: '',
    priorite: 'normale',
    description: '',
    taches: []
  });

  const prioriteOptions = {
    'faible': { label: 'Faible', color: 'bg-gray-100 text-gray-800' },
    'normale': { label: 'Normale', color: 'bg-blue-100 text-blue-800' },
    'elevee': { label: 'Élevée', color: 'bg-orange-100 text-orange-800' },
    'urgente': { label: 'Urgente', color: 'bg-red-100 text-red-800' }
  };

  useEffect(() => {
    if (ordre) {
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16);
      };

      setEditFormData({
        dateCommence: formatDateForInput(ordre.dateCommence),
        atelier: ordre.atelierId || ordre.atelier || '',
        priorite: ordre.priorite || 'normale',
        description: ordre.description || '',
        taches: ordre.taches?.map(tache => ({
          _id: tache._id,
          id: tache._id,
          description: tache.description,
          quantite: tache.quantite,
          serviceId: tache.serviceId,
          serviceNom: tache.serviceNom,
          mecanicienId: tache.mecanicienId,
          mecanicienNom: tache.mecanicienNom,
          estimationHeures: tache.estimationHeures,
          notes: tache.notes || '',
          status: tache.status || 'assignee'
        })) || []
      });
    }
  }, [ordre]);

  const assignServiceToTache = async (tacheId, serviceId) => {
    const service = services.find(s => s._id === serviceId);

    // Charger les mécaniciens pour ce service
    if (serviceId) {
      await onLoadMecaniciensByService(serviceId);
    }

    setEditFormData(prev => ({
      ...prev,
      taches: prev.taches.map(tache =>
        tache._id === tacheId || tache.id === tacheId
          ? {
            ...tache,
            serviceId: serviceId,
            serviceNom: service ? service.name : '',
            mecanicienId: '', // Reset mécanicien quand on change de service
            mecanicienNom: ''
          }
          : tache
      )
    }));
  };

  const assignMecanicienToTache = (tacheId, mecanicienId) => {
    const mecanicien = mecaniciens.find(m => m._id === mecanicienId);

    setEditFormData(prev => ({
      ...prev,
      taches: prev.taches.map(tache =>
        tache._id === tacheId || tache.id === tacheId
          ? {
            ...tache,
            mecanicienId: mecanicienId,
            mecanicienNom: mecanicien ? mecanicien.nom : ''
          }
          : tache
      )
    }));
  };

  const saveEdit = async () => {
    try {
      setLoading(true);

      // Validations
      if (!editFormData.dateCommence) {
        throw new Error('La date de commencement est obligatoire');
      }

      if (!editFormData.atelier) {
        throw new Error('Veuillez sélectionner un atelier');
      }

      if (editFormData.taches.some(t => !t.serviceId)) {
        throw new Error('Toutes les tâches doivent avoir un service assigné');
      }

      if (editFormData.taches.some(t => !t.mecanicienId)) {
        throw new Error('Toutes les tâches doivent avoir un mécanicien assigné');
      }

      // Préparer les données pour l'API
      const updateData = {
        dateCommence: editFormData.dateCommence,
        atelierId: editFormData.atelier,
        priorite: editFormData.priorite,
        description: editFormData.description,
        taches: editFormData.taches.map(tache => ({
          _id: tache._id,
          description: tache.description,
          quantite: tache.quantite,
          serviceId: tache.serviceId,
          mecanicienId: tache.mecanicienId,
          estimationHeures: tache.estimationHeures,
          notes: tache.notes,
          status: tache.status
        }))
      };

      await ordresTravailAPI.updateOrdre(ordre._id, updateData);
      onSaved();

    } catch (error) {
        if (error.response?.status === 403) {
      alert("❌ Accès refusé : Vous n'avez pas la permission");
      }
      let errorMessage = 'Erreur lors de la modification';

      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }

      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full m-4 max-h-screen overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Modifier l'ordre de travail - {ordre.numeroOrdre}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Informations client (lecture seule) */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Informations Client (lecture seule)
            </h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Client:</span> {ordre.clientInfo?.nom || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Véhicule:</span> {ordre.vehiculedetails?.nom || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Devis N°:</span> {ordre.devisId || 'N/A'}
              </div>
            </div>
          </div>

          {/* Paramètres généraux */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Paramètres de l'ordre
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de commencement *
                </label>
                <input
                  type="datetime-local"
                  value={editFormData.dateCommence}
                  onChange={(e) => setEditFormData(prev => ({
                    ...prev,
                    dateCommence: e.target.value
                  }))}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Atelier *
                </label>
                <select
                  value={editFormData.atelier}
                  onChange={(e) => setEditFormData(prev => ({
                    ...prev,
                    atelier: e.target.value
                  }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Sélectionner un atelier --</option>
                  {ateliers.map(atelier => (
                    <option key={atelier._id} value={atelier._id}>
                      {atelier.name} ({atelier.localisation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priorité
                </label>
                <select
                  value={editFormData.priorite}
                  onChange={(e) => setEditFormData(prev => ({
                    ...prev,
                    priorite: e.target.value
                  }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.entries(prioriteOptions).map(([key, option]) => (
                    <option key={key} value={key}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={editFormData.description}
              onChange={(e) => setEditFormData(prev => ({
                ...prev,
                description: e.target.value
              }))}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Description ou notes supplémentaires..."
            />
          </div>

          {/* Tâches */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Wrench className="h-5 w-5 mr-2" />
              Tâches ({editFormData.taches.length})
            </h3>
            <div className="space-y-4">
              {editFormData.taches.map((tache) => (
                <div key={tache._id || tache.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div>
                      <p className="font-medium text-gray-900">{tache.description}</p>
                      <p className="text-sm text-gray-600">Quantité: {tache.quantite}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service assigné *
                      </label>
                      <select
                        value={tache.serviceId || ""}
                        onChange={(e) => assignServiceToTache(tache._id || tache.id, e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">-- Sélectionner un service --</option>
                        {services.map(service => (
                          <option key={service._id} value={service._id}>
                            {service.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mécanicien assigné *
                      </label>
                      <select
                        value={tache.mecanicienId || ""}
                        onChange={(e) => assignMecanicienToTache(tache._id || tache.id, e.target.value)}
                        disabled={!tache.serviceId}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      >
                        <option value="">-- Sélectionner un mécanicien --</option>
                        {mecaniciens.map(m => (
                          <option key={m._id} value={m._id}>
                            {m.nom}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estimation (heures)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        value={tache.estimationHeures}
                        onChange={(e) => setEditFormData(prev => ({
                          ...prev,
                          taches: prev.taches.map(t =>
                            (t._id === tache._id || t.id === tache.id)
                              ? { ...t, estimationHeures: parseFloat(e.target.value) || 1 }
                              : t
                          )
                        }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes spéciales
                    </label>
                    <input
                      type="text"
                      value={tache.notes}
                      onChange={(e) => setEditFormData(prev => ({
                        ...prev,
                        taches: prev.taches.map(t =>
                          (t._id === tache._id || t.id === tache.id)
                            ? { ...t, notes: e.target.value }
                            : t
                        )
                      }))}
                      placeholder="Notes ou instructions particulières..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="mt-3 flex items-center">
                    {tache.serviceId && tache.mecanicienId ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Assignée à {tache.mecanicienNom}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Configuration incomplète
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Résumé des modifications */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Résumé des modifications</h3>
            <div className="grid grid-cols-4 gap-4 text-center text-sm">
              <div>
                <p className="font-bold text-blue-600">{editFormData.taches.length}</p>
                <p className="text-gray-600">Tâches</p>
              </div>
              <div>
                <p className="font-bold text-green-600">
                  {editFormData.taches.filter(t => t.serviceId && t.mecanicienId).length}
                </p>
                <p className="text-gray-600">Assignées</p>
              </div>
              <div>
                <p className="font-bold text-orange-600">
                  {editFormData.taches.reduce((total, tache) => total + (tache.estimationHeures || 0), 0)}h
                </p>
                <p className="text-gray-600">Temps estimé</p>
              </div>
              <div>
                <p className="font-bold text-purple-600">{prioriteOptions[editFormData.priorite]?.label}</p>
                <p className="text-gray-600">Priorité</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            onClick={saveEdit}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{loading ? 'Sauvegarde...' : 'Sauvegarder les modifications'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModificationOrdreTravail