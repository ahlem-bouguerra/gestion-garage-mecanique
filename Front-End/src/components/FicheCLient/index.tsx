"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, Plus, User, Building2, Calendar, Car, Phone, Mail, MapPin, Eye, Edit, Trash2, History, Clock, Wrench } from 'lucide-react';
import axios from "axios";

interface HistoriqueVisite {
  id: string;
  numeroOrdre: string;
  dateVisite: string;
  vehicule: string;
  atelier: string;
  dureeHeures: number;
  taches: Array<{
    description: string;
    service: string;
    mecanicien: string;
    heuresReelles: number;
    status: string;
  }>;
  servicesEffectues: string;
}
const API_BASE_URL = "http://localhost:5000/api";
interface ContactSecondaire {
  nom: string;
  relation: string;
  telephone: string;
  email?: string;
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
  // AJOUTER CES LIGNES :
  nomSociete?: string;
  telephoneSociete?: string;
  emailSociete?: string;
  adresseSociete?: string;
}
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
    nomSociete: "",
    telephoneSociete: "",
    emailSociete: "",
    adresseSociete: "",
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [modalType, setModalType] = useState<"view" | "add" | "edit" | "history">("view");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("tous");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [telephoneError, setTelephoneError] = useState("");
  const router = useRouter();
  const [clientsHistorique, setClientsHistorique] = useState<{ [clientId: string]: HistoriqueVisite[] }>({});
  const [clientsResume, setClientsResume] = useState<{ [clientId: string]: { nombreVisites: number; derniereVisite: any } }>({});
  const [historiqueDetails, setHistoriqueDetails] = useState<HistoriqueVisite[]>([]);
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [clientVehicules, setClientVehicules] = useState<{ [clientId: string]: Vehicule[] }>({});
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [dateFilter, setDateFilter] = useState("tous");
  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  useEffect(() => {
    fetchAllClients();
    fetchAllVehicules();
  }, []);

  useEffect(() => {
    if (clients.length > 0) {
      loadAllClientsResume();
    }
  }, [clients]);

      const showError = (message: string) => {
        console.error("❌ Erreur:", message);
        setError(typeof message === 'string' ? message : 'Une erreur est survenue');
        setTimeout(() => setError(""), 5000);
    };


  useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;

    if (loadingHistory || selectedClient) {
      header.classList.add("hidden");
    } else {
      header.classList.remove("hidden");
    }
  }, [loadingHistory, selectedClient]);

