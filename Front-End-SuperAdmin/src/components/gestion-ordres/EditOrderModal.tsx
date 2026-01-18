// EditOrderModal.tsx - Formulaire de modification d'ordre

"use client";
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import {
  updateOrdre,
  getAteliers,
  getServices,
  getMecaniciensByService
} from './api';

const getClientName = (ordre: any) => {
  // Priorité 1 : clientInfo avec Client lié
  if (ordre.clientInfo?.ClientId?.clientId?.username) {
    return ordre.clientInfo.ClientId.clientId.username;
  }
  
  // Priorité 2 : clientInfo direct
  if (ordre.clientInfo?.ClientId?.nom) {
    return ordre.clientInfo.ClientId.nom;
  }
  
  // Priorité 3 : via devis avec Client lié
  if (ordre.devisId?.clientId?.clientId?.username) {
    return ordre.devisId.clientId.clientId.username;
  }
  
  // Priorité 4 : via devis direct
  if (ordre.devisId?.clientId?.nom) {
    return ordre.devisId.clientId.nom;
  }
  
  return 'N/A';
};


interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  ordre: any; // L'ordre à modifier
  garageId: string;
  garageName: string;
  onSuccess: () => void;
}

const EditOrderModal: React.FC<EditOrderModalProps> = ({
  isOpen,
  onClose,
  ordre,
  garageId,
  garageName,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [ateliers, setAteliers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [mecaniciens, setMecaniciens] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    dateCommence: '',
    atelierId: '',
    priorite: 'normale',
    description: '',
    taches: [] as any[]
  });

  // Charger les données initiales
  useEffect(() => {
    if (isOpen && ordre) {
      loadInitialData();
    }
  }, [isOpen, ordre]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📥 Chargement données pour modification:', ordre.numeroOrdre);
      
      // Charger les ateliers et services
      const [ateliersRes, servicesRes] = await Promise.all([
        getAteliers(garageId),
        getServices(garageId)
      ]);

      setAteliers(ateliersRes?.ateliers || ateliersRes || []);
      setServices(servicesRes?.services || servicesRes || []);
      
      // Pré-remplir le formulaire avec les données de l'ordre
      const tachesFormatees = (ordre.taches || []).map((tache: any, index: number) => ({
        id: tache._id || Date.now() + index,
        _id: tache._id, // Garder l'ID original pour la mise à jour
        description: tache.description || '',
        quantite: tache.quantite || 1,
        serviceId: tache.serviceId?._id || tache.serviceId || '',
        mecanicienId: tache.mecanicienId?._id || tache.mecanicienId || '',
        estimationHeures: tache.estimationHeures || 1,
        notes: tache.notes || '',
        status: tache.status || 'assignee',
        dateDebut: tache.dateDebut || null,
        dateFin: tache.dateFin || null,
        heuresReelles: tache.heuresReelles || 0
      }));

      // Charger les mécaniciens pour chaque service déjà sélectionné
      for (const tache of tachesFormatees) {
        if (tache.serviceId) {
          await loadMecaniciensForService(tache.serviceId);
        }
      }

      setFormData({
        dateCommence: ordre.dateCommence 
          ? new Date(ordre.dateCommence).toISOString().slice(0, 16)
          : '',
        atelierId: ordre.atelierId?._id || ordre.atelierId || '',
        priorite: ordre.priorite || 'normale',
        description: ordre.description || '',
        taches: tachesFormatees
      });

      console.log('✅ Données chargées et formulaire pré-rempli');
      
    } catch (err: any) {
      console.error('❌ Erreur chargement données:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadMecaniciensForService = async (serviceId: string) => {
    try {
      console.log('📥 Chargement mécaniciens pour service:', serviceId);
      
      const response = await getMecaniciensByService(serviceId, garageId);
      
      console.log('✅ Mécaniciens:', response);
      
      setMecaniciens(response?.mecaniciens || response || []);
    } catch (err: any) {
      console.error('❌ Erreur chargement mécaniciens:', err);
    }
  };

  const addTache = () => {
    setFormData(prev => ({
      ...prev,
      taches: [
        ...prev.taches,
        {
          id: Date.now(),
          description: '',
          quantite: 1,
          serviceId: '',
          mecanicienId: '',
          estimationHeures: 1,
          notes: '',
          status: 'assignee'
        }
      ]
    }));
  };

  const removeTache = (tacheId: number) => {
    setFormData(prev => ({
      ...prev,
      taches: prev.taches.filter(t => t.id !== tacheId)
    }));
  };

  const updateTache = (tacheId: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      taches: prev.taches.map(t => {
        if (t.id === tacheId) {
          const updated = { ...t, [field]: value };
          
          // Si on change le service, charger les mécaniciens et reset le mécanicien
          if (field === 'serviceId') {
            loadMecaniciensForService(value);
            updated.mecanicienId = '';
          }
          
          return updated;
        }
        return t;
      })
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      // Validation
      if (!formData.dateCommence || !formData.atelierId) {
        setError('Veuillez remplir tous les champs obligatoires');
        return;
      }

      if (formData.taches.length === 0) {
        setError('Au moins une tâche est requise');
        return;
      }

      if (formData.taches.some(t => !t.serviceId || !t.mecanicienId)) {
        setError('Toutes les tâches doivent avoir un service et un mécanicien');
        return;
      }

      const updateData = {
        dateCommence: formData.dateCommence,
        atelierId: formData.atelierId,
        priorite: formData.priorite,
        description: formData.description,
        garageId, // ⭐ IMPORTANT pour SuperAdmin
        taches: formData.taches.map(t => ({
          _id: t._id, // Inclure l'ID pour les tâches existantes
          description: t.description,
          quantite: t.quantite,
          serviceId: t.serviceId,
          mecanicienId: t.mecanicienId,
          estimationHeures: t.estimationHeures,
          notes: t.notes,
          status: t.status,
          dateDebut: t.dateDebut,
          dateFin: t.dateFin,
          heuresReelles: t.heuresReelles
        }))
      };

      console.log('📤 Envoi modification ordre:', updateData);

      await updateOrdre(ordre._id, updateData);
      
      console.log('✅ Ordre modifié avec succès');
      
      onSuccess();
      onClose();

    } catch (err: any) {
      console.error('❌ Erreur modification ordre:', err);
      setError(err.response?.data?.error || 'Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Modifier l'Ordre de Travail
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {ordre?.numeroOrdre} - {garageName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Loading Initial Data */}
        {loading && formData.taches.length === 0 ? (
          <div className="p-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Chargement des données...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Info Ordre */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Informations Ordre</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Numéro:</span>
                  <span className="ml-2 font-medium">{ordre?.numeroOrdre}</span>
                </div>
                <div>
                  <span className="text-gray-600">Devis:</span>
                  <span className="ml-2 font-medium">{ordre?.devisId?.id || ordre?.devisId}</span>
                </div>
                <div>
                  <span className="text-gray-600">Client:</span>
                  <span className="ml-2 font-medium">
                    {getClientName(ordre)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Véhicule:</span>
                  <span className="ml-2 font-medium">
                    {ordre?.vehiculedetails?.nom || ordre?.devisId?.vehicleInfo || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Paramètres */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date début *
                </label>
                <input
                  type="datetime-local"
                  value={formData.dateCommence}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateCommence: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Atelier *
                </label>
                <select
                  value={formData.atelierId}
                  onChange={(e) => setFormData(prev => ({ ...prev, atelierId: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Sélectionner --</option>
                  {ateliers.map(atelier => (
                    <option key={atelier._id} value={atelier._id}>
                      {atelier.name} ({atelier.localisation || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priorité
                </label>
                <select
                  value={formData.priorite}
                  onChange={(e) => setFormData(prev => ({ ...prev, priorite: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="faible">Faible</option>
                  <option value="normale">Normale</option>
                  <option value="elevee">Élevée</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Description de l'ordre de travail..."
              />
            </div>

            {/* Tâches */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Tâches ({formData.taches.length})
                </h3>
                <button
                  type="button"
                  onClick={addTache}
                  className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>

              <div className="space-y-4">
                {formData.taches.map((tache, index) => (
                  <div key={tache.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">
                          Tâche #{index + 1}
                        </span>
                        {tache.status && (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            tache.status === 'terminee' ? 'bg-green-100 text-green-800' :
                            tache.status === 'en_cours' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {tache.status === 'terminee' ? 'Terminée' :
                             tache.status === 'en_cours' ? 'En cours' : 'En attente'}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTache(tache.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Description *
                        </label>
                        <input
                          type="text"
                          value={tache.description}
                          onChange={(e) => updateTache(tache.id, 'description', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                          placeholder="Description de la tâche"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Quantité
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={tache.quantite}
                          onChange={(e) => updateTache(tache.id, 'quantite', parseInt(e.target.value))}
                          className="w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Service *
                        </label>
                        <select
                          value={tache.serviceId}
                          onChange={(e) => updateTache(tache.id, 'serviceId', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">-- Sélectionner --</option>
                          {services.map(service => (
                            <option key={service._id} value={service._id}>
                              {service.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Mécanicien *
                        </label>
                        <select
                          value={tache.mecanicienId}
                          onChange={(e) => updateTache(tache.id, 'mecanicienId', e.target.value)}
                          disabled={!tache.serviceId}
                          className="w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                          required
                        >
                          <option value="">-- Sélectionner --</option>
                          {mecaniciens.map(mec => (
                            <option key={mec._id} value={mec._id}>
                              {mec.nom}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Estimation (heures)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          value={tache.estimationHeures}
                          onChange={(e) => updateTache(tache.id, 'estimationHeures', parseFloat(e.target.value))}
                          className="w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Notes
                        </label>
                        <input
                          type="text"
                          value={tache.notes}
                          onChange={(e) => updateTache(tache.id, 'notes', e.target.value)}
                          placeholder="Notes optionnelles..."
                          className="w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {formData.taches.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Aucune tâche. Cliquez sur "Ajouter" pour en créer une.
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="submit"
                disabled={loading || formData.taches.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Modification...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Enregistrer les modifications
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditOrderModal;