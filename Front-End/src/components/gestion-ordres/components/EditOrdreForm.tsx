import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Atelier {
  _id: string;
  name: string;
  localisation: string;
}

interface Service {
  _id: string;
  name: string;
}

interface Mecanicien {
  _id: string;
  nom: string;
}

interface TacheEdit {
  _id: string;
  id?: string | number;
  description: string;
  quantite: number;
  serviceId: string;
  serviceNom?: string;
  mecanicienId: string;
  mecanicienNom?: string;
  estimationHeures: number;
  notes: string;
  status?: string;
}

interface EditFormData {
  dateCommence: string;
  atelier: string;
  priorite: 'faible' | 'normale' | 'elevee' | 'urgente';
  description: string;
  taches: TacheEdit[];
}

interface OrdreTravail {
  _id: string;
  numeroOrdre?: string;
  dateCommence: string;
  atelierId?: string;
  atelier?: string;
  priorite: string;
  description: string;
  taches: TacheEdit[];
}

interface EditOrdreFormProps {
  selectedOrdre: OrdreTravail;
  onCancel: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onReloadDetails: (ordreId: string) => void;
  onReloadList: () => void;
}

const EditOrdreForm: React.FC<EditOrdreFormProps> = ({
  selectedOrdre,
  onCancel,
  onSuccess,
  onError,
  onReloadDetails,
  onReloadList
}) => {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [ateliers, setAteliers] = useState<Atelier[]>([]);
  const [mecaniciens, setMecaniciens] = useState<Mecanicien[]>([]);

  const prioriteOptions = {
    'faible': { label: 'Faible', color: 'bg-gray-100 text-gray-800' },
    'normale': { label: 'Normale', color: 'bg-blue-100 text-blue-800' },
    'elevee': { label: 'Élevée', color: 'bg-orange-100 text-orange-800' },
    'urgente': { label: 'Urgente', color: 'bg-red-100 text-red-800' }
  };

  // Formater la date pour input datetime-local
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  const [editFormData, setEditFormData] = useState<EditFormData>({
    dateCommence: formatDateForInput(selectedOrdre.dateCommence),
    atelier: selectedOrdre.atelierId || selectedOrdre.atelier || '',
    priorite: (selectedOrdre.priorite as any) || 'normale',
    description: selectedOrdre.description || '',
    taches: selectedOrdre.taches?.map(tache => ({
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

  const loadAteliers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/getAllAteliers');
      setAteliers(response.data);
    } catch (error) {
      console.error('Erreur chargement ateliers:', error);
      setAteliers([]);
    }
  };

  const loadServices = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/getAllServices');
      setServices(response.data);
    } catch (error) {
      console.error('Erreur chargement services:', error);
      setServices([]);
    }
  };

  const loadMecaniciensByService = async (serviceId: string) => {
    try {
      if (!serviceId) {
        setMecaniciens([]);
        return;
      }
      const response = await axios.get(`http://localhost:5000/api/mecaniciens/by-service/${serviceId}`);
      setMecaniciens(response.data);
    } catch (error) {
      console.error('Erreur chargement mécaniciens:', error);
      setMecaniciens([]);
    }
  };

  const assignServiceToTacheEdit = async (tacheId: string, serviceId: string) => {
    const service = services.find(s => s._id === serviceId);

    if (serviceId) {
      await loadMecaniciensByService(serviceId);
    }

    setEditFormData(prev => ({
      ...prev,
      taches: prev.taches.map(tache =>
        tache._id === tacheId || tache.id === tacheId
          ? {
              ...tache,
              serviceId: serviceId,
              serviceNom: service ? service.name : '',
              mecanicienId: '',
              mecanicienNom: ''
            }
          : tache
      )
    }));
  };

  const assignMecanicienToTacheEdit = (tacheId: string, mecanicienId: string) => {
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

      const response = await axios.put(
        `http://localhost:5000/api/modifier/${selectedOrdre._id}`,
        updateData
      );

      if (response.data.success) {
        onSuccess('Ordre de travail modifié avec succès');
        onCancel(); // Fermer le mode édition
        await onReloadDetails(selectedOrdre._id);
        onReloadList();
      } else {
        throw new Error(response.data.error || 'Erreur lors de la modification');
      }

    } catch (err: any) {
      console.error('Erreur modification ordre:', err);
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

  useEffect(() => {
    loadAteliers();
    loadServices();
  }, []);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Modification de l'ordre de travail</h3>

      {/* Paramètres généraux */}
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
              priorite: e.target.value as any
            }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {Object.entries(prioriteOptions).map(([key, option]) => (
              <option key={key} value={key}>{option.label}</option>
            ))}
          </select>
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
        />
      </div>

      {/* Tâches */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4">Tâches</h4>
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
                    onChange={(e) => assignServiceToTacheEdit(tache._id, e.target.value)}
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
                    onChange={(e) => assignMecanicienToTacheEdit(tache._id, e.target.value)}
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
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={onCancel}
          className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={saveEdit}
          disabled={loading}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
};

export default EditOrdreForm;