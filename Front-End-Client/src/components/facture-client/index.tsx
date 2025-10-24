"use client"
import React, { useState, useEffect } from 'react';
import { Search, Filter, FileText, DollarSign, Clock, AlertTriangle, X, User, Calendar, Car, Download, CreditCard } from 'lucide-react';
import axios from 'axios';

interface GarageInfo {
  username: string;
  email: string;
  phone: string;
  governorateName: string;
  cityName: string;
  streetAddress: string;
}

interface FactureDetails {
  _id: string;
  numeroFacture: number;
  garagisteId: GarageInfo;
  clientInfo: {
    nom: string;
  };
  realClientId:{
    email: string;
    phone: string;
  };
  vehicleInfo: string;
  totalTTC: number;
  totalHT?: number;
  totalTVA?: number;
  tvaRate?: number;
  paymentStatus: 'en_attente' | 'paye' | 'en_retard' | 'partiellement_paye' | 'annule';
  invoiceDate: string;
  dueDate: string;
  paymentAmount?: number;
  services?: Array<{
    name: string;
    description: string;
    piece: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  maindoeuvre?: number;
  notes?: string;
  creditNoteId?: string;
  status?: 'active' | 'cancelled';
}

interface Stats {
  totalFactures: number;
  totalTTC: number;
  totalPaye: number;
  totalImpaye: number;
  facturesEnRetard: number;
}

const ClientFactures: React.FC = () => {
  const [factures, setFactures] = useState<FactureDetails[]>([]);
  const [filteredFactures, setFilteredFactures] = useState<FactureDetails[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalFactures: 0,
    totalTTC: 0,
    totalPaye: 0,
    totalImpaye: 0,
    facturesEnRetard: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('tous');
  const [selectedFacture, setSelectedFacture] = useState<FactureDetails | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
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

    if (selectedFacture || showDetailsModal || showPaymentModal) {
      header.classList.add("hidden");
    } else {
      header.classList.remove("hidden");
    }
  }, [selectedFacture, showDetailsModal, showPaymentModal]);

