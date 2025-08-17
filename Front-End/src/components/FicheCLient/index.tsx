"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Filter, Plus, User, Building2, Calendar, Car, Phone, Mail, MapPin, Eye, Edit, Trash2 } from 'lucide-react';
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

// Définition des types TypeScript
interface ContactSecondaire {
  nom: string;
  relation: string;
  telephone: string;
  email?: string;
}

interface HistoriqueVisite {
  date: string;
  service: string;
  montant: string;
}

interface Client {
  _id: string;
  id?: string | number;  // Optionnel car on utilise _id comme principal
  nom: string;
  type: "particulier" | "professionnel";
  adresse: string;
  telephone: string;
  email: string;
  vehiculeAssocie: string;
  derniereVisite?: string;
  contactsSecondaires?: ContactSecondaire[];
  historiqueVisites?: HistoriqueVisite[];
}

interface FormData {
  nom: string;
  type: "particulier" | "professionnel";
  adresse: string;
  telephone: string;
  email: string;
  vehiculeAssocie: string;
}

export default function ClientForm() {
  const [formData, setFormData] = useState<FormData>({
    nom: "",
    type: "particulier",
    adresse: "",
    telephone: "",
    email: "",
    vehiculeAssocie: "",
  });
  
  const [clients, setClients] = useState<Client[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [modalType, setModalType] = useState<"view" | "add" | "edit">("view");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("tous");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Charger tous les clients au montage du composant
  useEffect(() => {
    fetchAllClients();
  }, []);

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.vehiculeAssocie.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "tous" || client.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [clients, searchTerm, filterType]);

  // Récupérer tous les clients
  const fetchAllClients = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/GetAll`);
      setClients(response.data);
      setError("");
    } catch (error) {
      console.error("Erreur lors de la récupération des clients:", error);
      setError("Erreur lors du chargement des clients");
    } finally {
      setLoading(false);
    }
  };

  // Récupérer un client par ID
  const fetchClientById = async (id: string | number): Promise<Client | null> => {
    try {
      console.log("🔍 Récupération du client avec ID:", id);
      const response = await axios.get(`${API_BASE_URL}/GetOne/${id}`);
      console.log("📥 Client récupéré:", response.data);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération du client:", error);
      setError("Erreur lors du chargement du client");
      return null;
    }
  };

  // Créer un nouveau client
  const createClient = async (clientData: FormData): Promise<any> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/Creation`, clientData);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // Mettre à jour un client
  const updateClient = async (id: string | number, clientData: FormData): Promise<any> => {
    try {
      console.log("🔄 Frontend updateClient - ID reçu:", id);
      console.log("🔄 Frontend updateClient - Données:", clientData);
      
      if (!id) {
        throw new Error("ID du client non défini");
      }
      
      // CORRECTION: Ajouter les données dans le body de la requête PUT
      const response = await axios.put(`${API_BASE_URL}/updateOne/${id}`, clientData);
      console.log("✅ Réponse serveur:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Erreur dans updateClient:", error);
      throw error;
    }
  };

  // Supprimer un client
  const deleteClient = async (id: string | number): Promise<void> => {
    console.log("🗑️ Frontend - Suppression du client avec ID:", id);
    
    if (!id) {
      console.error("❌ ID undefined dans deleteClient");
      alert("Erreur: ID du client non défini");
      return;
    }

    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/deleteOne/${id}`);
      // CORRECTION: Utiliser _id au lieu de id pour la comparaison
      setClients(clients.filter(client => client._id !== id && client.id !== id));
      alert("Client supprimé avec succès !");
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      alert("Erreur lors de la suppression : " + errorMessage);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openModal = async (type: "view" | "add" | "edit", client: Client | null = null): Promise<void> => {
    console.log("🎯 Ouverture modal:", type, "pour client:", client);
    setModalType(type);
    if (client) {
      // CORRECTION: Utiliser _id en priorité, puis id comme fallback
      const clientId = client._id ;
      console.log("🆔 ID utilisé:", clientId);
      console.log("🔍 Client original:", JSON.stringify(client, null, 2));
      
      if (type === "view" || type === "edit") {
        const fullClient = await fetchClientById(clientId);
        console.log("📋 Client complet récupéré:", JSON.stringify(fullClient, null, 2));
        if (fullClient) {
          setSelectedClient(fullClient);
          if (type === "edit") {
            console.log("✏️ Remplissage du formulaire avec:", fullClient);
            setFormData({
              nom: fullClient.nom,
              type: fullClient.type,
              adresse: fullClient.adresse,
              telephone: fullClient.telephone,
              email: fullClient.email,
              vehiculeAssocie: fullClient.vehiculeAssocie
            });
          }
        }
      } else {
        setSelectedClient(client);
      }
    } else {
      // Nouveau client
      setFormData({
        nom: "",
        type: "particulier",
        adresse: "",
        telephone: "",
        email: "",
        vehiculeAssocie: ""
      });
      setSelectedClient(null);
    }
    setShowModal(true);
  };

  const closeModal = (): void => {
    setShowModal(false);
    setSelectedClient(null);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError("");

    console.log("📝 Soumission du formulaire - Type:", modalType);
    console.log("📝 Client sélectionné:", selectedClient);

    try {
      if (modalType === "add") {
        // Créer un nouveau client
        console.log("➕ Création d'un nouveau client:", formData);
        await createClient(formData);
        alert("Client ajouté avec succès !");
      } else if (modalType === "edit" && selectedClient) {
        // CORRECTION: Utiliser _id en priorité pour la mise à jour
        const clientId = selectedClient._id ;
        console.log("✏️ Modification du client avec ID:", clientId);
        console.log("📝 Données à envoyer:", formData);
        await updateClient(clientId, formData);
        alert("Client modifié avec succès !");
      }
      
      // Recharger la liste des clients
      await fetchAllClients();
      closeModal();
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setError("Erreur : " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Clients</h1>
            <button
              onClick={() => openModal("add")}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Client</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher par nom, véhicule ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="tous">Tous les types</option>
                <option value="particulier">Particuliers</option>
                <option value="professionnel">Professionnels</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && !showModal && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Chargement...</p>
          </div>
        )}

        {/* Clients List */}
        <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-2">
          {filteredClients.map((client) => {
            console.log("🏷️ Rendu client:", client.nom, "avec _id:", client._id, "et id:", client.id);
            return (
              <div key={client._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {client.type === "professionnel" ? (
                        <Building2 className="w-8 h-8 text-blue-600" />
                      ) : (
                        <User className="w-8 h-8 text-green-600" />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{client.nom}</h3>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${client.type === "professionnel"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                          }`}>
                          {client.type === "professionnel" ? "Professionnel" : "Particulier"}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          console.log("🔍 Clic sur Voir pour:", client.nom, "ID:", client._id || client.id);
                          openModal("view", client);
                        }}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          console.log("✏️ Clic sur Modifier pour:", client.nom, "ID:", client._id || client.id);
                          openModal("edit", client);
                        }}
                        className="p-2 text-gray-500 hover:text-orange-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          const clientId = client._id;
                          console.log("🗑️ Clic sur Supprimer pour:", client.nom, "ID:", clientId);
                          deleteClient(clientId);
                        }}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>{client.adresse}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>{client.telephone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>{client.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Car className="w-4 h-4" />
                      <span>{client.vehiculeAssocie}</span>
                    </div>
                    {client.derniereVisite && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Dernière visite: {new Date(client.derniereVisite).toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                  </div>

                  {client.contactsSecondaires && client.contactsSecondaires.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Conducteurs autorisés:</h4>
                      {client.contactsSecondaires.map((contact, index) => (
                        <div key={index} className="text-xs text-gray-500 mb-1 flex items-center justify-between">
                          <span>{contact.nom} ({contact.relation})</span>
                          <span className="text-blue-600">{contact.telephone}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredClients.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun client trouvé</h3>
            <p className="text-gray-500">Aucun client ne correspond à vos critères de recherche.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {modalType === "add" && "Nouveau Client"}
                  {modalType === "edit" && "Modifier Client"}
                  {modalType === "view" && "Détails Client"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Error Message in Modal */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {modalType === "view" ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                      <p className="text-gray-900">{selectedClient?.nom}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <p className="text-gray-900 capitalize">{selectedClient?.type}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                      <p className="text-gray-900">{selectedClient?.adresse}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                      <p className="text-gray-900">{selectedClient?.telephone}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <p className="text-gray-900">{selectedClient?.email}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Véhicule associé</label>
                      <p className="text-gray-900">{selectedClient?.vehiculeAssocie}</p>
                    </div>
                  </div>

                  {selectedClient?.contactsSecondaires && selectedClient.contactsSecondaires.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Conducteurs autorisés / Contacts famille</h3>
                      <div className="space-y-3">
                        {selectedClient.contactsSecondaires.map((contact, index) => (
                          <div key={index} className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                            <div className="flex justify-between items-start mb-2">
                              <p className="font-medium text-gray-900">{contact.nom}</p>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {contact.relation}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {contact.telephone}
                            </p>
                            {contact.email && (
                              <p className="text-sm text-gray-600 flex items-center mt-1">
                                <Mail className="w-3 h-3 mr-1" />
                                {contact.email}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedClient?.historiqueVisites && selectedClient.historiqueVisites.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Historique des visites</h3>
                      <div className="space-y-2">
                        {selectedClient.historiqueVisites.map((visite, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                            <div>
                              <p className="font-medium">{visite.service}</p>
                              <p className="text-sm text-gray-600">{new Date(visite.date).toLocaleDateString('fr-FR')}</p>
                            </div>
                            <p className="font-bold text-green-600">{visite.montant}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                      <input
                        type="text"
                        name="nom"
                        value={formData.nom}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="particulier">Particulier</option>
                        <option value="professionnel">Professionnel</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                    <input
                      type="text"
                      name="adresse"
                      value={formData.adresse}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                      <input
                        type="tel"
                        name="telephone"
                        value={formData.telephone}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Véhicule associé</label>
                    <input
                      type="text"
                      name="vehiculeAssocie"
                      value={formData.vehiculeAssocie}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Renault Clio - AB-123-CD"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={loading}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center space-x-2"
                    >
                      {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                      <span>{modalType === "add" ? "Ajouter" : "Sauvegarder"}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}