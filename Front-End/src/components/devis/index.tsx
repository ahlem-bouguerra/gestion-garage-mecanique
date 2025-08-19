"use client"
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Eye, Send, Check, X, Car, User, Calendar, FileText, Euro, AlertCircle, Trash2 } from 'lucide-react';

import axios from 'axios';



const GarageQuoteSystem = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [vehicules, setVehicules] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [loadingVehicules, setLoadingVehicules] = useState(false);
  const [tvaRate, setTvaRate] = useState(20); // TVA par défaut à 20%
  const [maindoeuvre, setMaindoeuvre] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    clientName: '',
    dateDebut: '',
    dateFin: ''
  });

  const [newQuote, setNewQuote] = useState({
    clientName: '',
    vehicleInfo: '',
    inspectionDate: '',
    services: [{ piece: '', quantity: 1, unitPrice: 0 }]
  });


  const [pieces, setPieces] = useState([]);
  const [loadingPieces, setLoadingPieces] = useState(false);
  const [newquote, setNewquote] = useState({
    services: [
      {
        pieceId: '',
        piece: '',
        quantity: 1,
        unitPrice: 0
      }
    ]
  });

  const [showAddPieceModal, setShowAddPieceModal] = useState(false);
  const [currentServiceIndex, setCurrentServiceIndex] = useState(null);
  const [newPiece, setNewPiece] = useState({
    name: '',
    prix: 0,
    description: ''
  });






  const statusColors = {
    brouillon: 'bg-gray-100 text-gray-800',
    envoye: 'bg-blue-100 text-blue-800',
    accepte: 'bg-green-100 text-green-800',
    refuse: 'bg-red-100 text-red-800'
  };

  const statusIcons = {
    brouillon: FileText,
    envoye: Send,
    accepte: Check,
    refuse: X
  };



  const calculateTotal = (services, maindoeuvre = 0) => {
    const totalServicesHT = services.reduce((sum, service) => {
      return sum + (service.quantity * service.unitPrice);
    }, 0);

    const totalHT = totalServicesHT + maindoeuvre;

    return {
      totalHT,
      totalTTC: totalHT * (1 + tvaRate / 100)
    };
  };

  const saveQuote = async () => {
    try {
      setLoading(true);

      // Validation
      if (!selectedClientId || !newQuote.vehicleInfo || !newQuote.inspectionDate) {
        showError('Veuillez remplir tous les champs obligatoires');
        return;
      }

      if (newQuote.services.some(s => !s.pieceId || s.quantity <= 0 || s.unitPrice < 0)) {
        showError('Veuillez vérifier les services (pièces, quantités, prix)');
        return;
      }

      const devisData = {
        clientId: selectedClientId,
        clientName: newQuote.clientName,
        vehicleInfo: newQuote.vehicleInfo,
        inspectionDate: newQuote.inspectionDate,
        services: newQuote.services,
        tvaRate: tvaRate,
        maindoeuvre: maindoeuvre
      };

      await devisApi.create(devisData);

      showSuccess('Devis créé avec succès !');

      // Reset du formulaire
      setNewQuote({
        clientName: '',
        vehicleInfo: '',
        inspectionDate: '',
        services: [{ pieceId: '', piece: '', quantity: 1, unitPrice: 0 }]
      });
      setSelectedClientId('');
      setTvaRate(20);
      setVehicules([]);
      setMaindoeuvre(0);

      // Recharger la liste et revenir à l'onglet liste
      await loadDevis();
      setActiveTab('list');

    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };


  const changeQuoteStatus = async (quoteId, newStatus) => {
    try {
      await devisApi.updateStatus(quoteId, newStatus);

      showSuccess(`Devis ${newStatus} avec succès`);

      // Mettre à jour localement
      setQuotes(quotes.map(quote =>
        quote.id === quoteId ? { ...quote, status: newStatus } : quote
      ));

      // Mettre à jour le devis sélectionné si c'est le même
      if (selectedQuote && selectedQuote.id === quoteId) {
        setSelectedQuote({ ...selectedQuote, status: newStatus });
      }

    } catch (err) {
      showError(err.message);
    }
  };

  const deleteQuote = async (quoteId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) {
      return;
    }

    try {
      await devisApi.delete(quoteId);
      showSuccess('Devis supprimé avec succès');

      // Supprimer localement
      setQuotes(quotes.filter(quote => quote.id !== quoteId));

      // Fermer le modal si c'est le devis affiché
      if (selectedQuote && selectedQuote.id === quoteId) {
        setSelectedQuote(null);
      }

    } catch (err) {
      showError(err.message);
    }
  };

  const sendQuote = (quoteId) => {
    setQuotes(quotes.map(quote =>
      quote.id === quoteId ? { ...quote, status: 'envoye' } : quote
    ));
  };

  const acceptQuote = (quoteId) => {
    setQuotes(quotes.map(quote =>
      quote.id === quoteId ? { ...quote, status: 'accepte' } : quote
    ));
  };


  // Modifier cette fonction
  const fetchClients = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/clients/noms');
      const data = await response.json();
      // Puisque l'API retourne directement le tableau, pas besoin de data.data
      setClients(data);
      setFilteredClients(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des clients:', error);
      setClients([]); // En cas d'erreur, initialiser avec un tableau vide
      setFilteredClients([]);
    }
  };



  const loadVehiculesByClient = async (clientId) => {
    if (!clientId) {
      setVehicules([]);
      return;
    }

    setLoadingVehicules(true);
    try {
      const response = await fetch(`http://localhost:5000/api/vehicules/proprietaire/${clientId}`);

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const vehiculesData = await response.json();
      setVehicules(vehiculesData);

      console.log(`✅ ${vehiculesData.length} véhicules chargés pour le client`);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des véhicules:', error);
      setVehicules([]);
      // Optionnel: afficher une notification d'erreur à l'utilisateur
    } finally {
      setLoadingVehicules(false);
    }
  };

  const loadPieces = async () => {
    setLoadingPieces(true);
    try {
      const response = await fetch('http://localhost:5000/api/pieces');

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const piecesData = await response.json();
      setPieces(piecesData);

      console.log(`✅ ${piecesData.length} pièces chargées`);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des pièces:', error);
      setPieces([]);
      // Optionnel: afficher une notification d'erreur
    } finally {
      setLoadingPieces(false);
    }
  };


  const handleClientChange = async (e: { target: { value: any; }; }) => {
    const clientId = e.target.value;
    const selectedClient = clients.find(c => c._id === clientId);

    setSelectedClientId(clientId);
    setNewQuote({
      ...newQuote,
      clientName: selectedClient ? selectedClient.nom : '',
      vehicleInfo: '' // Reset véhicule quand on change de client
    });

    // Charger les véhicules pour ce client
    await loadVehiculesByClient(clientId);
  };

  // Fonction pour mettre à jour un service
  const updateService = (index, field, value) => {
    const updatedServices = [...newQuote.services];
    updatedServices[index] = {
      ...updatedServices[index],
      [field]: value
    };

    setNewQuote({
      ...newQuote,
      services: updatedServices
    });
  };

  // Fonction spéciale pour gérer le changement de pièce
  const handlePieceChange = (index, pieceId) => {
    const selectedPiece = pieces.find(p => p._id === pieceId);

    const updatedServices = [...newQuote.services];
    updatedServices[index] = {
      ...updatedServices[index],
      pieceId: pieceId,
      piece: selectedPiece ? selectedPiece.name : '',
      unitPrice: selectedPiece ? selectedPiece.prix : 0
    };

    setNewQuote({
      ...newQuote,
      services: updatedServices
    });
  };

  // Fonction pour supprimer un service
  const removeService = (index) => {
    const updatedServices = newQuote.services.filter((_, i) => i !== index);
    setNewQuote({
      ...newQuote,
      services: updatedServices
    });
  };

  // Fonction pour ajouter un nouveau service
  const addService = () => {
    setNewQuote({
      ...newQuote,
      services: [
        ...newQuote.services,
        {
          pieceId: '',
          piece: '',
          quantity: 1,
          unitPrice: 0
        }
      ]
    });
  };


  const createNewPiece = async () => {
    try {
      if (!newPiece.name.trim()) {
        showError('Le nom de la pièce est obligatoire');
        return;
      }

      if (newPiece.prix < 0) {
        showError('Le prix ne peut pas être négatif');
        return;
      }

      const response = await axios.post('http://localhost:5000/api/pieces', newPiece);
      const createdPiece = response.data;

      // Ajouter la nouvelle pièce à la liste
      setPieces([...pieces, createdPiece]);

      // Sélectionner automatiquement la nouvelle pièce dans le service
      if (currentServiceIndex !== null) {
        handlePieceChange(currentServiceIndex, createdPiece._id);
      }

      // Reset et fermer le modal
      setNewPiece({ name: '', prix: 0, description: '' });
      setShowAddPieceModal(false);
      setCurrentServiceIndex(null);

      showSuccess('Pièce créée avec succès !');

    } catch (error) {
      console.error('Erreur lors de la création de la pièce:', error);
      showError(error.response?.data?.message || 'Erreur lors de la création de la pièce');
    }
  };

  const devisApi = {
    create: async (devisData) => {
      try {
        const response = await axios.post("http://localhost:5000/api/createdevis", devisData);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || "Erreur lors de la création du devis");
      }
    },

    getAll: async (filters = {}) => {
      try {
        const response = await axios.get("http://localhost:5000/api/Devis", { params: filters });
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || "Erreur lors de la récupération des devis");
      }
    },

    updateStatus: async (devisId, status) => {
      try {
        const response = await axios.put(`http://localhost:5000/api/Devis/${devisId}/status`, { status });
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || "Erreur lors du changement de statut");
      }
    },

    delete: async (devisId) => {
      try {
        const response = await axios.delete(`http://localhost:5000/api/Devis/${devisId}`);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || "Erreur lors de la suppression");
      }
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
  // 4. Ajouter cette fonction pour charger les devis depuis l'API
  const loadDevis = async () => {
    try {
      setLoading(true);
      const response = await devisApi.getAll(filters);
      setQuotes(response.data || []);
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendDevisByEmail = async (devisId) => {
    try {
      setLoading(true);

      const response = await axios.post(`http://localhost:5000/api/devis/${devisId}/send-email`);

      if (response.data.success) {
        showSuccess(`Devis envoyé par email avec succès`);

        // Mettre à jour le statut localement
        setQuotes(quotes.map(quote =>
          quote.id === devisId ? { ...quote, status: 'envoye' } : quote
        ));
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };






  // Ajouter après les autres useState
  useEffect(() => {
    fetchClients();
    loadPieces();
    loadDevis();

  }, []);

  const openAddPieceModal = (serviceIndex) => {
    setCurrentServiceIndex(serviceIndex);
    setShowAddPieceModal(true);
  };



  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Devis</h1>
          <p className="text-gray-600">Système de devis pour atelier mécanique</p>
        </div>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('list')}
                className={`py-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'list'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                Liste des Devis
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`py-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'create'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                Nouveau Devis
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'list' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Tous</option>
                    <option>Brouillon</option>
                    <option>Envoyé</option>
                    <option>Accepté</option>
                    <option>Refusé</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
                  <input
                    type="text"
                    placeholder="Nom du client..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date début</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date fin</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span flex items-end">
                  <button
                    onClick={loadDevis}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    disabled={loading}
                  >
                    {loading ? 'Chargement...' : 'Filtrer'}
                  </button>
                </div>
              </div>
            </div>

            {/* Quotes List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Devis Récents</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Devis
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Véhicule
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total TTC
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
                    {quotes.map((quote) => {
                      // Normaliser le status pour qu'il corresponde aux clés de statusIcons
                      const normalizedStatus = quote.status?.toLowerCase() || 'brouillon';
                      const StatusIcon = statusIcons[normalizedStatus] || FileText;
                      const statusColor = statusColors[normalizedStatus] || statusColors.brouillon;
                      return (
                        <tr key={quote.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {quote.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <User className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900">{quote.clientName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Car className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900">{quote.vehicleInfo}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900">{quote.inspectionDate}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">
                              {quote.totalTTC?.toFixed(3) || '0.000'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {quote.status?.charAt(0).toUpperCase() + quote.status?.slice(1) || 'Brouillon'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => setSelectedQuote(quote)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="text-green-600 hover:text-green-900">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            {quote.status === 'brouillon' && (
                              <button
                                onClick={() => sendDevisByEmail(quote.id)} // ✅ Nouvelle fonction
                                className="text-indigo-600 hover:text-indigo-900"
                                disabled={loading}
                              >
                                <Send className="h-4 w-4" />
                              </button>
                            )}
                            {quote.status === 'envoye' && (
                              <button
                                onClick={() => changeQuoteStatus(quote.id, 'accepte')}
                                className="text-green-600 hover:text-green-900"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteQuote(quote.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Créer un Nouveau Devis</h2>

            {/* Client Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du Client *
                </label>
                <select
                  value={selectedClientId}
                  onChange={handleClientChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Sélectionner un client --</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.nom} ({client.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sélecteur de véhicule */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Véhicule *
                </label>
                <select
                  value={newQuote.vehicleInfo}
                  onChange={(e) => setNewQuote({ ...newQuote, vehicleInfo: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!selectedClientId || loadingVehicules}
                >
                  <option value="">
                    {!selectedClientId
                      ? "Sélectionnez d'abord un client"
                      : loadingVehicules
                        ? "Chargement des véhicules..."
                        : vehicules.length === 0
                          ? "Aucun véhicule trouvé"
                          : "-- Sélectionner un véhicule --"
                    }
                  </option>
                  {vehicules.map((vehicule) => (
                    <option
                      key={vehicule._id}
                      value={`${vehicule.marque} ${vehicule.modele} - ${vehicule.immatriculation}`}
                    >
                      {vehicule.marque} {vehicule.modele} - {vehicule.immatriculation} ({vehicule.annee})
                    </option>
                  ))}
                </select>

                {/* Indicateur de chargement optionnel */}
                {loadingVehicules && (
                  <div className="mt-1 text-sm text-blue-600 flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Chargement des véhicules...
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date d'Inspection *
                </label>
                <input
                  type="date"
                  value={newQuote.inspectionDate}
                  onChange={(e) =>
                    setNewQuote({ ...newQuote, inspectionDate: e.target.value })
                  }
                  min={new Date().toISOString().split("T")[0]} // ✅ interdit les dates avant aujourd'hui
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taux TVA (%) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={tvaRate}
                  onChange={(e) => setTvaRate(parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="20"
                />
                <div className="mt-1 text-xs text-gray-500">
                  Taux de TVA applicable
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Main D’œuvre
                </label>
                <input
                  type="number"
                  value={maindoeuvre}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => setMaindoeuvre(parseFloat(e.target.value) || 0)}
                />

              </div>

            </div>

            {/* Services */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Services et Réparations</h3>
                <button
                  onClick={addService}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Ajouter piéce</span>
                </button>

              </div>

              <div className="space-y-4">
                {newQuote.services.map((service, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                    {/* Bouton de suppression - visible seulement s'il y a plus d'un service */}
                    {newQuote.services.length > 1 && (
                      <button
                        onClick={() => removeService(index)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-1 transition-colors"
                        title="Supprimer cette ligne"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Sélecteur de pièce */}

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pièce *
                        </label>
                        <div className="flex space-x-2">
                          <select
                            value={service.pieceId}
                            onChange={(e) => handlePieceChange(index, e.target.value)}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={loadingPieces}
                          >
                            <option value="">
                              {loadingPieces ? "Chargement des pièces..." : "-- Sélectionner une pièce --"}
                            </option>
                            {pieces.map((piece) => (
                              <option key={piece._id} value={piece._id}>
                                {piece.name}
                              </option>
                            ))}
                          </select>

                          {/* Bouton pour ajouter une nouvelle pièce */}
                          <button
                            type="button"
                            onClick={() => openAddPieceModal(index)}
                            className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
                            title="Ajouter une nouvelle pièce"
                          >
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">Nouvelle</span>
                          </button>
                        </div>

                        {/* Indicateur de chargement pour les pièces */}
                        {loadingPieces && (
                          <div className="mt-1 text-sm text-blue-600 flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Chargement...
                          </div>
                        )}
                      </div>

                      {/* Modal pour ajouter une nouvelle pièce */}
                      {showAddPieceModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                          <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
                            <div className="p-6 border-b border-gray-200">
                              <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium text-gray-900">Ajouter une nouvelle pièce</h3>
                                <button
                                  onClick={() => {
                                    setShowAddPieceModal(false);
                                    setCurrentServiceIndex(null);
                                    setNewPiece({ name: '', prix: 0, description: '' });
                                  }}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              </div>
                            </div>

                            <div className="p-6 space-y-4">
                              {/* Nom de la pièce */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Nom de la pièce *
                                </label>
                                <input
                                  type="text"
                                  value={newPiece.name}
                                  onChange={(e) => setNewPiece({ ...newPiece, name: e.target.value })}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Ex: Filtre à huile, Plaquette de frein..."
                                />
                              </div>

                              {/* Prix */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Prix (Dinnar) *
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={newPiece.prix}
                                  onChange={(e) => setNewPiece({ ...newPiece, prix: parseFloat(e.target.value) || 0 })}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>

                            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                              <button
                                onClick={() => {
                                  setShowAddPieceModal(false);
                                  setCurrentServiceIndex(null);
                                  setNewPiece({ name: '', prix: 0, description: '' });
                                }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                Annuler
                              </button>
                              <button
                                onClick={createNewPiece}
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                              >
                                <Plus className="h-4 w-4" />
                                <span>Créer la pièce</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Quantité */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantité *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={service.quantity}
                          onChange={(e) => updateService(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Prix unitaire (automatique mais modifiable) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prix une seul pièce (Dinnar)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={service.unitPrice}
                          onChange={(e) => updateService(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                          placeholder="Sélectionnez une pièce"
                        />
                        <div className="mt-1 text-xs text-gray-500">
                          Prix automatique, modifiable
                        </div>
                      </div>
                    </div>

                    {/* Affichage du total pour cette ligne */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total cette ligne :</span>
                        <span className="text-sm font-medium text-gray-900">
                          {(service.quantity * service.unitPrice).toFixed(2)} Dinnar
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Récapitulatif</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total pièces HT:</span>
                  <span className="font-medium">{newQuote.services.reduce((sum, service) => sum + (service.quantity * service.unitPrice), 0).toFixed(3)} Dinnar</span>
                </div>
                <div className="flex justify-between">
                  <span>Main d'œuvre:</span>
                  <span className="font-medium">{(maindoeuvre || 0).toFixed(3)} Dinnar</span>
                </div>
                <div className="flex justify-between">
                  <span>Total HT:</span>
                  <span className="font-medium">{calculateTotal(newQuote.services, maindoeuvre).totalHT.toFixed(3)} Dinnar</span>
                </div>

                <div className="flex justify-between">
                  <span>TVA ({tvaRate}%):</span> {/* ✅ Affiche le taux dynamique */}
                  <span className="font-medium">{(calculateTotal(newQuote.services, maindoeuvre).totalTTC - calculateTotal(newQuote.services, maindoeuvre).totalHT).toFixed(2)} Dinnar</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total TTC:</span>
                  <span>{calculateTotal(newQuote.services, maindoeuvre).totalTTC.toFixed(2)} Dinnar</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-4">
              <button
                onClick={saveQuote}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                <span>{loading ? 'Enregistrement...' : 'Enregistrer le Devis'}</span>
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Quote Detail Modal */}
        {selectedQuote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full m-4 max-h-screen overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Devis {selectedQuote.id}</h2>
                  <button
                    onClick={() => setSelectedQuote(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Informations Client</h3>
                    <p className="text-gray-600">Nom: {selectedQuote.clientName}</p>
                    <p className="text-gray-600">Véhicule: {selectedQuote.vehicleInfo}</p>
                    <p className="text-gray-600">Date d'inspection: {selectedQuote.inspectionDate}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Statut</h3>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[selectedQuote.status]}`}>
                      {selectedQuote.status.charAt(0).toUpperCase() + selectedQuote.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-4">Détail des Services</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Piéce</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qté</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Prix Unit.</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedQuote.services.map((service, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">{service.piece}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{service.quantity}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{service.unitPrice.toFixed(3)} Dinnar</td>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">{service.total.toFixed(3)} Dinnar</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="space-y-2">
                    {/* Détail des composants */}
                    <div className="flex justify-between text-gray-600">
                      <span>Total pièces HT:</span>
                      <span>{((selectedQuote.totalHT || 0) - (selectedQuote.maindoeuvre || 0)).toFixed(2)} Dinnar</span>
                    </div>

                    <div className="flex justify-between text-gray-600">
                      <span>Main d'œuvre:</span>
                      <span>{(selectedQuote.maindoeuvre || 0).toFixed(2)} Dinnar</span>
                    </div>

                    {/* Sous-total */}
                    <div className="flex justify-between font-medium border-t pt-2">
                      <span>Total HT:</span>
                      <span>{selectedQuote.totalHT.toFixed(2)} Dinnar</span>
                    </div>

                    {/* TVA */}
                    <div className="flex justify-between text-blue-600">
                      <span>TVA ({selectedQuote.tvaRate || 20}%):</span>
                      <span>{(selectedQuote.totalTTC - selectedQuote.totalHT).toFixed(2)} Dinnar</span>
                    </div>

                    {/* Total final */}
                    <div className="flex justify-between text-lg font-bold border-t pt-2 text-green-700">
                      <span>Total TTC:</span>
                      <span>{selectedQuote.totalTTC.toFixed(2)} Dinnar</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  {selectedQuote.status === 'brouillon' && (
                    <button
                      onClick={() => {
                        sendQuote(selectedQuote.id);
                        setSelectedQuote({ ...selectedQuote, status: 'envoye' });
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Send className="h-4 w-4" />
                      <span>Envoyer au Client</span>
                    </button>
                  )}
                  {selectedQuote.status === 'envoye' && (
                    <button
                      onClick={() => {
                        acceptQuote(selectedQuote.id);
                        setSelectedQuote({ ...selectedQuote, status: 'accepte' });
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <Check className="h-4 w-4" />
                      <span>Marquer comme Accepté</span>
                    </button>
                  )}
                  <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                    Imprimer PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GarageQuoteSystem;