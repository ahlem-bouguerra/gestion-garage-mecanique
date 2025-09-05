"use client"
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, User, Car, Calendar, MapPin, Wrench, Save, Eye, Trash2, AlertCircle, CheckCircle, Clock, UserCheck, FileText, X, Edit2 } from 'lucide-react';
import axios from 'axios';

const OrdreTravailSystem = () => {
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [quoteData, setQuoteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [services, setServices] = useState([]);
  const [ateliers, setAteliers] = useState([]);
  const [mecaniciens, setMecaniciens] = useState([]);
  const [statistiques, setStatistiques] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    dateCommence: '',
    atelier: '',
    priorite: 'normale',
    description: '',
    taches: []
  });

  // ✅ Structure conforme au backend
  const [ordreTravail, setOrdreTravail] = useState({
    devisId: '',
    dateCommence: '',
    atelier: '', // sera atelierId dans le backend
    priorite: 'normale',
    description: '',
    taches: []
  });

  const [ordresTravail, setOrdresTravail] = useState([]);
  const [activeTab, setActiveTab] = useState('create');
  const [selectedOrdre, setSelectedOrdre] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    atelier: '',
    priorite: '',
    dateDebut: '',
    dateFin: ''
  });

  useEffect(() => {
    const header = document.querySelector('header');
    if (selectedOrdre) {
      header.classList.add("hidden");
    } else {
      header.classList.remove("hidden");
    }
  }, [selectedOrdre]);

  // Statuts possibles selon le backend
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

  const loadServices = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/getAllServices');
      setServices(response.data);
    } catch (error) {
      console.error('Erreur chargement services:', error);
      setServices([]);
    }
  };

  const loadMecaniciensByService = async (serviceId) => {
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

  const loadDevisById = async (devisId) => {
    if (!devisId) return;

    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/devis/code/${devisId}`);
      const { devis, ordres } = response.data; // ✅ On récupère devis + ordres

      // ⚡ Vérifie si un ordre existe déjà
      if (ordres && ordres.length > 0) {
        setError(`Un ordre de travail existe déjà pour le devis ${devis.id} (ex: ${ordres[0].numeroOrdre})`);
        setQuoteData(null);
        setOrdreTravail(null);
        return;
      }

      setQuoteData(devis);

      // ✅ Créer les tâches avec la structure attendue par le backend
      const tachesFromServices = devis.services.map((service, index) => ({
        id: index + 1,
        description: service.piece,
        quantite: service.quantity || 1,
        serviceId: '',
        mecanicienId: '',
        estimationHeures: 1,
        notes: ''
      }));

      // ✅ Structure conforme au backend
      setOrdreTravail({
        devisId: devis.id,
        dateCommence: '',
        atelier: '',
        priorite: 'normale',
        description: `Ordre de travail généré depuis le devis ${devis.id}`,
        taches: tachesFromServices
      });

    } catch (err) {
      setError(`Erreur lors du chargement du devis: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };


  const assignServiceToTache = (tacheId, serviceId) => {
    const service = services.find(s => s._id === serviceId);

    loadMecaniciensByService(serviceId);

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
      setError('');

      // Validations côté client
      if (!ordreTravail.dateCommence) {
        throw new Error('La date de commencement est obligatoire');
      }

      if (!ordreTravail.atelier) {
        throw new Error('Veuillez sélectionner un atelier');
      }

      if (ordreTravail.taches.some(t => !t.serviceId)) {
        throw new Error('Toutes les tâches doivent avoir un service assigné');
      }

      if (ordreTravail.taches.some(t => !t.mecanicienId)) {
        throw new Error('Toutes les tâches doivent avoir un mécanicien assigné');
      }

      // Préparer les données avec la structure correcte
      const ordreData = {
        devisId: ordreTravail.devisId,
        dateCommence: ordreTravail.dateCommence,
        atelierId: ordreTravail.atelier, // Correction: utilisez atelierId
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

      console.log('Envoi des données:', ordreData);

      const response = await axios.post(
        'http://localhost:5000/api/',
        ordreData
      );

      // Vérification de la réponse
      if (response.data.success) {
        setSuccess(response.data.message || 'Ordre de travail créé avec succès !');

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

        // Recharger la liste si on est sur l'onglet liste
        if (activeTab === 'list') {
          loadOrdresTravail();
        }
      } else {
        throw new Error(response.data.error || 'Erreur lors de la création');
      }

    } catch (err) {
      console.error('Erreur sauvegarde ordre:', err);

      // Gestion d'erreur améliorée
      let errorMessage = 'Erreur lors de la sauvegarde';

      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
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

      // Construire l'URL en fonction des filtres
      let baseUrl = 'http://localhost:5000/api';

      // Si on filtre par statut, utiliser l'endpoint spécialisé
      if (filters.status) {
        baseUrl = `http://localhost:5000/api/ordres/status/${filters.status}`;

        // Ajouter seulement les paramètres de pagination pour ce endpoint
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
        // Si on filtre par atelier, utiliser l'endpoint spécialisé
        baseUrl = `http://localhost:5000/api/ordres/atelier/${filters.atelier}`;

        // Ajouter seulement les paramètres de pagination pour ce endpoint
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

  const loadOrdreDetails = async (ordreId) => {
    try {
      console.log('Chargement détails pour ordre:', ordreId); // Debug
      setLoading(true);

      const response = await axios.get(`http://localhost:5000/api/getOrdreTravailById/${ordreId}`);

      console.log('Réponse détails ordre:', response.data);
      console.log('Réponse complète:', response.data);
      console.log('Ordre dans réponse:', response.data.ordre);// Debug

      if (response.data.success && response.data.ordre) {
        setSelectedOrdre(response.data.ordre);
        console.log('Données reçues:', response.data.ordre); // Pour vérifier

      } else if (response.data) {
        // Si la structure est différente
        setSelectedOrdre(response.data);
      } else {
        setError('Aucune donnée reçue pour cet ordre');
      }

    } catch (error) {
      console.error('Erreur détails ordre:', error);
      setError(`Erreur lors du chargement des détails: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const demarrerOrdre = async (ordreId) => {
    // ✅ AJOUT : Demander confirmation
    const confirmation = window.confirm(
      'Êtes-vous sûr de vouloir démarrer cet ordre de travail ?\n\n' +
      'Cette action changera le statut à "En cours" et enregistrera la date de début réelle.'
    );

    if (!confirmation) {
      return; // L'utilisateur a annulé
    }

    try {
      setLoading(true);
      const response = await axios.put(
        `http://localhost:5000/api/ordre-travail/${ordreId}/demarrer`
      );

      if (response.data.success) {
        showSuccess('Ordre de travail démarré avec succès');
        // Recharger les détails de l'ordre
        await loadOrdreDetails(ordreId);
        // Mettre à jour la liste des ordres
        loadOrdresTravail();
      }
    } catch (error) {
      showError(error.response?.data?.error || 'Erreur lors du démarrage de l\'ordre');
    } finally {
      setLoading(false);
    }
  };

  const terminerOrdre = async (ordreId) => {
    // ✅ AJOUT : Demander confirmation
    const confirmation = window.confirm(
      'Êtes-vous sûr de vouloir terminer cet ordre de travail ?\n\n' +
      'Cette action changera le statut à "Terminé" et enregistrera la date de fin réelle.\n' +
      'Une fois terminé, l\'ordre ne pourra plus être modifié.'
    );

    if (!confirmation) {
      return; // L'utilisateur a annulé
    }

    try {
      setLoading(true);
      const response = await axios.put(
        `http://localhost:5000/api/ordre-travail/${ordreId}/terminer`
      );

      if (response.data.success) {
        showSuccess('Ordre de travail terminé avec succès');
        // Recharger les détails de l'ordre
        await loadOrdreDetails(ordreId);
        // Mettre à jour la liste des ordres
        loadOrdresTravail();
      }
    } catch (error) {
      showError(error.response?.data?.error || 'Erreur lors de la fin de l\'ordre');
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

  const supprimerOrdre = async (ordreId) => {
    const ordre = ordresTravail.find(o => o._id === ordreId);
    const numeroOrdre = ordre?.numeroOrdre || ordreId;

    const confirmation = window.confirm(
      `⚠️ ATTENTION ⚠️\n\n` +
      `Êtes-vous sûr de vouloir supprimer l'ordre de travail ${numeroOrdre} ?\n\n` +
      `Cette action marquera l'ordre comme supprimé et il ne sera plus visible dans la liste principale.\n\n` +
      `Cette action est réversible uniquement par un administrateur.`
    );

    if (!confirmation) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.delete(`http://localhost:5000/api/${ordreId}`);

      if (response.data.success) {
        showSuccess(`Ordre de travail ${numeroOrdre} supprimé avec succès`);
        // Recharger la liste
        loadOrdresTravail();
        // Fermer le modal si l'ordre supprimé était ouvert
        if (selectedOrdre && selectedOrdre._id === ordreId) {
          setSelectedOrdre(null);
        }
      }
    } catch (error) {
      showError(error.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };




  const startEdit = (ordreData = null) => {
    // Si aucun ordre n'est passé, utiliser selectedOrdre
    const ordre = ordreData || selectedOrdre;

    console.log('startEdit appelé avec:', ordre);

    if (!ordre) {
      showError('Aucun ordre sélectionné pour modification');
      return;
    }

    // ✅ Formater la date correctement pour input datetime-local
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

    setEditMode(true);
    console.log('EditMode défini à true'); // Debug
  };

  const cancelEdit = () => {
    console.log('Annulation de l\'édition'); // Debug
    setEditMode(false);
    setEditFormData({
      dateCommence: '',
      atelier: '',
      priorite: 'normale',
      description: '',
      taches: []
    });
  };
  const saveEdit = async () => {
    try {
      console.log('saveEdit appelé');
      console.log('selectedOrdre._id:', selectedOrdre._id); // <-- Vérifiez cette valeur
      console.log('editFormData:', editFormData);
      setLoading(true);
      setError('');


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

      console.log('Données à envoyer pour modification:', updateData);

      // CORRECTION : Utiliser selectedOrdre._id au lieu de ordre._id
      const response = await axios.put(
        `http://localhost:5000/api/modifier/${selectedOrdre._id}`,
        updateData
      );

      if (response.data.success) {
        showSuccess('Ordre de travail modifié avec succès');
        setEditMode(false);

        // Recharger les détails de l'ordre
        await loadOrdreDetails(selectedOrdre._id);

        // Recharger la liste si on est sur l'onglet liste
        if (activeTab === 'list') {
          loadOrdresTravail();
        }
      } else {
        throw new Error(response.data.error || 'Erreur lors de la modification');
      }

    } catch (err) {
      console.error('Erreur modification ordre:', err);
      let errorMessage = 'Erreur lors de la modification';

      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const assignServiceToTacheEdit = async (tacheId, serviceId) => {
    const service = services.find(s => s._id === serviceId);

    // Charger les mécaniciens pour ce service
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
            mecanicienId: '', // Reset mécanicien quand on change de service
            mecanicienNom: ''
          }
          : tache
      )
    }));
  };

  const assignMecanicienToTacheEdit = (tacheId, mecanicienId) => {
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

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };
  const renderEditForm = () => (
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
                    onChange={(e) => assignServiceToTacheEdit(tache._id || tache.id, e.target.value)}
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
                    onChange={(e) => assignMecanicienToTacheEdit(tache._id || tache.id, e.target.value)}
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
          onClick={() => setEditMode(false)}
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

  useEffect(() => {
    loadAteliers();
    loadServices();
    if (activeTab === 'list') {
      loadOrdresTravail();
      loadStatistiques();
    }
    // Vérifier si on doit afficher un ordre existant
    const savedOrdreToView = localStorage?.getItem('selectedOrdreToView');
    if (savedOrdreToView) {
      const ordre = JSON.parse(savedOrdreToView);
      setActiveTab('list');
      setSelectedOrdre(ordre);
      localStorage.removeItem('selectedOrdreToView');
    }

    const savedQuote = localStorage?.getItem('selectedQuoteForOrder');
    if (savedQuote) {
      const quote = JSON.parse(savedQuote);
      setSelectedQuote(quote.id);
      loadDevisById(quote.id);
      localStorage.removeItem('selectedQuoteForOrder');
    }
  }, [activeTab]);

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
              onClick={() => window.history?.back()}
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
                className={`py-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'create'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                Créer Ordre de Travail
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`py-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'list'
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

                {/* Attribution des tâches */}
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
                    onClick={() => {
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
                              {ordre.vehiculedetails?.nom|| 'N/A'}
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
                                  onClick={() => loadOrdreDetails(ordre._id)}
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
                                    onClick={() => {
                                      setSelectedOrdre(ordre); // ✅ Définir selectedOrdre AVANT startEdit
                                      startEdit(ordre);
                                    }}
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
        )}
        {activeTab === 'list' && statistiques && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
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

        {/* Modal de détail d'ordre */}
        {selectedOrdre && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full m-4 max-h-screen overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedOrdre.numeroOrdre || `Ordre de Travail ${selectedOrdre._id}`}
                  </h2>

                  <button
                    onClick={() => setSelectedOrdre(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {editMode ? (
                  renderEditForm()
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
                          <p><span className="font-medium">Véhicule:</span> {selectedOrdre.vehiculedetails?.nom || 'N/A'}</p>
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
                                {/* Badge d'assignation */}
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

                              {/* Affichage du service */}
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