  const fetchFactures = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/client/factures', {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      if (response.data.success) {
        setFactures(response.data.data);
        setFilteredFactures(response.data.data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des factures:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/client/factures/stats', {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des stats:', error);
    }
  };

  const handlePayment = async (factureId: string, paymentData: any) => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        alert('❌ Erreur: Session expirée. Veuillez vous reconnecter.');
        window.location.href = '/login';
        return;
      }
      
      console.log('🔍 Tentative paiement client pour facture:', factureId);
      
      const response = await axios.post(
        `http://localhost:5000/api/client/factures/${factureId}/payment`,
        paymentData,
        {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        alert('✅ Paiement enregistré avec succès !');
        fetchFactures();
        fetchStats();
        setShowPaymentModal(false);
        setSelectedFacture(null);
      }
    } catch (error: any) {
      console.error('❌ Erreur lors du paiement:', error);
      
      if (error.response?.status === 401) {
        alert('❌ Session expirée. Veuillez vous reconnecter.');
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Erreur de connexion au serveur';
      
      alert('❌ Erreur lors du paiement: ' + errorMessage);
    }
  };

  useEffect(() => {
    let filtered = factures;

    if (searchTerm) {
      filtered = filtered.filter(facture =>
        facture.numeroFacture.toString().includes(searchTerm) ||
        facture.vehicleInfo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        facture.garagisteId?.username.toLowerCase().includes(searchTerm.toLowerCase())
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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentFactures.map((facture) => (
                <tr
                  key={facture._id}
                  className={`hover:bg-gray-50 ${
                    facture.paymentStatus === 'en_retard'
                      ? 'bg-red-50 border-l-4 border-red-500'
                      : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {facture.numeroFacture.toString().padStart(4, '0')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {facture.garagisteId?.username || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {facture.garagisteId?.phone || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {facture.vehicleInfo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(facture.totalTTC)}
                      </p>
                      {facture.paymentAmount > 0 && (
                        <p className="text-xs text-blue-600">
                          Payé: {formatCurrency(facture.paymentAmount)}
                        </p>
                      )}
                      {facture.paymentStatus === 'partiellement_paye' && (
                        <p className="text-xs text-red-600 font-medium">
                          Reste: {formatCurrency(facture.totalTTC - (facture.paymentAmount || 0))}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedFacture(facture);
                          setShowDetailsModal(true);
                        }}
                        disabled={facture.paymentStatus === 'annule'}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                      >
                        Voir
                      </button>
                      {facture.paymentStatus !== 'paye' && facture.paymentStatus !== 'annule' && (
                        <button
                          onClick={() => {
                            setSelectedFacture(facture);
                            setShowPaymentModal(true);
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          <CreditCard className="h-4 w-4 inline mr-1" />
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
                      {selectedFacture.garagisteId?.username || 'Garage'}
                    </h1>
                    <div className="mt-2 text-gray-600">
                      <p>{selectedFacture.garagisteId?.governorateName} - {selectedFacture.garagisteId?.cityName}</p>
                      <p>{selectedFacture.garagisteId?.streetAddress}</p>
                      <p>Tél: {selectedFacture.garagisteId?.phone}</p>
                      <p>Email: {selectedFacture.garagisteId?.email}</p>
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
                    CLIENT
                  </h3>
                  <div className="space-y-1 text-gray-700">
                    <p className="font-medium text-lg">{selectedFacture.clientInfo.nom}</p>
                    <p>Tél: {selectedFacture.realClientId.phone}</p>
                    <p>Email: {selectedFacture.realClientId.email}</p>
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
                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">
                          DESCRIPTION
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold">
                          QTÉ
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold">
                          PRIX UNITAIRE
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold">
                          TOTAL
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedFacture.services.map((service, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-300 px-4 py-3">
                            <p className="font-medium">{service.piece}</p>
                            {service.description && (
                              <p className="text-xs text-gray-500">{service.description}</p>
                            )}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center">
                            {service.quantity}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-right">
                            {formatCurrency(service.unitPrice)}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-right font-medium">
                            {formatCurrency(service.total)}
                          </td>
                        </tr>
                      ))}

                      {selectedFacture.maindoeuvre && selectedFacture.maindoeuvre > 0 && (
                        <tr className="bg-blue-50">
                          <td className="border border-gray-300 px-4 py-3 font-medium">
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
                <div className="w-64">
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
                      <tr className="bg-gray-100">
                        <td className="px-4 py-3 text-right text-lg font-bold">
                          TOTAL TTC:
                        </td>
                        <td className="px-4 py-3 text-right text-lg font-bold text-green-600">
                          {formatCurrency(selectedFacture.totalTTC)}
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
                                {formatCurrency(selectedFacture.totalTTC - selectedFacture.paymentAmount)}
                              </td>
                            </tr>
                          )}
                        </>
                      )}
                    </tbody>
                  </table>
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
              {selectedFacture.paymentStatus !== 'paye' && selectedFacture.paymentStatus !== 'annule' && (
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setShowPaymentModal(true);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  <CreditCard className="h-4 w-4 inline mr-2" />
                  Payer cette facture
                </button>
              )}
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

      {/* Modal de paiement */}
      {showPaymentModal && selectedFacture && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Effectuer un paiement
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Facture N°:</span> {selectedFacture.numeroFacture.toString().padStart(4, '0')}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Montant total:</span> {formatCurrency(selectedFacture.totalTTC)}
              </p>
              {selectedFacture.paymentAmount > 0 && (
                <>
                  <p className="text-sm text-blue-600">
                    <span className="font-medium">Déjà payé:</span> {formatCurrency(selectedFacture.paymentAmount)}
                  </p>
                  <p className="text-sm text-red-600 font-medium">
                    <span className="font-medium">Reste:</span> {formatCurrency(selectedFacture.totalTTC - selectedFacture.paymentAmount)}
                  </p>
                </>
              )}
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handlePayment(selectedFacture._id, {
                paymentAmount: Number(formData.get('amount')),
                paymentMethod: formData.get('method'),
                paymentDate: formData.get('date'),
                reference: formData.get('reference')
              });
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant à payer *
                </label>
                <input
                  type="number"
                  name="amount"
                  step="0.001"
                  min="0.001"
                  max={selectedFacture.totalTTC - (selectedFacture.paymentAmount || 0)}
                  defaultValue={selectedFacture.totalTTC - (selectedFacture.paymentAmount || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: {formatCurrency(selectedFacture.totalTTC - (selectedFacture.paymentAmount || 0))}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Méthode de paiement *
                </label>
                <select
                  name="method"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Sélectionner...</option>
                  <option value="especes">💵 Espèces</option>
                  <option value="cheque">📝 Chèque</option>
                  <option value="virement">🏦 Virement bancaire</option>
                  <option value="carte">💳 Carte bancaire</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de paiement *
                </label>
                <input
                  type="date"
                  name="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  max={new Date().toISOString().split('T')[0]}
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
                <p className="text-xs text-gray-500 mt-1">
                  Ex: Chèque n°123456, Virement REF789
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-6">
                <p className="text-xs text-yellow-800">
                  ℹ️ <strong>Information:</strong> Votre paiement sera enregistré et validé par le garage. 
                  Vous recevrez une confirmation par email.
                </p>
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
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Confirmer le paiement
                </button>
              </div>
            </form>
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