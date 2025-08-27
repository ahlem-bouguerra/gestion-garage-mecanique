"use client"
import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Car, Calendar, MapPin, Wrench, Save, Eye, AlertCircle, CheckCircle, Clock, UserCheck } from 'lucide-react';
import axios from 'axios';

const OrdreTravailSystem = () => {
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [quoteData, setQuoteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // États pour l'ordre de travail
  const [ordreTravail, setOrdreTravail] = useState({
    devisId: '',
    clientInfo: {},
    vehiculeInfo: '',
    dateCommence: '',
    atelier: '',
    priorite: 'normale',
    description: '',
    taches: [],
    status: 'en_attente'
  });

  // Liste des mécaniciens et ateliers (normalement viendraient d'une API)
  const [mecaniciens, setMecaniciens] = useState([]);
  const [ateliers, setAteliers] = useState([
    { id: 1, nom: 'Atelier Mécanique Générale', localisation: 'Zone A' },
    { id: 2, nom: 'Atelier Carrosserie', localisation: 'Zone B' },
    { id: 3, nom: 'Atelier Électricité Auto', localisation: 'Zone C' },
    { id: 4, nom: 'Atelier Pneumatiques', localisation: 'Zone D' }
  ]);

  const [ordresTravail, setOrdresTravail] = useState([]);
  const [activeTab, setActiveTab] = useState('create');
  const [selectedOrdre, setSelectedOrdre] = useState(null);

  // Statuts possibles
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

  // Charger les mécaniciens depuis l'API
const loadMecaniciens = async () => {
  try {
    console.log('🔄 Chargement des mécaniciens...');
    const response = await axios.get('http://localhost:5000/api/getAllMecaniciens');
    console.log('✅ Réponse API:', response.data);
    setMecaniciens(response.data);
  } catch (error) {
    console.error('❌ Erreur complète:', error);
    showError(`Erreur: ${error.message}`);
    setMecaniciens([]);
  }
};
  

  // Charger un devis spécifique par ID
  const loadDevisById = async (devisId) => {
    if (!devisId) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/Devis/${devisId}`);
      const devis = response.data;
      
      setQuoteData(devis);
      
      // Initialiser l'ordre de travail avec les données du devis
      const tachesFromServices = devis.services.map((service, index) => ({
        id: index + 1,
        description: service.piece,
        quantite: service.quantity,
        mecanicienId: '',
        mecanicienNom: '',
        estimationHeures: 1,
        status: 'non_assignee',
        notes: ''
      }));

      setOrdreTravail({
        devisId: devis.id,
        clientInfo: {
          nom: devis.clientName,
          id: devis.clientId
        },
        vehiculeInfo: devis.vehicleInfo,
        dateCommence: '',
        atelier: '',
        priorite: 'normale',
        description: `Ordre de travail généré depuis le devis ${devis.id}`,
        taches: tachesFromServices,
        status: 'en_attente'
      });

    } catch (err) {
      setError(`Erreur lors du chargement du devis: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Gérer la sélection d'un mécanicien pour une tâche
  const assignMecanicienToTache = (tacheId, mecanicienId) => {
    const mecanicien = mecaniciens.find(m => m.id === parseInt(mecanicienId));
    
    setOrdreTravail(prev => ({
      ...prev,
      taches: prev.taches.map(tache => 
        tache.id === tacheId 
          ? { 
              ...tache, 
              mecanicienId: mecanicienId,
              mecanicienNom: mecanicien ? mecanicien.nom : '',
              status: mecanicienId ? 'assignee' : 'non_assignee'
            }
          : tache
      )
    }));
  };

  // Sauvegarder l'ordre de travail
  const saveOrdreTravail = async () => {
    try {
      setLoading(true);

      // Validation
      if (!ordreTravail.dateCommence) {
        setError('La date de commencement est obligatoire');
        return;
      }

      if (!ordreTravail.atelier) {
        setError('Veuillez sélectionner un atelier');
        return;
      }

      if (ordreTravail.taches.some(t => !t.mecanicienId)) {
        setError('Toutes les tâches doivent avoir un mécanicien assigné');
        return;
      }

      // Ici vous feriez l'appel API pour sauvegarder
      const response = await axios.post('http://localhost:5000/api/ordres-travail', ordreTravail);
      
      setSuccess('Ordre de travail créé avec succès !');
      
      // Ajouter à la liste locale
      setOrdresTravail(prev => [...prev, { ...ordreTravail, id: Date.now() }]);
      
      // Reset du formulaire
      setOrdreTravail({
        devisId: '',
        clientInfo: {},
        vehiculeInfo: '',
        dateCommence: '',
        atelier: '',
        priorite: 'normale',
        description: '',
        taches: [],
        status: 'en_attente'
      });
      setQuoteData(null);

    } catch (err) {
      setError(`Erreur lors de la sauvegarde: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Charger les ordres de travail existants
  const loadOrdresTravail = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/ordres-travail');
      setOrdresTravail(response.data);
    } catch (error) {
      // Données de test pour la démonstration
      setOrdresTravail([]);
    }
  };

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  useEffect(() => {
    loadMecaniciens();
    loadOrdresTravail();

    // Récupérer le devis depuis localStorage si venant de la page devis
    const savedQuote = localStorage.getItem('selectedQuoteForOrder');
    if (savedQuote) {
      const quote = JSON.parse(savedQuote);
      loadDevisById(quote.id);
      localStorage.removeItem('selectedQuoteForOrder'); // Nettoyer après usage
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Ordres de Travail</h1>
              <p className="text-gray-600">Gestion des ordres de travail pour l'atelier</p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Retour</span>
            </button>
          </div>
        </div>

        {/* Messages d'erreur et de succès */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6 flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            {success}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('create')}
                className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'create'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Créer Ordre de Travail
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'list'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Liste des Ordres
              </button>
            </nav>
          </div>
        </div>

        {/* Contenu */}
        {activeTab === 'create' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Créer un Ordre de Travail</h2>

            {/* Section de recherche de devis */}
            <div className="mb-8 bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Rechercher un Devis</h3>
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={selectedQuote}
                  onChange={(e) => setSelectedQuote(e.target.value)}
                  placeholder="Entrez l'ID du devis"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => loadDevisById(selectedQuote)}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Chargement...' : 'Charger Devis'}
                </button>
              </div>
            </div>

            {/* Informations du devis chargé */}
            {quoteData && (
              <>
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

                {/* Paramètres de l'ordre de travail */}
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
                        onChange={(e) => setOrdreTravail(prev => ({...prev, dateCommence: e.target.value}))}
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
                        onChange={(e) => setOrdreTravail(prev => ({...prev, atelier: e.target.value}))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">-- Sélectionner un atelier --</option>
                        {ateliers.map(atelier => (
                          <option key={atelier.id} value={atelier.id}>
                            {atelier.nom} ({atelier.localisation})
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
                        onChange={(e) => setOrdreTravail(prev => ({...prev, priorite: e.target.value}))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {Object.entries(prioriteOptions).map(([key, option]) => (
                          <option key={key} value={key}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Statut
                      </label>
                      <select
                        value={ordreTravail.status}
                        onChange={(e) => setOrdreTravail(prev => ({...prev, status: e.target.value}))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {Object.entries(statusOptions).map(([key, option]) => (
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
                    onChange={(e) => setOrdreTravail(prev => ({...prev, description: e.target.value}))}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ajoutez des notes ou instructions spéciales..."
                  />
                </div>

                {/* Assignment des tâches */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Attribution des Tâches</h3>
                  <div className="space-y-4">
                    {ordreTravail.taches.map((tache, index) => (
                      <div key={tache.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                          <div>
                            <p className="font-medium text-gray-900">{tache.description}</p>
                            <p className="text-sm text-gray-600">Quantité: {tache.quantite}</p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Mécanicien assigné *
                            </label>
                            <select
  value={tache.mecanicienId ?? ""}   // ✅ si c'est null => vide
  onChange={(e) => assignMecanicienToTache(tache.id, e.target.value)}
>
  <option value="">-- Sélectionner un mécanicien --</option>
  {mecaniciens.map(m => (
    <option key={m._id} value={m._id}>
      {m.nom} ({m.status})
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
                                    ? {...t, estimationHeures: parseFloat(e.target.value) || 1}
                                    : t
                                )
                              }))}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div className="flex items-center">
                            {tache.status === 'assignee' ? (
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
                                  ? {...t, notes: e.target.value}
                                  : t
                              )
                            }))}
                            placeholder="Notes ou instructions particulières pour cette tâche..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
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
                    onClick={() => {
                      setQuoteData(null);
                      setOrdreTravail({
                        devisId: '',
                        clientInfo: {},
                        vehiculeInfo: '',
                        dateCommence: '',
                        atelier: '',
                        priorite: 'normale',
                        description: '',
                        taches: [],
                        status: 'en_attente'
                      });
                    }}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'list' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Liste des Ordres de Travail</h2>
            </div>
            
            {ordresTravail.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun ordre de travail créé pour le moment</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ordre #
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
                        <tr key={ordre.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            OT-{ordre.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {ordre.clientInfo.nom}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {ordre.vehiculeInfo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(ordre.dateCommence).toLocaleDateString('fr-FR')}
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
                            <button
                              onClick={() => setSelectedOrdre(ordre)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Voir détails"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal de détail d'ordre */}
        {selectedOrdre && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full m-4 max-h-screen overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Ordre de Travail OT-{selectedOrdre.id}</h2>
                  <button
                    onClick={() => setSelectedOrdre(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-6 w-6" />
                  </button>
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
                      <p><span className="font-medium">Nom:</span> {selectedOrdre.clientInfo.nom}</p>
                      <p><span className="font-medium">Véhicule:</span> {selectedOrdre.vehiculeInfo}</p>
                      <p><span className="font-medium">Devis N°:</span> {selectedOrdre.devisId}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Détails Opérationnels
                    </h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Date début:</span> {new Date(selectedOrdre.dateCommence).toLocaleString('fr-FR')}</p>
                      <p><span className="font-medium">Atelier:</span> {ateliers.find(a => a.id == selectedOrdre.atelier)?.nom || 'Non spécifié'}</p>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Priorité:</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${prioriteOptions[selectedOrdre.priorite]?.color}`}>
                          {prioriteOptions[selectedOrdre.priorite]?.label}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Statut:</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusOptions[selectedOrdre.status]?.color}`}>
                          {React.createElement(statusOptions[selectedOrdre.status]?.icon || Clock, { className: "h-3 w-3 mr-1" })}
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
                    Tâches Assignées ({selectedOrdre.taches.length})
                  </h3>
                  
                  <div className="space-y-3">
                    {selectedOrdre.taches.map((tache, index) => (
                      <div key={tache.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{tache.description}</h4>
                            <p className="text-sm text-gray-600">Quantité: {tache.quantite} | Estimation: {tache.estimationHeures}h</p>
                          </div>
                          <div className="ml-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              tache.status === 'assignee' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {tache.status === 'assignee' ? (
                                <>
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  Assignée
                                </>
                              ) : (
                                <>
                                  <Clock className="h-3 w-3 mr-1" />
                                  Non assignée
                                </>
                              )}
                            </span>
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

                        {tache.notes && (
                          <div className="mt-3 bg-yellow-50 p-3 rounded">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Notes:</span> {tache.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Résumé statistique */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Résumé</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{selectedOrdre.taches.length}</p>
                      <p className="text-sm text-gray-600">Tâches Total</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {selectedOrdre.taches.filter(t => t.status === 'assignee').length}
                      </p>
                      <p className="text-sm text-gray-600">Assignées</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-600">
                        {selectedOrdre.taches.reduce((total, tache) => total + tache.estimationHeures, 0)}h
                      </p>
                      <p className="text-sm text-gray-600">Temps Total</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
                <button
                  onClick={() => setSelectedOrdre(null)}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Fermer
                </button>
                <button
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  onClick={() => {
                    // Ici vous pourriez ajouter la fonction d'impression
                    window.print();
                  }}
                >
                  <FileText className="h-4 w-4" />
                  <span>Imprimer</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdreTravailSystem;