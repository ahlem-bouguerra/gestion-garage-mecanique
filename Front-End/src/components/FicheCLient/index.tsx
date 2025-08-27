"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  id?: string | number;
  nom: string;
  type: "particulier" | "professionnel";
  adresse: string;
  telephone: string;
  email: string;
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
}

// Interface pour les véhicules
interface Vehicule {
  _id: string;
  proprietaireId: string;
  marque: string;
  modele: string;
  immatriculation: string;
  annee?: number;
  couleur?: string;
  typeCarburant?: string;
  kilometrage?: number;
  statut: "actif" | "inactif";
}

export default function ClientForm() {
  const [formData, setFormData] = useState<FormData>({
    nom: "",
    type: "particulier",
    adresse: "",
    telephone: "",
    email: "",
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [modalType, setModalType] = useState<"view" | "add" | "edit">("view");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("tous");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [telephoneError, setTelephoneError] = useState("");
  const router = useRouter();
  
  // CORRECTION 1: Changer la structure pour stocker tous les véhicules
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [clientVehicules, setClientVehicules] = useState<{[clientId: string]: Vehicule[]}>({});

  // Charger tous les clients au montage du composant
  useEffect(() => {
    fetchAllClients();
    fetchAllVehicules(); // CORRECTION 2: Charger tous les véhicules une seule fois
  }, []);

  // CORRECTION 3: Fonction pour charger tous les véhicules
  const fetchAllVehicules = async (): Promise<void> => {
    try {
      console.log("🚗 Chargement de tous les véhicules...");
      const response = await axios.get(`${API_BASE_URL}/vehicules`);
      setVehicules(response.data);
      
      // Organiser par client
      const vehiculesParClient: {[clientId: string]: Vehicule[]} = {};
      response.data.forEach((vehicule: any) => {
        // CORRECTION: Extraire l'ID du proprietaire selon la structure de votre backend
        let clientId: string;
        
        if (typeof vehicule.proprietaireId === 'string') {
          // Si proprietaireId est déjà un string
          clientId = vehicule.proprietaireId;
        } else if (vehicule.proprietaireId && vehicule.proprietaireId._id) {
          // Si proprietaireId est un objet avec _id (populated)
          clientId = vehicule.proprietaireId._id;
        } else {
          // Cas de fallback
          console.warn("Structure proprietaireId inattendue:", vehicule.proprietaireId);
          return;
        }
        
        console.log("🔍 Organisation véhicule:", vehicule.marque, "pour client ID:", clientId);
        
        if (!vehiculesParClient[clientId]) {
          vehiculesParClient[clientId] = [];
        }
        
        // Créer un objet véhicule propre avec l'ID string
        const vehiculePropre = {
          ...vehicule,
          proprietaireId: clientId // S'assurer que c'est un string
        };
        
        vehiculesParClient[clientId].push(vehiculePropre);
      });
      
      setClientVehicules(vehiculesParClient);
      console.log("✅ Véhicules organisés par client:", vehiculesParClient);
      console.log("🔍 Clés des clients avec véhicules:", Object.keys(vehiculesParClient));
    } catch (error) {
      console.error("❌ Erreur lors du chargement des véhicules:", error);
    }
  };

  // CORRECTION 4: Simplifier la fonction pour obtenir les véhicules d'un client
  const getClientVehicules = (clientId: string): string => {
    console.log("🔍 Recherche véhicules pour client ID:", clientId);
    console.log("🔍 Clés disponibles dans clientVehicules:", Object.keys(clientVehicules));
    
    const vehiculesClient = clientVehicules[clientId] || [];
    console.log("🚗 Véhicules trouvés:", vehiculesClient.length);
    
    if (vehiculesClient.length === 0) {
      return "Non assigné";
    }
    
    if (vehiculesClient.length === 1) {
      const vehicule = vehiculesClient[0];
      return `${vehicule.marque} ${vehicule.modele} (${vehicule.immatriculation})`;
    }
    
    return `${vehiculesClient.length} véhicules associés`;
  };

  // Validation simple pour numéros tunisiens
  const validateTunisianPhone = (phone: string) => {
    const cleaned = phone.replace(/[\s\-]/g, '');
    const tunisianPattern = /^[24579]\d{7}$/;

    if (!cleaned) return "Numéro requis";
    if (!tunisianPattern.test(cleaned)) return "Numéro tunisien invalide (ex: 20123456)";
    return "";
  };

  const handleTelephoneChange = (e: { target: { value: string; }; }) => {
    let value = e.target.value.replace(/[^\d\s\-]/g, '');
    if (value.length > 10) return;

    setFormData({ ...formData, telephone: value });

    const error = validateTunisianPhone(value);
    setTelephoneError(error);
  };

  // CORRECTION 5: Corriger les dépendances du useMemo
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const vehiculeInfo = getClientVehicules(client._id);
      const matchesSearch = client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehiculeInfo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "tous" || client.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [clients, searchTerm, filterType, clientVehicules]); // Corriger les dépendances

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

  // CORRECTION 6: Fonction pour récupérer les véhicules d'un client spécifique (pour le modal)
  const fetchClientVehicules = async (clientId: string): Promise<Vehicule[]> => {
    try {
      console.log("🔍 Récupération véhicules pour client:", clientId);
      // CORRECTION: Utiliser la bonne URL selon votre route backend
      const response = await axios.get(`${API_BASE_URL}/vehicules/proprietaire/${clientId}`);
      console.log("🚗 Véhicules reçus:", response.data);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des véhicules du client:", error);
      return [];
    }
  };

  const createClient = async (clientData: any): Promise<any> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/Creation`, clientData);
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error("Erreur lors de la création du client");
    }
  };

  const updateClient = async (id: string | number, clientData: FormData): Promise<any> => {
    try {
      console.log("🔄 Frontend updateClient - ID reçu:", id);
      console.log("🔄 Frontend updateClient - Données:", clientData);

      if (!id) {
        throw new Error("ID du client non défini");
      }

      const response = await axios.put(`${API_BASE_URL}/updateOne/${id}`, clientData);
      console.log("✅ Réponse serveur:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Erreur dans updateClient:", error);
      throw error;
    }
  };

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
      const clientId = client._id;
      console.log("🆔 ID utilisé:", clientId);

      if (type === "view" || type === "edit") {
        const fullClient = await fetchClientById(clientId);
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
            });
          }
        }
      } else {
        setSelectedClient(client);
      }
    } else {
      setFormData({
        nom: "",
        type: "particulier",
        adresse: "",
        telephone: "",
        email: "",
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

    try {
      if (modalType === "add") {
        console.log("➕ Création d'un nouveau client:", formData);
        await createClient(formData);
        alert("Client ajouté avec succès !");
      } else if (modalType === "edit" && selectedClient) {
        const clientId = selectedClient._id;
        console.log("✏️ Modification du client avec ID:", clientId);
        await updateClient(clientId, formData);
        alert("Client modifié avec succès !");
      }

      await fetchAllClients();
      await fetchAllVehicules(); // CORRECTION 7: Recharger aussi les véhicules
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
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          client.type === "professionnel"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}>
                          {client.type === "professionnel" ? "Professionnel" : "Particulier"}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openModal("view", client)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openModal("edit", client)}
                        className="p-2 text-gray-500 hover:text-orange-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteClient(client._id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
onClick={() => {
  sessionStorage.setItem('preselectedClient', JSON.stringify({
    id: client._id,
    nom: client.nom
  }));
  router.push("/fiche-voiture");
}}
  className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
  title="Associer véhicules"
>
  <Car className="w-4 h-4" />
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
                      <span className={getClientVehicules(client._id) === "Non assigné" ? "text-orange-600 italic" : ""}>
                        {getClientVehicules(client._id)}
                      </span>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Véhicule(s) associé(s)</label>
                      <p className={`text-gray-900 ${
                        getClientVehicules(selectedClient?._id || "") === "Non assigné" ? "text-orange-600 italic" : ""
                      }`}>
                        {getClientVehicules(selectedClient?._id || "")}
                      </p>
                      
                      {/* CORRECTION 8: Section détaillée des véhicules dans le modal */}
                      {selectedClient && clientVehicules[selectedClient._id] && clientVehicules[selectedClient._id].length > 0 && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Véhicules associés:</h4>
                          <div className="space-y-2">
                            {clientVehicules[selectedClient._id].map((vehicule) => (
                              <div key={vehicule._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <Car className="w-4 h-4 text-blue-600" />
                                  <div>
                                    <span className="font-medium">{vehicule.marque} {vehicule.modele}</span>
                                    <span className="text-gray-600 ml-2">({vehicule.immatriculation})</span>
                                  </div>
                                </div>
                                <div className="text-sm text-gray-500">
                                  {vehicule.annee && <span>{vehicule.annee}</span>}
                                  {vehicule.couleur && <span className="ml-2">• {vehicule.couleur}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
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
                        onChange={(e) => {
                          let value = e.target.value.replace(/[^\d\s\-]/g, '');
                          if (value.length > 8) return;

                          handleChange({ target: { name: 'telephone', value } } as React.ChangeEvent<HTMLInputElement>);

                          const cleaned = value.replace(/[\s\-]/g, '');
                          const isValid = /^[24579]\d{7}$/.test(cleaned);

                          if (cleaned && !isValid) {
                            setError("Numéro tunisien invalide");
                          } else {
                            setError("");
                          }
                        }}
                        placeholder="Ex: 20123456"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          error ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required
                      />
                      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
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