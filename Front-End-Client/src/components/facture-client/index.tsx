"use client"
import React, { useState, useEffect } from 'react';
import { Search, Filter, FileText, DollarSign, Clock, AlertTriangle, X, User, Calendar, Car, Download, CreditCard } from 'lucide-react';
import axios from 'axios';

interface GarageInfo {
  nom: string;
  emailProfessionnel: string;
  telephoneProfessionnel: string;
  governorateName: string;
  cityName: string;
  streetAddress: string;
}
interface CreditNoteDetails {
  _id: string;
  creditNumber: string;
  originalFactureNumber: number;
  creditDate: string;
  reason: string;
  clientInfo: {
    nom: string;
  };
  clientId: {
    nom: string;
    telephone: string;
    email: string;
  };
  vehicleInfo: string;
  services: Array<{
    piece: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  finalTotalTTC: number;
  totalTTC: number;
  totalHT: number;  
  totalTVA: number;
  tvaRate: number;
  totalRemise: number;
  remiseRate: number;
  maindoeuvre: number;
  timbreFiscal: number;
}

interface FactureDetails {
  _id: string;
  numeroFacture: number;
  garageId: GarageInfo;
  clientInfo: {
    nom: string;
  };
  realClientId: {
    username: string;
    email: string;
    phone: string;
  };
  vehicleInfo: string;
  finalTotalTTC: number;
  totalTTC: number;
  totalHT: number;
  totalTVA: number;
  totalRemise: number;
  tvaRate: number;
  remiseRate: number;
  timbreFiscal: number;
  paymentStatus: 'en_attente' | 'paye' | 'en_retard' | 'partiellement_paye' | 'annule';
  invoiceDate: string;
  dueDate: string;
  paymentAmount: number;
  services: Array<{
    name: string;
    description: string;
    piece: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  maindoeuvre: number;
  notes: string;
  creditNoteId: string;
  status: 'active' | 'cancelled';
}

interface Stats {
  totalFactures: number;
  finalTotalTTC: number;
  totalPaye: number;
  totalImpaye: number;
  facturesEnRetard: number;
}

const ClientFactures: React.FC = () => {
  const [factures, setFactures] = useState<FactureDetails[]>([]);
  const [filteredFactures, setFilteredFactures] = useState<FactureDetails[]>([]);
  const [loadingFactureId, setLoadingFactureId] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalFactures: 0,
    finalTotalTTC: 0,
    totalPaye: 0,
    totalImpaye: 0,
    facturesEnRetard: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('tous');
  const [selectedFacture, setSelectedFacture] = useState<FactureDetails | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [creditNoteDetails, setCreditNoteDetails] = useState(null);
  const [showCreditNoteModal, setShowCreditNoteModal] = useState(false);
  const itemsPerPage = 5;

  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  useEffect(() => {
    fetchFactures();
    fetchStats();
  }, []);

  useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;

    if (selectedFacture || showDetailsModal || creditNoteDetails) {
      header.classList.add("hidden");
    } else {
      header.classList.remove("hidden");
    }
  }, [selectedFacture, showDetailsModal, creditNoteDetails]);

