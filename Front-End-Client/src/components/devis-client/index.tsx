"use client";
import React, { useState, useEffect } from 'react';
import { Eye, Calendar, Car, FileText, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import axios from 'axios';

const ClientDevisPage = () => {
  const [devis, setDevis] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    brouillon: 0,
    envoye: 0,
    accepte: 0,
    refuse: 0
  });
  const [selectedDevis, setSelectedDevis] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('tous'); // tous, brouillon, envoye, accepte, refuse

  const statusColors = {
    brouillon: 'bg-gray-100 text-gray-800',
    envoye: 'bg-blue-100 text-blue-800',
    accepte: 'bg-green-100 text-green-800',
    refuse: 'bg-red-100 text-red-800'
  };

  const statusIcons = {
    brouillon: Clock,
    envoye: FileText,
    accepte: CheckCircle,
    refuse: XCircle
  };

  const statusLabels = {
    brouillon: 'Brouillon',
    envoye: 'Envoyé',
    accepte: 'Accepté',
    refuse: 'Refusé'
  };


  useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;

    if (selectedDevis) {
      header.classList.add("hidden");
    } else {
      header.classList.remove("hidden");
    }
  }, [selectedDevis]);


  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  // 📊 Charger les statistiques
  const loadStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/mes-devis/stats', {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (err :any) {
          if (err.response?.status === 401) {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    window.location.href = '/auth/sign-in';
    return;
  }
      console.error('Erreur chargement stats:', err);
    }
  };

  // 📋 Charger les devis
  const loadDevis = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.get('http://localhost:5000/api/all-mes-devis', {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });

      if (response.data.success) {
        setDevis(response.data.data);
      }
    } catch (err:any) {
          if (err.response?.status === 401) {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    window.location.href = '/auth/sign-in';
    return;
  }
      setError(err.response?.data?.message || 'Erreur lors du chargement des devis');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  // 🔍 Charger un devis spécifique
  const loadDevisDetails = async (devisId:string) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/mes-devis/${devisId}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });

      if (response.data.success) {
        setSelectedDevis(response.data.data);
      }
    } catch (err : any) {
          if (err.response?.status === 401) {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    window.location.href = '/auth/sign-in';
    return;
  }
      setError(err.response?.data?.message || 'Erreur lors du chargement du devis');
    }
  };

  useEffect(() => {
    loadDevis();
    loadStats();
  }, []);

  // Filtrer les devis
  const filteredDevis = filter === 'tous'
    ? devis
    : devis.filter((d:any) => d.status === filter);

  return (
        <div className="min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Devis</h1>
          <p className="text-gray-600">Consultez l'historique de vos devis</p>
        </div>

        {/* Erreur */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Brouillon</p>
                <p className="text-2xl font-bold text-gray-600">{stats.brouillon}</p>
              </div>
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Envoyé</p>
                <p className="text-2xl font-bold text-blue-600">{stats.envoye}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-green-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Accepté</p>
                <p className="text-2xl font-bold text-green-600">{stats.accepte}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600">Refusé</p>
                <p className="text-2xl font-bold text-red-600">{stats.refuse}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Filtrer par:</span>
            {['tous', 'brouillon', 'envoye', 'accepte', 'refuse'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {status === 'tous' ? 'Tous' : statusLabels[status as keyof typeof statusLabels]}
              </button>
            ))}
          </div>
        </div>

        {/* Liste des devis */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {filteredDevis.length} devis trouvé(s)
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Chargement...</p>
            </div>
          ) : filteredDevis.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>Aucun devis trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Devis</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Garage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Véhicule</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant TTC</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant TTC aprés remise</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDevis.map(d => {
                    const StatusIcon = statusIcons[d.status as keyof typeof statusIcons];
                    return (
                      <tr key={d._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {d.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {d.garageId?.nom || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Car className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{d.vehicleInfo}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{d.inspectionDate}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {d.totalTTC?.toFixed(3) || '0.000'} DT
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {d.finalTotalTTC?.toFixed(3) || '0.000'} DT
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[d.status as keyof typeof statusColors]}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusLabels[d.status as keyof typeof statusLabels]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => loadDevisDetails(d._id)}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
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

        {/* Modal Détails */}
        {selectedDevis && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Devis {selectedDevis.id}</h2>
                  <button
                    onClick={() => setSelectedDevis(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Infos garage */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Informations Garage</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><strong>Nom:</strong> {selectedDevis.garageId?.nom || 'N/A'}</p>
                    <p><strong>Email:</strong> {selectedDevis.garageId?.emailProfessionnel || 'N/A'}</p>
                    <p><strong>Téléphone:</strong> {selectedDevis.garageId?.telephoneProfessionnel || 'N/A'}</p>
                  </div>
                </div>

                {/* Infos véhicule */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Véhicule</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p>{selectedDevis.vehicleInfo}</p>
                    <p className="text-sm text-gray-600 mt-1">Date: {selectedDevis.inspectionDate}</p>
                  </div>
                </div>

                {/* Services */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Détail des Services</h3>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pièce</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qté</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Prix Unit.</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedDevis.services.map((s : any, i : number) => (
                        <tr key={i}>
                          <td className="px-4 py-2 text-sm">{s.piece}</td>
                          <td className="px-4 py-2 text-sm">{s.quantity}</td>
                          <td className="px-4 py-2 text-sm">{s.unitPrice?.toFixed(3)} DT</td>
                          <td className="px-4 py-2 text-sm font-medium">{s.total?.toFixed(3)} DT</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totaux */}
                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Récapitulatif</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total pièces HT:</span>
                      <span className="font-medium"> { selectedDevis.totalServicesHT?.toFixed(3) }Dinnar</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Main d'œuvre:</span>
                      <span className="font-medium">{ selectedDevis.maindoeuvre?.toFixed(3) } Dinnar</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total HT:</span>
                      <span className="font-medium">{ selectedDevis.totalHT?.toFixed(3) } Dinnar</span>
                    </div>

                    <div className="flex justify-between  text-blue-700">
                      <span>TVA ({ selectedDevis.tvaRate}%)::</span> {/* ✅ Affiche le taux dynamique */}
                      <span className="font-medium">{ selectedDevis.montantTVA?.toFixed(3) } Dinnar</span>
                    </div>

                    <div className="flex justify-between  text-red-700">
                      <span>Remise ({ selectedDevis.remiseRate}%):</span> {/* ✅ Affiche le taux dynamique */}
                      <span className="font-medium">-{ selectedDevis.montantRemise?.toFixed(3) } Dinnar</span>
                    </div>

                    <div className="flex justify-between text-lg font-bold border-t pt-2  text-green-700">
                      <span>Total TTC:</span>
                      <span>{selectedDevis.totalTTC?.toFixed(3) } Dinnar</span>
                    </div>


                    <div className="flex justify-between text-lg font-bold border-t pt-2  text-yellow-700">
                      <span>Total TTC avec remise :</span>
                      <span>{ selectedDevis.finalTotalTTC?.toFixed(3) } Dinnar</span>
                    </div>

                  </div>
                </div>
              </div>

              <div className="p-6 border-t">
                <button
                  onClick={() => setSelectedDevis(null)}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
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

export default ClientDevisPage;