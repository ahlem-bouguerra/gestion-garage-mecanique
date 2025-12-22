"use client"
import React, { useState, useEffect } from 'react';
import { User, Car, Calendar, Save, UserCheck, Clock } from 'lucide-react';
import { ordresTravailAPI } from './services/ordresTravailAPI';
import { useGlobalAlert } from "@/components/ui-elements/AlertProvider";

const AjoutOrdreTravail = ({
  services,
  ateliers,
  mecaniciens,
  onLoadMecaniciensByService,
  onOrdreSaved,
  onError,
  loading,
  setLoading
}) => {
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [quoteData, setQuoteData] = useState(null);
  const { showAlert } = useGlobalAlert();
  const [ordreTravail, setOrdreTravail] = useState({
    devisId: '',
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
    // Vérifier le localStorage seulement côté client
    if (typeof window !== 'undefined') {
      const savedQuote = localStorage.getItem('selectedQuoteForOrder');
      if (savedQuote) {
        const quote = JSON.parse(savedQuote);
        setSelectedQuote(quote.id);
        loadDevisById(quote.id);
        localStorage.removeItem('selectedQuoteForOrder');
      }
    }
  }, []);

  const loadDevisById = async (devisId) => {
    if (!devisId) return;

    setLoading(true);
    try {
      const response = await ordresTravailAPI.getDevisByCode(devisId);
      const { devis, ordres } = response;

      if (ordres && ordres.length > 0) {
        onError(`Un ordre de travail existe déjà pour le devis ${devis.id} (ex: ${ordres[0].numeroOrdre})`);
        setQuoteData(null);
        setOrdreTravail({
          devisId: '',
          dateCommence: '',
          atelier: '',
          priorite: 'normale',
          description: '',
          taches: []
        });
        return;
      }

      setQuoteData(devis);

      const tachesFromServices = devis.services.map((service, index) => ({
        id: index + 1,
        description: service.piece,
        quantite: service.quantity || 1,
        serviceId: '',
        mecanicienId: '',
        estimationHeures: 1,
        notes: ''
      }));

      setOrdreTravail({
        devisId: devis.id,
        dateCommence: '',
        atelier: '',
        priorite: 'normale',
        description: `Ordre de travail généré depuis le devis ${devis.id}`,
        taches: tachesFromServices
      });

} catch (error) {
  if (error.response?.status === 403) {
    showAlert("error", "Accès refusé", "Vous n'avez pas la permission")
  }
  onError(`Erreur lors du chargement du devis: ${error.message}`); // ⭐ "error", pas "err"
} finally {
  setLoading(false);
}
};

  const assignServiceToTache = (tacheId, serviceId) => {
    const service = services.find(s => s._id === serviceId);
    onLoadMecaniciensByService(serviceId);

    setOrdreTravail(prev => ({
      ...prev,
      taches: prev.taches.map(tache =>
        tache.id === tacheId
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

  const assignMecanicienToTache = (tacheId, mecanicienId) => {
    const mecanicien = mecaniciens.find(m => m._id === mecanicienId);

    setOrdreTravail(prev => ({
      ...prev,
      taches: prev.taches.map(tache =>
        tache.id === tacheId
          ? {
            ...tache,
            mecanicienId: mecanicienId,
            mecanicienNom: mecanicien ? mecanicien.nom : ''
          }
          : tache
      )
    }));
  };

  const saveOrdreTravail = async () => {
    try {
      setLoading(true);

      // Validations
      if (!ordreTravail.dateCommence) {
        showAlert("error", "date de commencement", "La date de commencement est obligatoire");
      }
      if (!ordreTravail.atelier) {
        showAlert("error", "atelier", "Veuillez sélectionner un atelier");
      }
      if (ordreTravail.taches.some(t => !t.serviceId)) {
        showAlert("error", "service", "Toutes les tâches doivent avoir un service assigné");
      }
      if (ordreTravail.taches.some(t => !t.mecanicienId)) {
        showAlert("error", "mecanicien", "Toutes les tâches doivent avoir un mécanicien assigné");
      }

      const ordreData = {
        devisId: ordreTravail.devisId,
        dateCommence: ordreTravail.dateCommence,
        atelierId: ordreTravail.atelier,
        priorite: ordreTravail.priorite,
        description: ordreTravail.description,
        taches: ordreTravail.taches.map(tache => ({
          description: tache.description,
          quantite: tache.quantite,
          serviceId: tache.serviceId,
          mecanicienId: tache.mecanicienId,
          estimationHeures: tache.estimationHeures,
          notes: tache.notes
        }))
      };

      await ordresTravailAPI.createOrdre(ordreData);

      // Reset du formulaire
      setOrdreTravail({
        devisId: '',
        dateCommence: '',
        atelier: '',
        priorite: 'normale',
        description: '',
        taches: []
      });
      setQuoteData(null);
      setSelectedQuote('');

      onOrdreSaved();

} catch (error) {  // ⭐ La variable s'appelle "error"
  if (error.response?.status === 403) {
    showAlert("error", "Accès refusé", "Vous n'avez pas la permission");
  }
  onError(error.message || 'Erreur lors de la sauvegarde'); // ⭐ Utiliser "error", pas "err"
} finally {
  setLoading(false);
}
  };

  const resetForm = () => {
    setQuoteData(null);
    setSelectedQuote('');
    setOrdreTravail({
      devisId: '',
      dateCommence: '',
      atelier: '',
      priorite: 'normale',
      description: '',
      taches: []
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Créer un Ordre de Travail</h2>

      {/* Section recherche devis */}
      <div className="mb-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Rechercher un Devis</h3>
        <div className="flex space-x-4">
          <input
            type="text"
            value={selectedQuote || ''}
            onChange={(e) => setSelectedQuote(e.target.value)}
            placeholder="Entrez l'ID du devis"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => loadDevisById(selectedQuote)}
            disabled={loading || !selectedQuote}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Chargement...' : 'Charger Devis'}
          </button>
        </div>
      </div>

      {quoteData && (
        <>
          {/* Informations devis */}
          <div className="mb-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informations du Devis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">Client</p>
                  <p className="text-gray-600">{quoteData.clientName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Car className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">Véhicule</p>
                  <p className="text-gray-600">{quoteData.vehicleInfo}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">Date d'inspection</p>
                  <p className="text-gray-600">{quoteData.inspectionDate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Paramètres ordre */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Paramètres de l'Ordre de Travail</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de commencement *
                </label>
                <input
                  type="datetime-local"
                  value={ordreTravail.dateCommence}
                  onChange={(e) => setOrdreTravail(prev => ({ ...prev, dateCommence: e.target.value }))}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Atelier *
                </label>
                <select
                  value={ordreTravail.atelier}
                  onChange={(e) => setOrdreTravail(prev => ({ ...prev, atelier: e.target.value }))}
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
                  value={ordreTravail.priorite}
                  onChange={(e) => setOrdreTravail(prev => ({ ...prev, priorite: e.target.value }))}
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
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description / Notes supplémentaires
            </label>
            <textarea
              value={ordreTravail.description}
              onChange={(e) => setOrdreTravail(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ajoutez des notes ou instructions spéciales..."
            />
          </div>

          {/* Attribution tâches */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Attribution des Tâches</h3>
            <div className="space-y-4">
              {ordreTravail.taches.map((tache) => (
                <div key={tache.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
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
                        onChange={(e) => assignServiceToTache(tache.id, e.target.value)}
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
                        onChange={(e) => assignMecanicienToTache(tache.id, e.target.value)}
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
                        onChange={(e) => setOrdreTravail(prev => ({
                          ...prev,
                          taches: prev.taches.map(t =>
                            t.id === tache.id
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
                      onChange={(e) => setOrdreTravail(prev => ({
                        ...prev,
                        taches: prev.taches.map(t =>
                          t.id === tache.id
                            ? { ...t, notes: e.target.value }
                            : t
                        )
                      }))}
                      placeholder="Notes ou instructions particulières pour cette tâche..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="mt-3 flex items-center">
                    {tache.serviceId && tache.mecanicienId ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Assignée
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Non assignée
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            <button
              onClick={saveOrdreTravail}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Sauvegarde...' : 'Créer l\'Ordre de Travail'}</span>
            </button>

            <button
              onClick={resetForm}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Annuler
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AjoutOrdreTravail;