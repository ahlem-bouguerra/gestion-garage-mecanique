"use client";
import React, { useState, useEffect } from 'react';
import { Users, Search, Mail, Phone, Calendar, CheckCircle, XCircle, Loader, ArrowLeft, Car, FileText, Wrench, Eye } from 'lucide-react';
import axios from 'axios';

const SuperAdminClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVerified, setFilterVerified] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    unverified: 0,
    google: 0
  });

  // États pour la vue détaillée
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientDetails, setClientDetails] = useState(null);
  const [vehicules, setVehicules] = useState([]);
  const [selectedVehicule, setSelectedVehicule] = useState(null);
  const [carnetEntretien, setCarnetEntretien] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Fonction pour récupérer les clients depuis l'API
  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/all-clients', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = response.data;
      if (data.success) {
        setClients(data.data);
        setFilteredClients(data.data);
        calculateStats(data.data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des clients:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer les détails d'un client
  const fetchClientDetails = async (clientId) => {
    try {
      setDetailsLoading(true);
      const response = await axios.get(`http://localhost:5000/api/clients/${clientId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.data.success) {
        setClientDetails(response.data.data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des détails:', error);
    } finally {
      setDetailsLoading(false);
    }
  };


   const formatPrice = (price: number) => {
    return price.toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' TND';
  };


  // Fonction pour récupérer les véhicules d'un client
  const fetchVehicules = async (clientId) => {
    try {
      console.log('Fetching vehicules for client:', clientId);
      const response = await fetch(`http://localhost:5000/api/clients/${clientId}/vehicules`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();
      console.log('Vehicules response:', data);
      
      if (data.success) {
        setVehicules(data.data || []);
      } else {
        console.error('Error in response:', data);
        setVehicules([]);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des véhicules:', error);
    }
  };

  // Fonction pour récupérer le carnet d'entretien d'un véhicule
  const fetchCarnetEntretien = async (vehiculeId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/clients/vehicules/${vehiculeId}/carnet-entretien`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.data.success) {
        setCarnetEntretien(response.data.data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du carnet:', error);
    }
  };

  // Gérer le clic sur un client
  const handleClientClick = async (client) => {
    setSelectedClient(client);
    await fetchClientDetails(client._id);
    await fetchVehicules(client._id);
    setSelectedVehicule(null);
    setCarnetEntretien([]);
  };

  // Gérer le clic sur un véhicule
  const handleVehiculeClick = async (vehicule) => {
    setSelectedVehicule(vehicule);
    await fetchCarnetEntretien(vehicule._id);
  };

  // Retour à la liste
  const handleBackToList = () => {
    setSelectedClient(null);
    setClientDetails(null);
    setVehicules([]);
    setSelectedVehicule(null);
    setCarnetEntretien([]);
  };

  // Calculer les statistiques
  const calculateStats = (clientsData) => {
    const verified = clientsData.filter(c => c.isVerified).length;
    const google = clientsData.filter(c => c.googleId).length;
    
    setStats({
      total: clientsData.length,
      verified: verified,
      unverified: clientsData.length - verified,
      google: google
    });
  };

  // Filtrer les clients
  useEffect(() => {
    let filtered = clients;

    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.includes(searchTerm)
      );
    }

    if (filterVerified === 'verified') {
      filtered = filtered.filter(c => c.isVerified);
    } else if (filterVerified === 'unverified') {
      filtered = filtered.filter(c => !c.isVerified);
    }

    setFilteredClients(filtered);
  }, [searchTerm, filterVerified, clients]);

  useEffect(() => {
    fetchClients();
  }, []);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Chargement des clients...</p>
        </div>
      </div>
    );
  }

  // Vue détaillée du client
  if (selectedClient) {
    return (
 <div className="min-h-screen  p-3">
      <div className="w-full">
          
          {/* Bouton retour */}
          <button
            onClick={handleBackToList}
            className="mb-6 flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-gray-700 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour à la liste
          </button>

          {/* En-tête du client */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-3xl">
                  {selectedClient.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">{selectedClient.username}</h1>
                  <div className="flex flex-wrap gap-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{selectedClient.email}</span>
                    </div>
                    {selectedClient.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{selectedClient.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Inscrit le {formatDate(selectedClient.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {selectedClient.isVerified ? (
                  <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                    <CheckCircle className="w-4 h-4" />
                    Vérifié
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold bg-orange-100 text-orange-800">
                    <XCircle className="w-4 h-4" />
                    Non vérifié
                  </span>
                )}
                {selectedClient.googleId && (
                  <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                    Compte Google
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Liste des véhicules */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Car className="w-6 h-6 text-blue-600" />
              Véhicules ({vehicules.length})
            </h2>
            
            {vehicules.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucun véhicule enregistré</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vehicules.map((vehicule) => (
                  <div
                    key={vehicule._id}
                    onClick={() => handleVehiculeClick(vehicule)}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedVehicule?._id === vehicule._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">{vehicule.marque} {vehicule.modele}</h3>
                        <p className="text-sm text-gray-600">{vehicule.annee}</p>
                      </div>
                      <Car className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-600"><span className="font-semibold">Immatriculation:</span> {vehicule.immatriculation}</p>
                      <p className="text-gray-600"><span className="font-semibold">Kilométrage:</span> {vehicule.kilometrage?.toLocaleString()} km</p>
                      {vehicule.vin && <p className="text-gray-600"><span className="font-semibold">VIN:</span> {vehicule.vin}</p>}
                    </div>
                    <button className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">
                      <Eye className="w-4 h-4" />
                      Voir le carnet d'entretien
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

{/* Carnet d'entretien */}
{selectedVehicule && (
  <div className="bg-white rounded-xl shadow-lg p-6">
    <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
      <FileText className="w-6 h-6 text-blue-600" />
      Carnet d'entretien - {selectedVehicule.marque} {selectedVehicule.modele}
    </h2>

    {carnetEntretien.length === 0 ? (
      <p className="text-gray-500 text-center py-8">Aucun entretien enregistré</p>
    ) : (
      <div className="space-y-4">
        {carnetEntretien.map((entretien) => (
          <div key={entretien._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Wrench className="w-6 h-6 text-blue-500" />
                <div>
                  <h3 className="font-bold text-lg text-gray-800">
                    {/* Afficher le nom du premier service */}
                    {entretien.services && entretien.services.length > 0 
                      ? entretien.services[0].nom 
                      : 'Service non spécifié'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {entretien.dateCommencement 
                      ? formatDate(entretien.dateCommencement) 
                      : 'Date non spécifiée'}
                  </p>
                </div>
              </div>
              {entretien.totalTTC && (
                <span className="text-xl font-bold text-blue-600">
                 {formatPrice (entretien.totalTTC)}
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              {entretien.kilometrageEntretien && (
                <p className="text-gray-600">
                  <span className="font-semibold">Kilométrage:</span> {entretien.kilometrageEntretien.toLocaleString()} km
                </p>
              )}
              {entretien.statut && (
                <p className="text-gray-600">
                  <span className="font-semibold">Statut:</span> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    entretien.statut === 'termine' ? 'bg-green-100 text-green-800' :
                    entretien.statut === 'en_cours' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {entretien.statut}
                  </span>
                </p>
              )}
              {entretien.dateFinCompletion && (
                <p className="text-gray-600">
                  <span className="font-semibold">Date :</span> {formatDate(entretien.dateFinCompletion)}
                </p>
              )}
            </div>
            
            {/* Afficher tous les services */}
            {entretien.services && entretien.services.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <p className="font-semibold text-sm text-gray-700 mb-2">Services effectués:</p>
                <div className="space-y-1">
                  {entretien.services.map((service) => (
                    <div key={service._id} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      Tache :<span className="font-medium">{service.nom}</span>
                      <br/>
                    Quantité :
                      {service.quantite && (
                         <span className="text-gray-500"> {service.quantite}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Afficher les pièces si disponibles */}
            {entretien.pieces && entretien.pieces.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <p className="font-semibold text-sm text-gray-700 mb-2">Pièces utilisées:</p>
                <div className="space-y-1">
                  {entretien.pieces.map((piece, index) => (
                    <div key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      {piece.nom || piece.reference}
                      {piece.quantite && ` (x${piece.quantite})`}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {entretien.notes && (
              <p className="mt-3 text-gray-700 text-sm bg-gray-50 p-3 rounded">
                <span className="font-semibold">Notes:</span> {entretien.notes}
              </p>
            )}
            
            {entretien.devisId && (
            <div className="mt-3 pt-3 border-t">
                <p className="text-sm text-gray-600">
                <span className="font-semibold">Devis lié:</span> {
                    typeof entretien.devisId === 'object' && entretien.devisId !== null
                    ? entretien.devisId.id || 'Non spécifié'  // ✅ Afficher le champ 'id' (DEV001)
                    : entretien.devisId
                }
                </p>

                {entretien.garageId && (
        <p className="text-xl text-red-600">
          <span className="font-semibold">Garage:</span> {
            typeof entretien.garageId === 'object' && entretien.garageId !== null
              ? entretien.garageId.nom || 'Non spécifié'
              : 'Non spécifié'
          }
        </p>
      )}
            </div>
            )}
        </div>
        ))}
      </div>
    )}
  </div>
)}

        </div>
      </div>
    );
  }

  // Vue liste des clients
  return (
  <div className="min-h-screen  p-3">
      <div className="w-full">
        
                   <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-lg mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Users className="h-8 w-8" />
                   Gestion des Clients
                </h1>
                <p className="text-blue-100 mt-2">Vue d'ensemble de tous les clients de la plateforme</p>
              </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Clients</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.total}</p>
              </div>
              <Users className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Vérifiés</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.verified}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Non Vérifiés</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.unverified}</p>
              </div>
              <XCircle className="w-12 h-12 text-orange-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Compte Google</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.google}</p>
              </div>
              <Mail className="w-12 h-12 text-purple-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par nom, email ou téléphone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <select
              value={filterVerified}
              onChange={(e) => setFilterVerified(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            >
              <option value="all">Tous les clients</option>
              <option value="verified">Vérifiés uniquement</option>
              <option value="unverified">Non vérifiés uniquement</option>
            </select>
          </div>
        </div>

        {/* Liste des clients */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Nom</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Téléphone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Statut</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Date d'inscription</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      Aucun client trouvé
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={client._id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {client.username?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800">{client.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span className="text-sm">{client.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span className="text-sm">{client.phone || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {client.isVerified ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3" />
                            Vérifié
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                            <XCircle className="w-3 h-3" />
                            Non vérifié
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {client.googleId ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                            Google
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            Email
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">{formatDate(client.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleClientClick(client)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          Voir détails
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer avec nombre de résultats */}
        <div className="mt-6 text-center text-gray-600">
          <p className="text-sm">
            Affichage de <span className="font-semibold">{filteredClients.length}</span> sur <span className="font-semibold">{clients.length}</span> clients
          </p>
        </div>

      </div>
    </div>
  );
};

export default SuperAdminClientsPage;