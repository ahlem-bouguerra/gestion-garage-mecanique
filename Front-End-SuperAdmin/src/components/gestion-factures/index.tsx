"use client"
import React, { useState, useEffect } from 'react';
import { Search, Filter, FileText, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import { getAllGarages, getFacturesByGarage, getStatsByGarage,getFacturesDetails ,payFacture} from './api/facturesApi';

export interface Garage {
  _id: string;
  nom: string;
  matriculeFiscal: string;
  phone?: string;
  email?: string;
  address?: string;
  garagisteAdmins?: any[];
  createdAt?: string;
}

interface Facture {
  _id: string;
  numeroFacture: number;
  clientInfo: {
    nom: string;
    email: string;
    telephone: string;
  };
  vehicleInfo: string;
  finalTotalTTC: number;
  paymentStatus: string;
  invoiceDate: string;
  dueDate: string;
  paymentAmount?: number;
  creditNoteId?: string;
}

interface Stats {
  totalFactures: number;
  finalTotalTTC: number;
  totalEncaisse: number;
  totalImpaye: number;
  facturesPayees: number;
  facturesEnRetard: number;
  // ... autres stats
}

const GestionFacturesSuperAdmin = () => {
  // 🏢 États pour les garages
  const [garages, setGarages] = useState<Garage[]>([]);
  const [selectedGarageId, setSelectedGarageId] = useState<string>('');
  const [loadingGarages, setLoadingGarages] = useState(true);

  // 📄 États pour les factures
  const [factures, setFactures] = useState<Facture[]>([]);
  const [filteredFactures, setFilteredFactures] = useState<Facture[]>([]);
  const [loadingFactures, setLoadingFactures] = useState(false);

  // 📊 États pour les stats
  const [stats, setStats] = useState<Stats | null>(null);

  // 🔍 États pour les filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('tous');

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
const [factureDetails, setFactureDetails] = useState(null);


  useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;

    if (factureDetails || selectedFacture ) {
      header.classList.add("hidden");
    } else {
      header.classList.remove("hidden");
    }
  }, [factureDetails, selectedFacture]);

  // 1️⃣ Charger tous les garages au montage du composant
  useEffect(() => {
    const fetchGarages = async () => {
      try {
        setLoadingGarages(true);
        console.log("🚀 Début fetch garages...");

        const data = await getAllGarages();

        console.log('✅ Garages reçus:', data);
        console.log('✅ Type:', typeof data, 'Length:', data?.length);

        setGarages(data);
      } catch (error) {
        console.error('❌ Erreur complète:', error);
        console.error('❌ Response:', error.response?.data);
        console.error('❌ Status:', error.response?.status);
        alert(`Erreur: ${error.response?.data?.message || error.message}`);
      } finally {
        setLoadingGarages(false);
      }
    };

    fetchGarages();
  }, []);

  // 2️⃣ Charger factures et stats quand un garage est sélectionné
  useEffect(() => {
    if (!selectedGarageId) {
      // Réinitialiser si aucun garage sélectionné
      setFactures([]);
      setFilteredFactures([]);
      setStats(null);
      return;
    }

    const fetchFacturesAndStats = async () => {
      try {
        setLoadingFactures(true);

        // Appels parallèles pour optimiser
        const [facturesData, statsData] = await Promise.all([
          getFacturesByGarage(selectedGarageId),
          getStatsByGarage(selectedGarageId)
        ]);

        console.log('✅ Factures chargées:', facturesData);
        console.log('✅ Stats chargées:', statsData);

        setFactures(facturesData.data);
        setFilteredFactures(facturesData.data);
        setStats(statsData.data);

      } catch (error) {
        console.error('❌ Erreur chargement factures/stats:', error);
        alert('Erreur lors du chargement des données du garage');
      } finally {
        setLoadingFactures(false);
      }
    };

    fetchFacturesAndStats();
  }, [selectedGarageId]); // 👈 Se déclenche à chaque changement de garage

  // 3️⃣ Gérer les filtres (recherche et statut)
  useEffect(() => {
    let filtered = factures;

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(facture =>
        facture.clientInfo.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        facture.vehicleInfo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        facture.numeroFacture.toString().includes(searchTerm)
      );
    }

    // Filtre par statut
    if (statusFilter !== 'tous') {
      filtered = filtered.filter(facture => facture.paymentStatus === statusFilter);
    }

    setFilteredFactures(filtered);
  }, [searchTerm, statusFilter, factures]);

  // 🎨 Fonction pour formater la devise
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(amount);
  };

  // 🎨 Fonction pour formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // 🏷️ Fonction pour les badges de statut
  const getStatusBadge = (status: string) => {
    const styles = {
      'paye': 'bg-green-100 text-green-800 border border-green-200',
      'en_attente': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      'en_retard': 'bg-red-100 text-red-800 border border-red-200 animate-pulse',
      'partiellement_paye': 'bg-blue-100 text-blue-800 border border-blue-200',
      'annule': 'bg-gray-200 text-gray-800 border border-gray-300',
    };

    const labels = {
      'paye': '✅ Payée',
      'en_attente': '⏳ En attente',
      'en_retard': '🚨 En retard',
      'partiellement_paye': '💰 Partielle',
      'annule': '❌ Annulée',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

const fetchFactureDetails = async (factureId: string) => {
  try {
    setLoadingDetails(true);
    console.log("📄 Chargement détails facture :", factureId);

    // On utilise directement selectedGarageId
    if (!selectedGarageId) {
      alert("Veuillez sélectionner un garage !");
      return;
    }

    const response = await getFacturesDetails(factureId, selectedGarageId);

    if (response?.success) {
      setFactureDetails(response.data);
      setShowDetailsModal(true);
    } else {
      console.error("❌ Erreur:", response);
    }

  } catch (error: any) {
    console.error("❌ Erreur chargement facture:", error);
    alert(error.response?.data?.message || "Erreur lors du chargement des détails");
  } finally {
    setLoadingDetails(false);
  }
};


const handlePayment = async (factureId: string, paymentData: any) => {
  try {
    if (!selectedGarageId) {
      alert('❌ Veuillez sélectionner un garage.');
      return;
    }

    // ✅ Ajouter garageId ici avant d’appeler payFacture
    const paymentDataWithGarage = {
      ...paymentData,
      garageId: selectedGarageId
    };

    const data = await payFacture(factureId, paymentDataWithGarage);

    if (data.success) {
      alert('✅ Paiement enregistré avec succès !');
      setShowPaymentModal(false);
    } else {
      alert('❌ Erreur: ' + data.message);
    }

  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Erreur serveur';
    alert('❌ Erreur lors du paiement: ' + errorMessage);
  }
};




  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestion des Factures - Super Admin
        </h1>
        <p className="text-gray-600">
          Sélectionnez un garage pour voir ses factures
        </p>
      </div>

      {/* 🏢 Sélecteur de Garage */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sélectionner un garage
        </label>
        <select
          value={selectedGarageId}
          onChange={(e) => setSelectedGarageId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">-- Choisir un garage --</option>
          {garages.map((garage) => (
            <option key={garage._id} value={garage._id}>
              {garage.nom}
            </option>
          ))}
        </select>
      </div>

      {/* 📭 Message si aucun garage sélectionné */}
      {!selectedGarageId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-blue-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun garage sélectionné
          </h3>
          <p className="text-gray-600">
            Veuillez sélectionner un garage pour voir ses factures et statistiques
          </p>
        </div>
      )}

      {/* ⏳ Loading des factures */}
      {loadingFactures && (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Chargement des factures...</div>
        </div>
      )}

      {/* 📊 Contenu principal (stats + factures) */}
      {selectedGarageId && !loadingFactures && stats && (
        <>

          {/* Filtres et recherche */}
          <div className="bg-white rounded-lg shadow mb-6">
            

            {/* Tableau des factures */}
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Factures</h1>
              <p className="text-gray-600">Gérez vos factures et suivez les paiements</p>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Factures</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalFactures}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Chiffre d'Affaires</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.finalTotalTTC)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Encaissé</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalEncaisse)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">En Attente</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalImpaye)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">En Retard</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.facturesEnRetard}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filtres et Actions */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Recherche */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Rechercher par client, immatriculation ou numéro..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Filtre par statut */}
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <select
                      className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="tous">Tous les statuts</option>
                      <option value="en_attente">En attente</option>
                      <option value="partiellement_paye">Partiellement payées</option>
                      <option value="paye">Payées</option>
                      <option value="en_retard">En retard</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Liste des factures */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        N° Facture
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Véhicule
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Crédit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date d'échéance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avoir
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredFactures.map((facture) => (

                      <tr
                        key={facture._id}
                        className={`hover:bg-gray-50 ${facture.paymentStatus === 'en_retard'
                          ? 'bg-red-50 border-l-4 border-red-500'
                          : ''
                          }`}
                      >

                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {facture.numeroFacture.toString().padStart(4, '0')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{facture.clientInfo.nom}</div>

                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">
                              {facture.vehicleInfo}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(facture.finalTotalTTC)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="space-y-1">
                            {facture.paymentAmount > 0 && (
                              <p className="text-xs text-blue-600">
                                Payé: {formatCurrency(facture.paymentAmount)}
                              </p>
                            )}
                            {facture.paymentStatus === 'partiellement_paye' && (
                              <div>
                                <p className="text-xs text-red-600 font-medium">
                                  Reste: {formatCurrency(facture.finalTotalTTC - (facture.paymentAmount || 0))}
                                </p>
                              </div>
                            )}
                            {facture.paymentStatus === 'en_retard' && (
                              <div>
                                <p className="text-xs text-red-700 font-bold">
                                  ⚠️ RETARD
                                </p>
                                {facture.paymentAmount > 0 ? (
                                  <p className="text-xs text-red-600">
                                    Reste: {formatCurrency(facture.finalTotalTTC - (facture.paymentAmount || 0))}
                                  </p>
                                ) : (
                                  <p className="text-xs text-red-600">
                                    Non payé
                                  </p>
                                )}
                              </div>
                            )}
                            {facture.paymentStatus === 'en_attente' && (
                              <p className="text-xs text-gray-500">
                                Aucun paiement
                              </p>
                            )}
                            {facture.paymentStatus === 'paye' && (
                              <p className="text-xs text-green-600 font-medium">
                                ✅ Soldé
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(facture.dueDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(facture.paymentStatus)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {facture.creditNoteId ? (
                            <button
                              onClick={() => fetchCreditNoteDetails(facture.creditNoteId)}
                              className="text-red-600 hover:text-red-800 underline text-xs"
                            >
                              📄 Voir avoir
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">

                            <button
                              onClick={() => fetchFactureDetails(facture._id)}
                              disabled={loadingDetails || facture.paymentStatus === "annule"}
                              className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {loadingDetails ? "Chargement..." : "Voir"}
                            </button>



                            {facture.paymentStatus !== 'paye' && (
                              <button
                                onClick={() => {
                                  setSelectedFacture(facture);
                                  setShowPaymentModal(true);
                                }}
                                disabled={facture.paymentStatus === 'annule'}
                                className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Payer
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredFactures.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune facture</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || statusFilter !== 'tous'
                      ? 'Aucune facture ne correspond à vos critères de recherche.'
                      : 'Commencez par créer une facture à partir d\'un ordre terminé.'
                    }
                  </p>
                </div>
              )}
            </div>

            
          </div>
        </>
      )}
       {showDetailsModal && factureDetails && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-5 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            {/* Header avec boutons d'action */}
            <div className="flex justify-between items-center mb-6 no-print">
              <h3 className="text-xl font-bold text-gray-900">
                Facture N° {factureDetails.numeroFacture.toString().padStart(4, '0')}
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

            </div>

            {/* Contenu de la facture */}
            <div className="invoice-content bg-white" id="invoice-print">
              {/* En-tête de l'entreprise */}
              <div className="border-b-2 border-gray-200 pb-6 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-bold text-blue-600">
                      {factureDetails.garageId?.nom || "Nom du garage"}
                    </h1>
                    <div className="mt-2 text-gray-600">
                      <p>{factureDetails.garageId?.nom}-{factureDetails.garageId?.cityName}-{factureDetails.garageId?.streetAddress || "Adresse non renseignée"}</p>
                      <p>Tél: {factureDetails.garageId?.telephoneProfessionnel || "Non renseigné"}</p>
                      <p>Email: {factureDetails.garageId?.emailProfessionnel || "Non renseigné"}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <h2 className="text-2xl font-bold text-gray-800">FACTURE</h2>
                    <div className="mt-2 text-gray-600">
                      <p><span className="font-medium">N°:</span> {factureDetails.numeroFacture.toString().padStart(4, '0')}</p>
                      <p><span className="font-medium">Date:</span> {formatDate(factureDetails.invoiceDate)}</p>
                      <p><span className="font-medium">Échéance:</span> {formatDate(factureDetails.dueDate)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations client et véhicule */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-1">
                    FACTURÉ À
                  </h3>
                  <div className="space-y-1 text-gray-700">
                    <p className="font-medium text-lg">{factureDetails.clientId?.nom || factureDetails.clientInfo.nom}</p>
                    {factureDetails.clientId?.adresse && (
                      <p>{factureDetails.clientId.adresse}</p>
                    )}
                    <p>Tél: {factureDetails.clientId?.telephone || factureDetails.clientInfo.telephone}</p>
                    <p>Email: {factureDetails.clientId?.email || factureDetails.clientInfo.email}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-1">
                    VÉHICULE
                  </h3>
                  <div className="space-y-1 text-gray-700">
                    <p className="font-medium">{factureDetails.vehicleInfo}</p>
                    {factureDetails.devisId && (
                      <p className="text-sm text-gray-500">Devis: {factureDetails.devisId.id}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Tableau des services */}
              {factureDetails.services && factureDetails.services.length > 0 && (
                <div className="mb-8">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-800">
                          DESCRIPTION
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-800">
                          QTÉ
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-gray-800">
                          PRIX UNITAIRE
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-gray-800">
                          TOTAL
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {factureDetails.services.map((service, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-300 px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900">{service.piece}</p>
                              {service && (
                                <p className="text-xs text-gray-500">{service.description}</p>
                              )}
                            </div>
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center text-gray-900">
                            {service.quantity}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-right text-gray-900">
                            {formatCurrency(service.unitPrice)}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-right font-medium text-gray-900">
                            {formatCurrency(service.total)}
                          </td>
                        </tr>
                      ))}

                      {/* Ligne main d'œuvre si présente */}
                      {factureDetails.maindoeuvre && factureDetails.maindoeuvre > 0 && (
                        <tr className="bg-blue-50">
                          <td className="border border-gray-300 px-4 py-3 font-medium text-gray-900">
                            Main d'œuvre
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center">1</td>
                          <td className="border border-gray-300 px-4 py-3 text-right">
                            {formatCurrency(factureDetails.maindoeuvre)}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-right font-medium">
                            {formatCurrency(factureDetails.maindoeuvre)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Totaux */}
              <div className="flex justify-end mb-8">
                <div className="w-100">
                  <table className="w-full">
                    <tbody>
                      {factureDetails.totalHT && (
                        <tr>
                          <td className="px-4 py-2 text-right font-medium text-gray-700 border-b border-gray-200">
                            TOTAL HT:
                          </td>
                          <td className="px-4 py-2 text-right text-gray-900 border-b border-gray-200">
                            {formatCurrency(factureDetails.totalHT)}
                          </td>
                        </tr>
                      )}
                      {factureDetails.totalTVA && (
                        <tr>
                          <td className="px-4 py-2 text-right font-medium text-gray-700 border-b border-gray-200">
                            TVA ({factureDetails.tvaRate || 20}%):
                          </td>
                          <td className="px-4 py-2 text-right text-gray-900 border-b border-gray-200">
                            {formatCurrency(factureDetails.totalTVA)}
                          </td>
                        </tr>
                      )}
                      {factureDetails.totalRemise !== undefined && factureDetails.totalRemise !== null && (
                        <tr>
                          <td className="px-4 py-2 text-right font-medium text-gray-700 border-b border-gray-200">
                            REMISE ({factureDetails.remiseRate || 0}%):
                          </td>
                          <td className="px-4 py-2 text-right text-gray-900 border-b border-gray-200">
                            -{formatCurrency(factureDetails.totalRemise)}
                          </td>
                        </tr>
                      )}
                      <tr className="bg-gray-100">
                        <td className="px-4 py-3 text-right text-lg font-bold text-gray-800">
                          TOTAL TTC:
                        </td>
                        <td className="px-4 py-3 text-right text-lg font-bold text-green-600">
                          {formatCurrency(factureDetails.totalTTC)}
                        </td>
                      </tr>
                      {factureDetails.timbreFiscal && factureDetails.timbreFiscal > 0 && (
                        <tr>
                          <td className="px-4 py-2 text-right font-medium text-gray-700 border-b border-gray-200">
                            Timbre fiscal:
                          </td>
                          <td className="px-4 py-2 text-right text-gray-900 border-b border-gray-200">
                            {formatCurrency(factureDetails.timbreFiscal)}
                          </td>
                        </tr>
                      )}
                      <tr className="bg-gray-100">
                        <td className="px-4 py-3 text-right text-lg font-bold text-gray-800">
                          TOTAL TTC avec remise :
                        </td>
                        <td className="px-4 py-3 text-right text-lg font-bold text-green-600">
                          {formatCurrency(factureDetails.finalTotalTTC)}
                        </td>
                      </tr>
                      {factureDetails.paymentAmount > 0 && (
                        <>
                          <tr>
                            <td className="px-4 py-2 text-right font-medium text-blue-700">
                              Payé:
                            </td>
                            <td className="px-4 py-2 text-right text-blue-700">
                              {formatCurrency(factureDetails.paymentAmount)}
                            </td>
                          </tr>
                          {factureDetails.paymentStatus !== 'paye' && (
                            <tr className="bg-yellow-50">
                              <td className="px-4 py-3 text-right font-bold text-red-700">
                                RESTE À PAYER:
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-red-700">
                                {formatCurrency(factureDetails.finalTotalTTC - factureDetails.paymentAmount)}
                              </td>
                            </tr>
                          )}
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Statut et notes */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-center items-start">
                  <div className="text-right text-xs text-gray-500">
                    <p>Merci pour votre confiance</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Boutons d'action en bas (non imprimables) */}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t no-print">
              {factureDetails.paymentStatus !== 'paye' && (
                <button
                  onClick={() => {
                    setSelectedFacture(factureDetails);
                    setShowDetailsModal(false);
                    setShowPaymentModal(true);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Enregistrer un paiement
                </button>
              )}
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Fermer
              </button>
              <div className="flex space-x-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Imprimer
                </button>


              </div>
            </div>

          </div>
        </div>
      )}
      {showPaymentModal && selectedFacture && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Enregistrer le paiement
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handlePayment(selectedFacture._id, {
                paymentAmount: formData.get('amount'),
                paymentMethod: formData.get('method'),
                paymentDate: formData.get('date'),
                reference: formData.get('reference')
              });
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant payé
                </label>
                {selectedFacture.paymentAmount > 0 && (
                  <p className="text-sm text-gray-600 mb-2">
                    Déjà payé: {formatCurrency(selectedFacture.paymentAmount)}
                  </p>
                )}
                <input
                  type="number"
                  name="amount"
                  step="0.001"
                  max={(selectedFacture.finalTotalTTC - (selectedFacture.paymentAmount || 0)).toFixed(3)}
                  defaultValue={(selectedFacture.finalTotalTTC - (selectedFacture.paymentAmount || 0)).toFixed(3)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Méthode de paiement
                </label>
                <select
                  name="method"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Sélectionner...</option>
                  <option value="especes">Espèces</option>
                  <option value="cheque">Chèque</option>
                  <option value="virement">Virement</option>
                  <option value="carte">Carte bancaire</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de paiement
                </label>
                <input
                  type="date"
                  name="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Référence (optionnel)
                </label>
                <input
                  type="text"
                  name="reference"
                  placeholder="N° chèque, référence virement..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Confirmer le paiement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    
  );
};

export default GestionFacturesSuperAdmin;