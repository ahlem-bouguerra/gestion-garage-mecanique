"use client"
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Eye, Send, Check, X, Car, User, Calendar, FileText, Euro, AlertCircle, Trash2 } from 'lucide-react';

import axios from 'axios';
import { redirect } from 'next/dist/server/api-utils';
import { useRouter } from 'next/navigation';



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
  const [editingQuote, setEditingQuote] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const router = useRouter();
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

  const generateInvoice = (quote) => {
    const invoice = {
      ...quote,
      invoiceNumber: `FAC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 jours
      type: 'facture'
    };

    setInvoiceData(invoice);
    setSelectedInvoice(invoice);
  };

  // Fonction pour imprimer/télécharger la facture (PDF)
  const printInvoice = () => {
  const content = document.getElementById("invoice-content"); // ton conteneur
  if (!content) return;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head>
        <title>Page 2</title>
        <style>
          /* styles d'impression spécifiques */
          body { font-family: Arial, sans-serif; }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
};






  // 🔧 2. FONCTION POUR GÉRER LES CHANGEMENTS DE FILTRES
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 🔧 3. FONCTION POUR RÉINITIALISER LES FILTRES
  const resetFilters = () => {
    setFilters({
      status: '',
      clientName: '',
      dateDebut: '',
      dateFin: ''
    });
    // Recharger tous les devis sans filtres
    loadDevis({});
  };

  // 🔧 4. FONCTION POUR APPLIQUER LES FILTRES
  const applyFilters = () => {
    // Construire l'objet de filtres pour l'API
    const apiFilters = {};

    if (filters.status && filters.status !== 'Tous') {
      apiFilters.status = filters.status.toLowerCase();
    }

    if (filters.clientName.trim()) {
      apiFilters.clientName = filters.clientName.trim();
    }

    if (filters.dateDebut) {
      apiFilters.dateDebut = filters.dateDebut;
    }

    if (filters.dateFin) {
      apiFilters.dateFin = filters.dateFin;
    }

    console.log('🔍 Filtres appliqués:', apiFilters);
    loadDevis(apiFilters);
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

  const loadDevis = async (filterParams = {}) => {
    try {
      setLoading(true);
      const response = await devisApi.getAll(filterParams);

      // Recalculer les totaux pour chaque devis
      const devisWithCalculatedTotals = (response.data || []).map(devis => {
        const servicesWithTotal = (devis.services || []).map(service => ({
          ...service,
          total: (service.quantity || 0) * (service.unitPrice || 0)
        }));

        const totalServicesHT = servicesWithTotal.reduce((sum, service) => {
          return sum + ((service.quantity || 0) * (service.unitPrice || 0));
        }, 0);

        const totalHT = totalServicesHT + (devis.maindoeuvre || 0);
        const totalTTC = totalHT * (1 + (devis.tvaRate || 20) / 100);

        return {
          ...devis,
          services: servicesWithTotal,
          totalHT: totalServicesHT,
          totalTTC: totalTTC
        };
      });

      setQuotes(devisWithCalculatedTotals);

      // Message informatif
      if (Object.keys(filterParams).length > 0) {
        showSuccess(`${devisWithCalculatedTotals.length} devis trouvé(s) avec les filtres appliqués`);
      }

    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveQuote = async () => {
    try {
      setLoading(true);

      // Validation (même code existant)
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
        maindoeuvre: maindoeuvre,
        // Si c'est une modification, remettre le statut à "brouillon"
        status: isEditMode ? 'brouillon' : undefined
      };

      if (isEditMode && editingQuote) {
        // Mode édition
        await devisApi.update(editingQuote.id, devisData);
        showSuccess('Devis modifié avec succès ! Statut remis à "brouillon".');
      } else {
        // Mode création
        await devisApi.create(devisData);
        showSuccess('Devis créé avec succès !');
      }

      // Reset du formulaire (même code existant)
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
      setEditingQuote(null);
      setIsEditMode(false);

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


  const sendDevisByEmail = async (devisId) => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token"); // ou Cookies.get("token")

      // 1. Envoyer l'email avec token dans headers
      const response = await axios.post(
        `http://localhost:5000/api/devis/${devisId}/send-email`,
        {}, // corps vide
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        // 2. Mettre à jour le statut
        await devisApi.updateStatus(devisId, 'envoye');

        showSuccess(`Devis envoyé par email avec succès`);

        // 3. Mettre à jour localement
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
    create: async (devisData, token) => {
      try {
        const response = await axios.post(
          "http://localhost:5000/api/createdevis",
          devisData,
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`, // ✅ IMPORTANT
            },
          }
        );
        console.log("TOKEN envoyé :", token);

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
    update: async (devisId, devisData) => {
      try {
        const response = await axios.put(`http://localhost:5000/api/Devis/${devisId}`, devisData);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || "Erreur lors de la mise à jour du devis");
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

  const startEditQuote = (quote) => {
    // Vérifier si le devis peut être modifié
    if (quote.status === 'accepte' || quote.status === 'refuse') {
      if (!confirm('Ce devis a déjà été accepté/refusé. Voulez-vous vraiment le modifier ? Il repassera en statut "brouillon".')) {
        return;
      }
    }

    setEditingQuote(quote);
    setIsEditMode(true);

    // Pré-remplir le formulaire avec les données existantes
    setNewQuote({
      clientName: quote.clientName,
      vehicleInfo: quote.vehicleInfo,
      inspectionDate: quote.inspectionDate,
      services: quote.services.map(service => ({
        pieceId: service.pieceId || '',
        piece: service.piece,
        quantity: service.quantity,
        unitPrice: service.unitPrice
      }))
    });

    setSelectedClientId(quote.clientId || '');
    setTvaRate(quote.tvaRate || 20);
    setMaindoeuvre(quote.maindoeuvre || 0);

    // Charger les véhicules du client
    if (quote.clientId) {
      loadVehiculesByClient(quote.clientId);
    }

    setActiveTab('create');
  };

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  const createWorkOrder = (quote) => {
  // Sauvegarder les données du devis pour la page ordre de travail
  localStorage.setItem('selectedQuoteForOrder', JSON.stringify(quote));
   router.push('/ordre-travail');

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
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Filtres de recherche</h3>
                <button
                  onClick={resetFilters}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Réinitialiser
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* FILTRE STATUT */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Tous</option>
                    <option value="brouillon">Brouillon</option>
                    <option value="envoye">Envoyé</option>
                    <option value="accepte">Accepté</option>
                    <option value="refuse">Refusé</option>
                  </select>
                </div>

                {/* FILTRE CLIENT */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client
                  </label>
                  <input
                    type="text"
                    value={filters.clientName}
                    onChange={(e) => handleFilterChange('clientName', e.target.value)}
                    placeholder="Nom du client..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        applyFilters();
                      }
                    }}
                  />
                </div>

                {/* FILTRE DATE DÉBUT */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date début
                  </label>
                  <input
                    type="date"
                    value={filters.dateDebut}
                    onChange={(e) => handleFilterChange('dateDebut', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* FILTRE DATE FIN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date fin
                  </label>
                  <input
                    type="date"
                    value={filters.dateFin}
                    onChange={(e) => handleFilterChange('dateFin', e.target.value)}
                    min={filters.dateDebut} // La date de fin ne peut pas être avant la date de début
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* BOUTONS D'ACTIONS */}
                <div className="flex items-end space-x-2">
                  <button
                    onClick={applyFilters}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                    disabled={loading}
                  >
                    {loading && (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    <span>{loading ? 'Filtrage...' : 'Filtrer'}</span>
                  </button>
                </div>
              </div>

              {/* INDICATEURS DE FILTRES ACTIFS */}
              {(filters.status || filters.clientName || filters.dateDebut || filters.dateFin) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-sm text-gray-600">Filtres actifs:</span>

                  {filters.status && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Statut: {filters.status}
                      <button
                        onClick={() => handleFilterChange('status', '')}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {filters.clientName && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Client: {filters.clientName}
                      <button
                        onClick={() => handleFilterChange('clientName', '')}
                        className="ml-1 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {filters.dateDebut && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Du: {filters.dateDebut}
                      <button
                        onClick={() => handleFilterChange('dateDebut', '')}
                        className="ml-1 text-purple-600 hover:text-purple-800"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {filters.dateFin && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Au: {filters.dateFin}
                      <button
                        onClick={() => handleFilterChange('dateFin', '')}
                        className="ml-1 text-orange-600 hover:text-orange-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              )}

              {/* RÉSUMÉ DES RÉSULTATS */}
              <div className="mt-4 text-sm text-gray-600">
                {quotes.length} devis affiché(s)
                {(filters.status || filters.clientName || filters.dateDebut || filters.dateFin) && (
                  <span> (filtré(s))</span>
                )}
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ordres
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
                              title="Voir détails"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => startEditQuote(quote)}
                              className="text-green-600 hover:text-green-900"
                              title="Modifier"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>

                            {/* Bouton Send - visible seulement pour les devis en brouillon */}
                            {quote.status === 'brouillon' && (
                              <button
                                onClick={() => sendDevisByEmail(quote.id)}
                                className="text-indigo-600 hover:text-indigo-900"
                                disabled={loading}
                                title="Envoyer par email"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                            )}

                            {/* NOUVEAU: Bouton Facture - visible seulement pour les devis acceptés */}
                            {quote.status === 'accepte' && (
                              <button
                                onClick={() => generateInvoice(quote)}
                                className="text-purple-600 hover:text-purple-900"
                                title="Générer facture"
                              >
                                <FileText className="h-4 w-4" />
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {quote.status === 'accepte' ? (
                              <button
                                onClick={() => createWorkOrder(quote)}
                                className="bg-orange-600 text-white px-3 py-1 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-1"
                                title="Créer ordre de travail"
                              >
                                <FileText className="h-4 w-4" />
                                <span className="hidden sm:inline">Ordre</span>
                              </button>
                            ) : (
                              <button
                                disabled
                                className="bg-gray-300 text-gray-500 px-3 py-1 rounded-lg cursor-not-allowed flex items-center space-x-1"
                                title="Devis doit être accepté"
                              >
                                <FileText className="h-4 w-4" />
                                <span className="hidden sm:inline">Ordre</span>
                              </button>
                            )}
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
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{isEditMode ? 'Modifier le Devis' : 'Créer un Nouveau Devis'}</h2>

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
                <span>
                  {loading
                    ? (isEditMode ? 'Modification...' : 'Enregistrement...')
                    : (isEditMode ? 'Modifier le Devis' : 'Enregistrer le Devis')
                  }
                </span>
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
                            <td className="px-4 py-2 text-sm text-gray-900">{(service.unitPrice || 0).toFixed(3)} Dinnar</td>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">
                              {((service.quantity || 0) * (service.unitPrice || 0)).toFixed(3)} Dinnar
                            </td>
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
                      <span>{((selectedQuote.totalHT || 0)).toFixed(3)} Dinnar</span>
                    </div>

                    <div className="flex justify-between text-gray-600">
                      <span>Main d'œuvre:</span>
                      <span>{(selectedQuote.maindoeuvre || 0).toFixed(3)} Dinnar</span>
                    </div>

                    {/* Sous-total */}
                    <div className="flex justify-between font-medium border-t pt-2">
                      <span>Total HT:</span>
                      <span>{((selectedQuote.totalHT || 0) + (selectedQuote.maindoeuvre || 0)).toFixed(3)} Dinnar</span>
                    </div>

                    {/* TVA */}
                    <div className="flex justify-between text-blue-600">
                      <span>TVA ({selectedQuote.tvaRate || 20}%):</span>
                      <span>
                        {(
                          ((selectedQuote.totalHT || 0) + (selectedQuote.maindoeuvre || 0)) *
                          ((selectedQuote.tvaRate || 20) / 100)
                        ).toFixed(3)} Dinnar
                      </span>
                    </div>

                    {/* Total final */}
                    <div className="flex justify-between text-lg font-bold border-t pt-2 text-green-700">
                      <span>Total TTC:</span>
                      <span>
                        {(
                          (selectedQuote.totalHT || 0) +
                          (selectedQuote.maindoeuvre || 0) +
                          ((selectedQuote.totalHT || 0) + (selectedQuote.maindoeuvre || 0)) *
                          ((selectedQuote.tvaRate || 20) / 100)
                        ).toFixed(3)} Dinnar
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button onClick={printInvoice} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                    Imprimer PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {selectedInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full m-4 max-h-screen overflow-y-auto">
             

              {/* Contenu de la facture - Format professionnel */}
              <div className="p-8 print:p-4" id="invoice-content">
                {/* Header de la facture */}
                <div className="flex justify-between items-start mb-8">
                  {/* Informations de l'entreprise */}
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-blue-600 mb-2">GARAGE AUTO</h1>
                    <div className="text-gray-600 space-y-1">
                      <p>123 Avenue de la Mécanique</p>
                      <p>1000 Tunis, Tunisie</p>
                      <p>Tél: +216 XX XXX XXX</p>
                      <p>Email: contact@garageauto.tn</p>
                      <p>Matricule Fiscal: XXXXXXXX</p>
                    </div>
                  </div>

                  {/* Logo et titre facture */}
                  <div className="text-right">
                    <div className="text-gray-600 space-y-1">
                      <p><strong>Date facture:</strong> {new Date(selectedInvoice.invoiceDate).toLocaleDateString('fr-FR')}</p>
                      <p><strong>Date d'échéance:</strong> {new Date(selectedInvoice.dueDate).toLocaleDateString('fr-FR')}</p>
                      <p><strong>Devis N°:</strong> {selectedInvoice.id}</p>
                    </div>
                  </div>
                </div>

                {/* Informations client */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">FACTURER À</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-semibold text-lg">{selectedInvoice.clientName}</p>
                    <p className="text-gray-600 mt-1">Véhicule: {selectedInvoice.vehicleInfo}</p>
                    <p className="text-gray-600">Date d'intervention: {new Date(selectedInvoice.inspectionDate).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>

                {/* Tableau des services */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">DÉTAIL DES PRESTATIONS</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Désignation</th>
                          <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Qté</th>
                          <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Prix Unit. HT</th>
                          <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Total HT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.services.map((service, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-3">{service.piece}</td>
                            <td className="border border-gray-300 px-4 py-3 text-center">{service.quantity}</td>
                            <td className="border border-gray-300 px-4 py-3 text-right">{(service.unitPrice || 0).toFixed(3)} DT</td>
                            <td className="border border-gray-300 px-4 py-3 text-right font-semibold">
                              {((service.quantity || 0) * (service.unitPrice || 0)).toFixed(3)} DT
                            </td>
                          </tr>
                        ))}

                        {/* Ligne main d'œuvre si présente */}
                        {selectedInvoice.maindoeuvre > 0 && (
                          <tr className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-3 font-medium">Main d'œuvre</td>
                            <td className="border border-gray-300 px-4 py-3 text-center">1</td>
                            <td className="border border-gray-300 px-4 py-3 text-right">{(selectedInvoice.maindoeuvre || 0).toFixed(3)} DT</td>
                            <td className="border border-gray-300 px-4 py-3 text-right font-semibold">
                              {(selectedInvoice.maindoeuvre || 0).toFixed(3)} DT
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totaux */}
                <div className="flex justify-end mb-8">
                  <div className="w-80">
                    <div className="bg-gray-50 p-6 rounded-lg space-y-3">
                      <div className="flex justify-between text-gray-700">
                        <span>Total HT:</span>
                        <span className="font-semibold">
                          {((selectedInvoice.totalHT || 0) + (selectedInvoice.maindoeuvre || 0)).toFixed(3)} DT
                        </span>
                      </div>

                      <div className="flex justify-between text-gray-700">
                        <span>TVA ({selectedInvoice.tvaRate || 20}%):</span>
                        <span className="font-semibold">
                          {(
                            ((selectedInvoice.totalHT || 0) + (selectedInvoice.maindoeuvre || 0)) *
                            ((selectedInvoice.tvaRate || 20) / 100)
                          ).toFixed(3)} DT
                        </span>
                      </div>

                      <div className="border-t border-gray-300 pt-3">
                        <div className="flex justify-between text-xl font-bold text-green-700">
                          <span>Total TTC:</span>
                          <span>
                            {(
                              (selectedInvoice.totalHT || 0) +
                              (selectedInvoice.maindoeuvre || 0) +
                              ((selectedInvoice.totalHT || 0) + (selectedInvoice.maindoeuvre || 0)) *
                              ((selectedInvoice.tvaRate || 20) / 100)
                            ).toFixed(3)} DT
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conditions de paiement */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">CONDITIONS DE PAIEMENT</h3>
                  <div className="bg-yellow-50 p-4 rounded-lg text-sm text-gray-700 space-y-1">
                    <p>• Paiement à 30 jours à compter de la date de facture</p>
                    <p>• En cas de retard de paiement, des pénalités de 3% par mois seront appliquées</p>
                    <p>• Aucun escompte accordé pour paiement anticipé</p>
                    <p>• Règlement par chèque, virement ou espèces</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center text-gray-500 text-sm border-t pt-4">
                  <p>GARAGE AUTO</p>
                 
                </div>
              </div>

              {/* Actions - Masquées lors de l'impression */}
              <div className="p-6 border-t border-gray-200 flex space-x-4 no-print">
                <button
                  onClick={printInvoice}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>Imprimer / PDF</span>
                </button>


                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GarageQuoteSystem;