const fetchAllVehicules = async (): Promise<void> => {
    try {
        const token = getAuthToken();
      
        // ⭐ VÉRIFICATION CRITIQUE
        if (!token || token === 'null' || token === 'undefined') {
            // Rediriger vers le login
            window.location.href = '/auth/sign-in';
            return;
        }
        
        console.log("🚗 Chargement de tous les véhicules...");
        const response = await axios.get(`${API_BASE_URL}/vehicules`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        setVehicules(response.data);

        const vehiculesParClient: { [clientId: string]: Vehicule[] } = {};
        response.data.forEach((vehicule: any) => {
            let clientId: string;

            if (typeof vehicule.proprietaireId === 'string') {
                clientId = vehicule.proprietaireId;
            } else if (vehicule.proprietaireId && vehicule.proprietaireId._id) {
                clientId = vehicule.proprietaireId._id;
            } else {
                console.warn("Structure proprietaireId inattendue:", vehicule.proprietaireId);
                return;
            }

            if (!vehiculesParClient[clientId]) {
                vehiculesParClient[clientId] = [];
            }

            const vehiculePropre = {
                ...vehicule,
                proprietaireId: clientId
            };

            vehiculesParClient[clientId].push(vehiculePropre);
        });

        setClientVehicules(vehiculesParClient);
        console.log("✅ Véhicules organisés par client:", vehiculesParClient);
        
    } catch (error: any) {
        console.error("❌ Erreur chargement véhicules:", error);
        
        // ⭐ VÉRIFICATION DES ERREURS D'AUTORISATION
        if (error.response?.status === 403) {
            alert("❌ Accès refusé : Vous n'avez pas la permission de consulter les véhicules");
            return;
        }
        
        if (error.response?.status === 401) {
            alert("❌ Session expirée : Veuillez vous reconnecter");
            window.location.href = '/auth/sign-in';
            return;
        }
        
        // Autres erreurs
        const errorMessage = error.response?.data?.error || error.message;
        showError(`Erreur chargement véhicules: ${errorMessage}`);
    }
};

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

  const getClientVehicules = (clientId: string): string => {
    const vehiculesClient = clientVehicules[clientId] || [];

    if (vehiculesClient.length === 0) {
      return "Non assigné";
    }

    if (vehiculesClient.length === 1) {
      const vehicule = vehiculesClient[0];
      return `${vehicule.marque} ${vehicule.modele} (${vehicule.immatriculation})`;
    }

    return `${vehiculesClient.length} véhicules associés`;
  };

  const filterByDate = (client) => {
    const resume = clientsResume[client._id];

    if (dateFilter === "tous") return true;

    if (dateFilter === "jamais") {
      return !resume || resume.nombreVisites === 0;
    }

    if (!resume || !resume.derniereVisite) return false;

    const derniereVisiteDate = new Date(resume.derniereVisite.date);
    const now = new Date();

    switch (dateFilter) {
      case "7jours":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return derniereVisiteDate >= weekAgo;
      case "30jours":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return derniereVisiteDate >= monthAgo;
      case "90jours":
        const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        return derniereVisiteDate >= quarterAgo;
      case "6mois":
        const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        return derniereVisiteDate >= sixMonthsAgo;
      case "1an":
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        return derniereVisiteDate >= yearAgo;
      case "plus1an":
        const yearAgoPlus = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        return derniereVisiteDate < yearAgoPlus;
      default:
        return true;
    }
  };

  // 3. Modifiez votre useMemo comme ceci :
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const vehiculeInfo = getClientVehicules(client._id);
      const matchesSearch = client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehiculeInfo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "tous" || client.type === filterType;
      const matchesDate = filterByDate(client);
      return matchesSearch && matchesType && matchesDate;
    });
  }, [clients, searchTerm, filterType, dateFilter, clientVehicules, clientsResume]);


  const fetchAllClients = async (): Promise<void> => {
    setLoading(true);
    try {
      const token = getAuthToken();
      
      // ⭐ VÉRIFICATION CRITIQUE
      if (!token || token === 'null' || token === 'undefined') {
        // Rediriger vers le login
        window.location.href = '/auth/sign-in';
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/GetAll`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClients(response.data);
      setError("");
    } catch (error:any) {
      setError("Erreur lors du chargement des clients");
        if (error.response?.status === 403) {
            alert("❌ Accès refusé : Vous n'avez pas la permission de consulter les véhicules");
            return;
        }
        
        if (error.response?.status === 401) {
            alert("❌ Session expirée : Veuillez vous reconnecter");
            window.location.href = '/auth/sign-in';
            return;
        }
    } finally {
      setLoading(false);
    }
  };

  const fetchClientById = async (id: string | number): Promise<Client | null> => {
    try {
            const token = getAuthToken();
      
      // ⭐ VÉRIFICATION CRITIQUE
      if (!token || token === 'null' || token === 'undefined') {
        // Rediriger vers le login
        window.location.href = '/auth/sign-in';
        return null;
      }
      console.log("🔍 Récupération du client avec ID:", id);
      const response = await axios.get(`${API_BASE_URL}/GetOne/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("📥 Client récupéré:", response.data);
      return response.data;
    } catch (error:any) {
        if (error.response?.status === 403) {
            alert("❌ Accès refusé : Vous n'avez pas la permission de consulter les véhicules");
            return null;
        }
        
        if (error.response?.status === 401) {
            alert("❌ Session expirée : Veuillez vous reconnecter");
            window.location.href = '/auth/sign-in';
            return null;
        }
      setError("Erreur lors du chargement du client");
      return null;
    }
  };

  const fetchClientResume = async (clientId: string) => {
    try {
            const token = getAuthToken();
      
      // ⭐ VÉRIFICATION CRITIQUE
      if (!token || token === 'null' || token === 'undefined') {
        // Rediriger vers le login
        window.location.href = '/auth/sign-in';
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/clients/${clientId}/visites-resume`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setClientsResume(prev => ({
          ...prev,
          [clientId]: {
            nombreVisites: response.data.nombreVisites,
            derniereVisite: response.data.derniereVisite
          }
        }));
      }
    } catch (error:any) {
        if (error.response?.status === 403) {
            alert("❌ Accès refusé : Vous n'avez pas la permission de consulter les véhicules");
            return null;
        }
        
        if (error.response?.status === 401) {
            alert("❌ Session expirée : Veuillez vous reconnecter");
            window.location.href = '/auth/sign-in';
            return null;
        }
      if (error.response?.status !== 404) {
        console.error("❌ Erreur lors du chargement du résumé:", error);
      }
      setClientsResume(prev => ({
        ...prev,
        [clientId]: {
          nombreVisites: 0,
          derniereVisite: null
        }
      }));
    }
  };

  const fetchClientHistorique = async (clientId: string): Promise<HistoriqueVisite[]> => {
    try {
            const token = getAuthToken();
      
      // ⭐ VÉRIFICATION CRITIQUE
      if (!token || token === 'null' || token === 'undefined') {
        // Rediriger vers le login
        window.location.href = '/auth/sign-in';
        return[];
      }
      console.log("📋 Chargement historique pour client:", clientId);
      setLoadingHistory(true);
      const response = await axios.get(`${API_BASE_URL}/clients/${clientId}/historique`, 
         { headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const historique = response.data.historiqueVisites;

        setClientsHistorique(prev => ({
          ...prev,
          [clientId]: historique
        }));

        return historique;
      }
      return [];
    } catch (error:any) {
        if (error.response?.status === 403) {
            alert("❌ Accès refusé : Vous n'avez pas la permission de consulter les véhicules");
            return [];
        }
        
        if (error.response?.status === 401) {
            alert("❌ Session expirée : Veuillez vous reconnecter");
            window.location.href = '/auth/sign-in';
            return [];
        }
      if (error.response?.status === 404) {
        setError("Routes d'historique non configurées dans le backend");
      } else {
        console.error("❌ Erreur lors du chargement de l'historique:", error);
        setError("Erreur lors du chargement de l'historique");
      }
      return [];
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadAllClientsResume = async () => {
    if (clients.length === 0) return;

    try {
      if (clients.length > 0) {
        await fetchClientResume(clients[0]._id);

        for (let i = 1; i < clients.length; i++) {
          await fetchClientResume(clients[i]._id);
        }
      }
    } catch (error) {
      console.log("Routes d'historique non encore implémentées");
    }
  };

  const getClientVisitesInfo = (clientId: string): string => {
    const resume = clientsResume[clientId];

    if (!resume || resume.nombreVisites === 0) {
      return "Aucune visite";
    }

    if (resume.nombreVisites === 1) {
      return "1 visite effectuée";
    }

    return `${resume.nombreVisites} visites effectuées`;
  };

  const getDerniereVisite = (clientId: string): string => {
    const resume = clientsResume[clientId];

    if (!resume || !resume.derniereVisite) {
      return "";
    }

    const date = new Date(resume.derniereVisite.date);
    return date.toLocaleDateString('fr-FR');

  };

  const createClient = async (clientData: any): Promise<any> => {
    try {
            const token = getAuthToken();
      
      // ⭐ VÉRIFICATION CRITIQUE
      if (!token || token === 'null' || token === 'undefined') {
        // Rediriger vers le login
        window.location.href = '/auth/sign-in';
        return;
      }
      const response = await axios.post(`${API_BASE_URL}/Creation`, clientData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error:any) {
        if (error.response?.status === 403) {
            alert("❌ Accès refusé : Vous n'avez pas la permission de consulter les véhicules");
            throw error;
        }
        
        if (error.response?.status === 401) {
            alert("❌ Session expirée : Veuillez vous reconnecter");
            window.location.href = '/auth/sign-in';
            throw error;
        }
      if (error.response && error.response.data && error.response.data.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error("Erreur lors de la création du client");
    }
  };

  const updateClient = async (id: string | number, clientData: FormData): Promise<any> => {
    try {
            const token = getAuthToken();
      
      // ⭐ VÉRIFICATION CRITIQUE
      if (!token || token === 'null' || token === 'undefined') {
        // Rediriger vers le login
        window.location.href = '/auth/sign-in';
        return;
      }
      console.log("🔄 Frontend updateClient - ID reçu:", id);
      console.log("🔄 Frontend updateClient - Données:", clientData);

      if (!id) {
        throw new Error("ID du client non défini");
      }

      const response = await axios.put(`${API_BASE_URL}/updateOne/${id}`, clientData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("✅ Réponse serveur:", response.data);

      return response.data;
    } catch (error:any) {
        if (error.response?.status === 403) {
            alert("❌ Accès refusé : Vous n'avez pas la permission de consulter les véhicules");
            throw error;
        }
        
        if (error.response?.status === 401) {
            alert("❌ Session expirée : Veuillez vous reconnecter");
            window.location.href = '/auth/sign-in';
            throw error;
        }
      console.error("❌ Erreur dans updateClient:", error);
      throw error;
    }
  };

  const deleteClient = async (id: string | number): Promise<void> => {
    console.log("🗑️ Frontend - Suppression du client avec ID:", id);

    if (!id) {
      alert("Erreur: ID du client non défini");
      return;
    }

    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
      return;
    }

    try {
            const token = getAuthToken();
      
      // ⭐ VÉRIFICATION CRITIQUE
      if (!token || token === 'null' || token === 'undefined') {
        // Rediriger vers le login
        window.location.href = '/auth/sign-in';
        return;
      }
      await axios.delete(`${API_BASE_URL}/deleteOne/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClients(clients.filter(client => client._id !== id && client.id !== id));
      alert("Client supprimé avec succès !");
    } catch (error:any) {
        if (error.response?.status === 403) {
            alert("❌ Accès refusé : Vous n'avez pas la permission de consulter les véhicules");
            return ;
        }
        
        if (error.response?.status === 401) {
            alert("❌ Session expirée : Veuillez vous reconnecter");
            window.location.href = '/auth/sign-in';
            return ;
        }
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      alert("Erreur lors de la suppression : " + errorMessage);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openModal = async (type: "view" | "add" | "edit" | "history", client: Client | null = null): Promise<void> => {
    console.log("🎯 Ouverture modal:", type, "pour client:", client);
    setModalType(type);
    setError(""); // Reset error state

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
              nomSociete: fullClient.nomSociete || "",
              telephoneSociete: fullClient.telephoneSociete || "",
              emailSociete: fullClient.emailSociete || "",
              adresseSociete: fullClient.adresseSociete || "",
            });
          }
        }
      } else if (type === "history") {
        setSelectedClient(client);
        const historique = await fetchClientHistorique(clientId);
        setHistoriqueDetails(historique);
      } else {
        setSelectedClient(client);
      }
    } else if (type === "add") {
      // Reset form for new client
      setFormData({
        nom: "",
        type: "particulier",
        adresse: "",
        telephone: "",
        email: "",
      });
    }

    setShowModal(true);
  };

  const closeModal = (): void => {
    setShowModal(false);
    setSelectedClient(null);
    setError("");
    setHistoriqueDetails([]);
    setTelephoneError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    // Validate phone before submission
    const phoneError = validateTunisianPhone(formData.telephone);
    if (phoneError) {
      setError(phoneError);
      return;
    }

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
      await fetchAllVehicules();
      closeModal();
    } catch (error:any) {
        if (error.response?.status === 403) {
            alert("❌ Accès refusé : Vous n'avez pas la permission de consulter les véhicules");
            return ;
        }
      console.error("Erreur lors de la soumission:", error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setError("Erreur : " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderHistoryModal = () => {
    if (!selectedClient) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">
            Historique des visites - {selectedClient.nom}
          </h3>
          <div className="text-sm text-gray-600">
            {historiqueDetails.length} visite(s) effectuée(s)
          </div>
        </div>

        {loadingHistory ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Chargement de l'historique...</p>
          </div>
        ) : historiqueDetails.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune visite enregistrée</h3>
            <p className="text-gray-500">Ce client n'a pas encore d'historique de visites terminées.</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {historiqueDetails.map((visite, index) => (
              <div key={visite.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900">{visite.numeroOrdre}</span>
                      <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Terminé
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {new Date(visite.dateVisite).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {visite.dureeHeures}h de travail
                    </div>
                    <div className="text-sm text-gray-600">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      {visite.atelier}
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <Car className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-gray-900">{visite.vehicule}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <Wrench className="w-4 h-4 inline mr-1" />
                    Services: {visite.servicesEffectues}
                  </div>
                </div>

                <div className="border-t border-gray-300 pt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Tâches effectuées ({visite.taches.length})
                  </h4>
                  <div className="space-y-2">
                    {visite.taches.map((tache, tacheIndex) => (
                      <div key={tacheIndex} className="bg-white p-2 rounded border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{tache.description}</p>
                            <p className="text-xs text-gray-600">
                              Service: {tache.service} | Mécanicien: {tache.mecanicien}
                            </p>
                          </div>
                          <div className="text-xs text-gray-500 text-right">
                            {tache.heuresReelles}h
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
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
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="tous">Toutes les dates</option>
                <option value="jamais">Jamais visité</option>
                <option value="7jours">7 derniers jours</option>
                <option value="30jours">30 derniers jours</option>
                <option value="90jours">3 derniers mois</option>
                <option value="6mois">6 derniers mois</option>
                <option value="1an">Dernière année</option>
                <option value="plus1an">Plus d'1 an</option>
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
                      <button
                        onClick={() => openModal("history", client)}
                        className="p-2 text-gray-500 hover:text-purple-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Historique des visites"
                      >
                        <History className="w-4 h-4" />
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
                    <div className="flex items-center space-x-2">
                      <History className="w-4 h-4" />
                      <span className={clientsResume[client._id]?.nombreVisites === 0 ? "text-gray-400 italic" : "text-blue-600"}>
                        {getClientVisitesInfo(client._id)}
                      </span>
                    </div>
                    {clientsResume[client._id]?.derniereVisite && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Dernière visite: {getDerniereVisite(client._id)}</span>

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
                  {modalType === "history" && "Historique des Visites"}
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

              {modalType === "history" ? (
                renderHistoryModal()
              ) : modalType === "view" ? (
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
                    {selectedClient?.type === "professionnel" && (
                      <>
                        <div className="md:col-span-2 mt-4 pt-4 border-t border-gray-200">
                          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
                            <Building2 className="w-4 h-4" />
                            <span>Informations de la société</span>
                          </h4>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nom société</label>
                          <p className="text-gray-900">{selectedClient?.nomSociete || "Non renseigné"}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone société</label>
                          <p className="text-gray-900">{selectedClient?.telephoneSociete || "Non renseigné"}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email société</label>
                          <p className="text-gray-900">{selectedClient?.emailSociete || "Non renseigné"}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Adresse société</label>
                          <p className="text-gray-900">{selectedClient?.adresseSociete || "Non renseigné"}</p>
                        </div>
                      </>
                    )}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Véhicule(s) associé(s)</label>
                      <p className={`text-gray-900 ${getClientVehicules(selectedClient?._id || "") === "Non assigné" ? "text-orange-600 italic" : ""
                        }`}>
                        {getClientVehicules(selectedClient?._id || "")}
                      </p>

                      {/* Section détaillée des véhicules dans le modal */}
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

                      {/* Section historique des visites dans le modal view */}
                      {selectedClient && clientsResume[selectedClient._id] && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Historique des visites:</h4>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <History className="w-4 h-4" />
                              <span className={clientsResume[selectedClient._id]?.nombreVisites === 0 ? "text-gray-400 italic" : "text-blue-600"}>
                                {getClientVisitesInfo(selectedClient._id)}
                              </span>
                            </div>
                            {clientsResume[selectedClient._id]?.derniereVisite && (
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4" />
                                <span>Dernière visite: {getDerniereVisite(selectedClient._id)}</span>

                              </div>
                            )}
                          </div>
                          {clientsResume[selectedClient._id]?.nombreVisites > 0 && (
                            <button
                              onClick={() => {
                                closeModal();
                                setTimeout(() => openModal("history", selectedClient), 100);
                              }}
                              className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
                            >
                              <History className="w-4 h-4" />
                              <span>Voir l'historique complet</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contacts secondaires */}
                  {selectedClient?.contactsSecondaires && selectedClient.contactsSecondaires.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Conducteurs autorisés:</h4>
                      <div className="space-y-2">
                        {selectedClient.contactsSecondaires.map((contact, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <User className="w-4 h-4 text-gray-600" />
                              <div>
                                <span className="font-medium">{contact.nom}</span>
                                <span className="text-gray-600 ml-2">({contact.relation})</span>
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              <Phone className="w-4 h-4 inline mr-1" />
                              {contact.telephone}
                            </div>
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
                    {/* Champs Société - apparaissent seulement si type professionnel */}
                    {formData.type === "professionnel" && (
                      <div className="md:col-span-2 space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h3 className="font-medium text-blue-900 flex items-center space-x-2">
                          <Building2 className="w-5 h-5" />
                          <span>Informations de la société</span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nom de la société *
                            </label>
                            <input
                              type="text"
                              name="nomSociete"
                              value={formData.nomSociete || ""}
                              onChange={handleChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              required={formData.type === "professionnel"}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Téléphone société *
                            </label>
                            <input
                              type="tel"
                              name="telephoneSociete"
                              value={formData.telephoneSociete || ""}
                              onChange={(e) => {
                          let value = e.target.value.replace(/[^\d\s\-]/g, '');
                          if (value.length > 8) return;

                          handleChange({ target: { name: 'telephoneSociete', value } } as React.ChangeEvent<HTMLInputElement>);

                          const cleaned = value.replace(/[\s\-]/g, '');
                          const isValid = /^[24579]\d{7}$/.test(cleaned);

                          if (cleaned && !isValid) {
                            setTelephoneError("Numéro tunisien invalide");
                          } else {
                            setTelephoneError("");
                          }
                        }}
                              placeholder="Ex: 71234567"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              required={formData.type === "professionnel"}
                            />
                            {telephoneError && <p className="text-red-500 text-sm mt-1">{telephoneError}</p>}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Email société *
                            </label>
                            <input
                              type="email"
                              name="emailSociete"
                              value={formData.emailSociete || ""}
                              onChange={handleChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              required={formData.type === "professionnel"}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Adresse société *
                            </label>
                            <input
                              type="text"
                              name="adresseSociete"
                              value={formData.adresseSociete || ""}
                              onChange={handleChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              required={formData.type === "professionnel"}
                            />
                          </div>
                        </div>
                      </div>
                    )}
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
                            setTelephoneError("Numéro tunisien invalide");
                          } else {
                            setTelephoneError("");
                          }
                        }}
                        placeholder="Ex: 20123456"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${telephoneError ? 'border-red-500' : 'border-gray-300'
                          }`}
                        required
                      />
                      {telephoneError && <p className="text-red-500 text-sm mt-1">{telephoneError}</p>}
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
                      disabled={loading || telephoneError !== ""}
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