  const fetchFactures = async () => {
    try {

      const token = getAuthToken();
      if (!token || token === 'null' || token === 'undefined') {
        window.location.href = '/auth/sign-in';
        return;
      }
      const response = await axios.get('http://localhost:5000/api/client/factures', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setFactures(response.data.data);
        setFilteredFactures(response.data.data);
      }
    } catch (error) {
      if (error.response?.status === 401) {
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          window.location.href = '/auth/sign-in';
          return;
        }
      console.error('Erreur lors de la récupération des factures:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFactureDetails = async (factureId: string) => {
    setLoadingFactureId(factureId);
    try {
       const token = getAuthToken();
      if (!token || token === 'null' || token === 'undefined') {
        window.location.href = '/auth/sign-in';
        return;
      }
      const response = await axios.get(`http://localhost:5000/api/client/factures/${factureId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = response.data;
      if (data.success) {
        setSelectedFacture(data.data);
        setShowDetailsModal(true);
      }
    } catch (error) {
      if (error.response?.status === 401) {
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          window.location.href = '/auth/sign-in';
          return;
        }
      console.error('Erreur lors de la récupération des détails:', error);
    } finally {
      setLoadingFactureId(null);

    }
  };

  const fetchCreditNoteDetails = async (creditNoteId: string) => {
    try {
       const token = getAuthToken();
      if (!token || token === 'null' || token === 'undefined') {
        window.location.href = '/auth/sign-in';
        return;
      }
      console.log('🚀 Appel API pour ID:', creditNoteId);
      console.log('🔑 Token:', getAuthToken());

      const response = await axios.get(`http://localhost:5000/api/client/credit-note/${creditNoteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = response.data;
      if (data.success) {
        setCreditNoteDetails(data.data);
        setShowCreditNoteModal(true);
      }
    } catch (error: any) {
      console.error('❌ Erreur détaillée:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        url: error.config?.url,
        data: error.response?.data
      });

      if (error.response?.status === 404) {
        alert('Avoir non trouvé ou vous n\'avez pas les droits d\'accès');
      } else if (error.response?.status === 401) {
        alert('❌ Session expirée. Veuillez vous reconnecter.');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        alert('Erreur lors de la récupération de l\'avoir');
      }
    }
  };

  const fetchStats = async () => {
    try {
       const token = getAuthToken();
      if (!token || token === 'null' || token === 'undefined') {
        window.location.href = '/auth/sign-in';
        return;
      }
      const response = await axios.get('http://localhost:5000/api/client/factures/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      if (error.response?.status === 401) {
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          window.location.href = '/auth/sign-in';
          return;
        }
      console.error('Erreur lors de la récupération des stats:', error);
    }
  };


  useEffect(() => {
    let filtered = factures;

    if (searchTerm) {
      filtered = filtered.filter(facture =>
        facture.numeroFacture.toString().includes(searchTerm) ||
        facture.vehicleInfo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        facture.garageId?.nom.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'tous') {
      filtered = filtered.filter(facture => facture.paymentStatus === statusFilter);
    }

    setFilteredFactures(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, factures]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

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

  const indexOfLastFacture = currentPage * itemsPerPage;
  const indexOfFirstFacture = indexOfLastFacture - itemsPerPage;
  const currentFactures = filteredFactures.slice(indexOfFirstFacture, indexOfLastFacture);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Factures</h1>
        <p className="text-gray-600">Consultez et payez vos factures</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
              <p className="text-sm font-medium text-gray-600">Total Payé</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalPaye)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">À Payer</p>
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

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Rechercher par numéro, véhicule ou garage..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

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
                  Garage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Véhicule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
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
              {currentFactures.map((facture) => (
                <tr
                  key={facture._id}
                  className={`hover:bg-gray-50 ${facture.status === 'cancelled'
                      ? 'bg-gray-100 opacity-70 cursor-not-allowed'
                      : facture.paymentStatus === 'en_retard'
                        ? 'bg-red-50 border-l-4 border-red-500'
                        : ''
                    }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {facture.numeroFacture.toString().padStart(4, '0')}
                    {facture.status === 'cancelled' && (
                      <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded border border-red-300">
                        ❌ ANNULÉE
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {facture.garageId?.nom || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {facture.garageId?.telephoneProfessionnel || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {facture.vehicleInfo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(facture.finalTotalTTC)}
                      </p>
                      {facture.paymentAmount > 0 && (
                        <p className="text-xs text-blue-600">
                          Payé: {formatCurrency(facture.paymentAmount)}
                        </p>
                      )}
                      {facture.paymentStatus === 'partiellement_paye' && (
                        <p className="text-xs text-red-600 font-medium">
                          Reste: {formatCurrency(facture.finalTotalTTC - (facture.paymentAmount || 0))}
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
                        disabled={loadingFactureId === facture._id || facture.paymentStatus === "annulee"}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingFactureId === facture._id ? "Chargement..." : "Voir"}
                      </button>

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
                ? 'Aucune facture ne correspond à vos critères.'
                : 'Vous n\'avez pas encore de factures.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal de détails */}
      {showDetailsModal && selectedFacture && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-5 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6 no-print">
              <h3 className="text-xl font-bold text-gray-900">
                Facture N° {selectedFacture.numeroFacture.toString().padStart(4, '0')}
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="invoice-content bg-white" id="invoice-print">
              {/* En-tête garage */}
              <div className="border-b-2 border-gray-200 pb-6 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-bold text-blue-600">
                      {selectedFacture.garageId?.nom || 'Garage'}
                    </h1>
                    <div className="mt-2 text-gray-600">
                      <p>{selectedFacture.garageId?.governorateName} - {selectedFacture.garageId?.cityName}-{selectedFacture.garageId?.streetAddress}</p>
                      <p>Tél: {selectedFacture.garageId?.telephoneProfessionnel}</p>
                      <p>Email: {selectedFacture.garageId?.emailProfessionnel}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <h2 className="text-2xl font-bold text-gray-800">FACTURE</h2>
                    <div className="mt-2 text-gray-600">
                      <p><span className="font-medium">N°:</span> {selectedFacture.numeroFacture.toString().padStart(4, '0')}</p>
                      <p><span className="font-medium">Date:</span> {formatDate(selectedFacture.invoiceDate)}</p>
                      <p><span className="font-medium">Échéance:</span> {formatDate(selectedFacture.dueDate)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Client et véhicule */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-1">
                    FACTURÉ À
                  </h3>
                  <div className="space-y-1 text-gray-700">
                    <p className="font-medium text-lg">{selectedFacture.clientInfo.nom}</p>
                    <p>Tél: {selectedFacture.realClientId?.phone}</p>
                    <p>Email: {selectedFacture.realClientId?.email}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-1">
                    VÉHICULE
                  </h3>
                  <div className="space-y-1 text-gray-700">
                    <p className="font-medium">{selectedFacture.vehicleInfo}</p>
                  </div>
                </div>
              </div>

              {/* Services */}
              {selectedFacture.services && selectedFacture.services.length > 0 && (
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
                      {selectedFacture.services.map((service, index) => (
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
                      {selectedFacture.maindoeuvre && selectedFacture.maindoeuvre > 0 && (
                        <tr className="bg-blue-50">
                          <td className="border border-gray-300 px-4 py-3 font-medium text-gray-900">
                            Main d'œuvre
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center">1</td>
                          <td className="border border-gray-300 px-4 py-3 text-right">
                            {formatCurrency(selectedFacture.maindoeuvre)}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-right font-medium">
                            {formatCurrency(selectedFacture.maindoeuvre)}
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
                      {selectedFacture.totalHT && (
                        <tr>
                          <td className="px-4 py-2 text-right font-medium text-gray-700 border-b">
                            TOTAL HT:
                          </td>
                          <td className="px-4 py-2 text-right border-b">
                            {formatCurrency(selectedFacture.totalHT)}
                          </td>
                        </tr>
                      )}
                      {selectedFacture.totalTVA && (
                        <tr>
                          <td className="px-4 py-2 text-right font-medium text-gray-700 border-b">
                            TVA ({selectedFacture.tvaRate || 20}%):
                          </td>
                          <td className="px-4 py-2 text-right border-b">
                            {formatCurrency(selectedFacture.totalTVA)}
                          </td>
                        </tr>
                      )}
                      {selectedFacture.totalRemise !== undefined && selectedFacture.totalRemise !== null && (
                        <tr>
                          <td className="px-4 py-2 text-right font-medium text-gray-700 border-b border-gray-200">
                            REMISE ({selectedFacture.remiseRate || 0}%):
                          </td>
                          <td className="px-4 py-2 text-right text-gray-900 border-b border-gray-200">
                            -{formatCurrency(selectedFacture.totalRemise)}
                          </td>
                        </tr>
                      )}
                      <tr className="bg-gray-100">
                        <td className="px-4 py-3 text-right text-lg font-bold">
                          TOTAL TTC:
                        </td>
                        <td className="px-4 py-3 text-right text-lg font-bold text-green-600">
                          {formatCurrency(selectedFacture.totalTTC)}
                        </td>
                      </tr>


                      {selectedFacture.timbreFiscal && selectedFacture.timbreFiscal > 0 && (
                        <tr>
                          <td className="px-4 py-2 text-right font-medium text-gray-700 border-b border-gray-200">
                            Timbre fiscal:
                          </td>
                          <td className="px-4 py-2 text-right text-gray-900 border-b border-gray-200">
                            {formatCurrency(selectedFacture.timbreFiscal)}
                          </td>
                        </tr>
                      )}
                      <tr className="bg-gray-100">
                        <td className="px-4 py-3 text-right text-lg font-bold text-gray-800">
                          TOTAL TTC avec remise :
                        </td>
                        <td className="px-4 py-3 text-right text-lg font-bold text-green-600">
                          {formatCurrency(selectedFacture.finalTotalTTC)}
                        </td>
                      </tr>


                      {selectedFacture.paymentAmount > 0 && (
                        <>
                          <tr>
                            <td className="px-4 py-2 text-right font-medium text-blue-700">
                              Payé:
                            </td>
                            <td className="px-4 py-2 text-right text-blue-700">
                              {formatCurrency(selectedFacture.paymentAmount)}
                            </td>
                          </tr>
                          {selectedFacture.paymentStatus !== 'paye' && (
                            <tr className="bg-yellow-50">
                              <td className="px-4 py-3 text-right font-bold text-red-700">
                                RESTE À PAYER:
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-red-700">
                                {formatCurrency(selectedFacture.finalTotalTTC - selectedFacture.paymentAmount)}
                              </td>
                            </tr>
                          )}
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-6">
                <div className="flex  justify-center items-start">
                  <div className="text-center text-xs text-gray-500">
                    <p>Merci pour votre confiance</p>
                  </div>
                </div>

              </div>

              {selectedFacture.notes && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700">Notes:</p>
                  <p className="text-sm text-gray-600 mt-1">{selectedFacture.notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t no-print">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <Download className="h-4 w-4 inline mr-2" />
                Imprimer
              </button>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}


      {showCreditNoteModal && creditNoteDetails && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-5 mx-auto p-6 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <div>
                <h3 className="text-2xl font-bold text-red-600">
                  AVOIR N° {creditNoteDetails.creditNumber}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Document d'annulation comptable
                </p>
              </div>
              <button
                onClick={() => setShowCreditNoteModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Informations principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-3">Facture Annulée</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>N° Facture:</strong> {creditNoteDetails.originalFactureNumber}</p>
                  <p><strong>Date d'émission avoir:</strong> {formatDate(creditNoteDetails.creditDate)}</p>
                  <p><strong>Raison:</strong> {creditNoteDetails.reason}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Client</h4>
                <div className="space-y-1 text-sm text-gray-700">
                  <p className="font-medium">{creditNoteDetails.clientId.nom}</p>
                  <p>Tél: {creditNoteDetails.clientId?.telephone}</p>
                  <p>Email: {creditNoteDetails.clientId?.email}</p>
                </div>

                <h4 className="font-semibold text-gray-800 mb-2 mt-4">Véhicule</h4>
                <p className="text-sm text-gray-700">{creditNoteDetails.vehicleInfo}</p>
              </div>
            </div>

            {/* Services annulés */}
            {creditNoteDetails.services && creditNoteDetails.services.length > 0 && (
              <div className="mb-8">
                <h4 className="font-semibold text-gray-800 mb-4">Services Annulés</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">
                          Description
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold">
                          Qté
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold">
                          Prix Unit.
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold">
                          Total Annulé
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {creditNoteDetails.services.map((service, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-300 px-4 py-3">{service.piece}</td>
                          <td className="border border-gray-300 px-4 py-3 text-center">{service.quantity}</td>
                          <td className="border border-gray-300 px-4 py-3 text-right">
                            {formatCurrency(service.unitPrice)}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-right font-medium text-red-600">
                            -{formatCurrency(service.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Total de l'avoir */}
            <div className="border-t-2 border-red-300 pt-6 mb-6">
              <div className="flex justify-end">
                <div className="w-100 bg-red-50 border border-red-200 rounded-lg p-4">

                  <div className="flex justify-end mb-8">
                    <div className="w-100">
                      <table className="w-full">
                        <tbody>
                          {creditNoteDetails.totalHT && (
                            <tr>
                              <td className="px-4 py-2 text-right font-medium text-gray-700 border-b">
                                TOTAL HT:
                              </td>
                              <td className="px-4 py-2 text-right border-b">
                                {formatCurrency(creditNoteDetails.totalHT)}
                              </td>
                            </tr>
                          )}
                          {creditNoteDetails.totalTVA && (
                            <tr>
                              <td className="px-4 py-2 text-right font-medium text-gray-700 border-b">
                                TVA ({creditNoteDetails.tvaRate || 20}%):
                              </td>
                              <td className="px-4 py-2 text-right border-b">
                                {formatCurrency(creditNoteDetails.totalTVA)}
                              </td>
                            </tr>
                          )}
                          {creditNoteDetails.totalRemise !== undefined && creditNoteDetails.totalRemise !== null && (
                            <tr>
                              <td className="px-4 py-2 text-right font-medium text-gray-700 border-b border-gray-200">
                                REMISE:
                              </td>
                              <td className="px-4 py-2 text-right text-gray-900 border-b border-gray-200">
                                -{formatCurrency(creditNoteDetails.totalRemise)}
                              </td>
                            </tr>
                          )}
                          <tr className="bg-gray-100">
                            <td className="px-4 py-3 text-right text-lg font-bold">
                              TOTAL TTC:
                            </td>
                            <td className="px-4 py-3 text-right text-lg font-bold text-red-600">
                              {formatCurrency(creditNoteDetails.totalTTC)}
                            </td>
                          </tr>


                          {creditNoteDetails.timbreFiscal && creditNoteDetails.timbreFiscal > 0 && (
                            <tr>
                              <td className="px-4 py-2 text-right font-medium text-gray-700 border-b border-gray-200">
                                Timbre fiscal:
                              </td>
                              <td className="px-4 py-2 text-right text-gray-900 border-b border-gray-200">
                                {formatCurrency(creditNoteDetails.timbreFiscal)}
                              </td>
                            </tr>
                          )}
                          <tr className="bg-gray-100">
                            <td className="px-4 py-3 text-right text-lg font-bold text-gray-800">
                              TOTAL TTC avec remise :
                            </td>
                            <td className="px-4 py-3 text-right text-lg font-bold text-red-600">
                              {formatCurrency(creditNoteDetails.finalTotalTTC)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <p className="text-s text-red-500 mt-2 text-center">
                    Ce montant annulé est de la facture originale
                  </p>
                </div>
              </div>
            </div>

            {/* Note légale */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Cet avoir annule définitivement la facture N° {creditNoteDetails.originalFactureNumber}.
                Il doit être conservé pour la comptabilité et peut servir de justificatif pour tout remboursement.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Imprimer l'avoir
              </button>
              <button
                onClick={() => setShowCreditNoteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Pagination */}
      {filteredFactures.length > itemsPerPage && (
        <div className="flex justify-between items-center mt-6 bg-white p-4 rounded-lg shadow">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
          >
            ← Précédent
          </button>

          <span className="text-sm text-gray-600">
            Page {currentPage} / {Math.ceil(filteredFactures.length / itemsPerPage)}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredFactures.length / itemsPerPage)))}
            disabled={currentPage === Math.ceil(filteredFactures.length / itemsPerPage)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
          >
            Suivant →
          </button>
        </div>
      )}

      {/* Style pour l'impression */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-print,
          #invoice-print * {
            visibility: visible;
          }
          #invoice-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          header {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ClientFactures;