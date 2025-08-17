"use client"
import React, { useState, useEffect } from 'react';
import { Car, Plus, Edit, Trash2, User, Building2, Calendar, Phone, UserCheck } from 'lucide-react';
import axios from 'axios';
// Simulation d'axios pour la démo


const API_BASE_URL = "http://localhost:5000/api";

interface Vehicule {
    _id: string;
    proprietaireId: string;
    marque: string;
    modele: string;
    kilometrage?: number;
    immatriculation: string;
    annee?: number;
    couleur?: string;
    typeCarburant?: string;
    dateCreation: Date;
    statut: "actif" | "inactif";
}

interface Client {
    _id: string;
    nom: string;
    type: "particulier" | "professionnel";
    telephone: string;
    email: string;
}

interface Visite {
    _id: string;
    clientId: string;
    vehiculeId: string;
    conducteurNom: string;
    conducteurTelephone?: string;
    conducteurRelation: string;
    dateVisite: Date;
    kilometrageVisite?: number; // Kilométrage au moment de la visite
    services: string[];
    montantTotal: number;
    statut: "en_cours" | "terminee" | "annulee";
    notes?: string;
}

interface VehiculeFormData {
    proprietaireId: string;
    marque: string;
    kilometrage: string; // String dans le form, converti en number lors de l'envoi
    modele: string;
    immatriculation: string;
    annee: string;
    couleur: string;
    typeCarburant: string;
}

interface VisiteFormData {
    clientId: string;
    vehiculeId: string;
    conducteurNom: string;
    conducteurTelephone: string;
    conducteurRelation: string;
    services: string;
    montantTotal: string;
    notes: string;
}

export default function VehiculeManagement() {
    const [vehicules, setVehicules] = useState<Vehicule[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [visites, setVisites] = useState<Visite[]>([]);
    const [showVehiculeModal, setShowVehiculeModal] = useState(false);
    const [showVisiteModal, setShowVisiteModal] = useState(false);
    const [selectedVehicule, setSelectedVehicule] = useState<Vehicule | null>(null);
    const [modalType, setModalType] = useState<"add" | "edit" | "visit">("add");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [vehiculeForm, setVehiculeForm] = useState<VehiculeFormData>({
        proprietaireId: "",
        marque: "",
        modele: "",
        kilometrage: "",
        immatriculation: "",
        annee: "",
        couleur: "",
        typeCarburant: "essence"
    });

    const [visiteForm, setVisiteForm] = useState<VisiteFormData>({
        clientId: "",
        vehiculeId: "",
        conducteurNom: "",
        conducteurTelephone: "",
        conducteurRelation: "propriétaire",
        services: "",
        montantTotal: "",
        notes: ""
    });

    useEffect(() => {
        fetchClients();
        fetchVehicules();
        fetchVisites();
    }, []);




    // Fonction utilitaire pour formater l'affichage
    const formatKilometrage = (km: number | undefined): string => {
        if (!km) return "Non renseigné";
        return `${km.toLocaleString('fr-FR')} km`;
    };

    // Fonction utilitaire pour parser l'input
    const parseKilometrage = (input: string): number | undefined => {
        const cleaned = input.replace(/[^0-9]/g, ''); // Enlever tout sauf les chiffres
        const parsed = parseInt(cleaned, 10);
        return isNaN(parsed) ? undefined : parsed;
    };

const fetchClients = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/clients/noms`);
        console.log("🔍 Données reçues:", response.data);
        
        // Plus besoin de transformation, utilisez directement les données
        setClients(response.data);
    } catch (error) {
        console.error("Erreur lors du chargement des clients:", error);
    }
};

    const fetchVehicules = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/vehicules`);
            setVehicules(response.data);
        } catch (error) {
            console.error("Erreur lors du chargement des véhicules:", error);
        }
    };

    const fetchVisites = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/visites`);
            setVisites(response.data);
        } catch (error) {
            console.error("Erreur lors du chargement des visites:", error);
        }
    };

    const getClientName = (clientId: string) => {
        const client = clients.find(c => c._id === clientId);
        return client ? client.nom : "Client inconnu";
    };

    const getClientType = (clientId: string) => {
        const client = clients.find(c => c._id === clientId);
        return client ? client.type : "particulier";
    };

    const openVehiculeModal = (type: "add" | "edit", vehicule: Vehicule | null = null) => {
        setModalType(type);
        if (vehicule) {
            setSelectedVehicule(vehicule);
            setVehiculeForm({
                proprietaireId: vehicule.proprietaireId,
                marque: vehicule.marque,
                modele: vehicule.modele,
                kilometrage: vehicule.kilometrage,
                immatriculation: vehicule.immatriculation,
                annee: vehicule.annee?.toString() || "",
                couleur: vehicule.couleur || "",
                typeCarburant: vehicule.typeCarburant || "essence"
            });
        } else {
            setVehiculeForm({
                proprietaireId: "",
                marque: "",
                modele: "",
                kilometrage: "",
                immatriculation: "",
                annee: "",
                couleur: "",
                typeCarburant: "essence"
            });
        }
        setShowVehiculeModal(true);
    };

    const openVisiteModal = (vehicule: Vehicule) => {
        setSelectedVehicule(vehicule);
        setVisiteForm({
            clientId: vehicule.proprietaireId,
            vehiculeId: vehicule._id,
            conducteurNom: getClientName(vehicule.proprietaireId),
            conducteurTelephone: "",
            conducteurRelation: "propriétaire",
            services: "",
            montantTotal: "",
            notes: ""
        });
        setShowVisiteModal(true);
    };

    const handleVehiculeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (modalType === "add") {
                await axios.post(`${API_BASE_URL}/vehicules`, vehiculeForm);
                alert("Véhicule ajouté avec succès!");
            } else if (modalType === "edit" && selectedVehicule) {
                await axios.put(`${API_BASE_URL}/vehicules/${selectedVehicule._id}`, vehiculeForm);
                alert("Véhicule modifié avec succès!");
            }
            fetchVehicules();
            setShowVehiculeModal(false);
        } catch (error) {
            setError("Erreur lors de l'opération");
        } finally {
            setLoading(false);
        }
    };

    const handleVisiteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/visites`, {
                ...visiteForm,
                montantTotal: parseFloat(visiteForm.montantTotal),
                services: visiteForm.services.split(',').map(s => s.trim()),
                dateVisite: new Date(),
                statut: "en_cours"
            });
            alert("Visite enregistrée avec succès!");
            fetchVisites();
            setShowVisiteModal(false);
        } catch (error) {
            setError("Erreur lors de l'enregistrement de la visite");
        } finally {
            setLoading(false);
        }
    };

    const deleteVehicule = async (vehicule: Vehicule) => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${vehicule.marque} ${vehicule.modele} ?`)) {
            try {
                await axios.delete(`${API_BASE_URL}/vehicules/${vehicule._id}`);
                fetchVehicules();
                alert("Véhicule supprimé avec succès!");
            } catch (error) {
                alert("Erreur lors de la suppression");
            }
        }
    };

    const getVehiculeVisites = (vehiculeId: string) => {
        return visites.filter(v => v.vehiculeId === vehiculeId);
    };


    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Gestion des Véhicules</h1>
                        <button
                            onClick={() => openVehiculeModal("add")}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Nouveau Véhicule</span>
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                            {error}
                        </div>
                    )}
                </div>

                {/* Liste des Véhicules */}
                <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-2">
                    {vehicules.map((vehicule) => {
                        const vehiculeVisites = getVehiculeVisites(vehicule._id);
                        const derniereVisite = vehiculeVisites.sort((a, b) =>
                            new Date(b.dateVisite).getTime() - new Date(a.dateVisite).getTime()
                        )[0];

                        return (
                            <div key={vehicule._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <Car className="w-8 h-8 text-blue-600" />
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {vehicule.marque} {vehicule.modele}
                                                </h3>
                                                <p className="text-sm text-gray-600">{vehicule.immatriculation}</p>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => openVisiteModal(vehicule)}
                                                className="p-2 text-gray-500 hover:text-green-600 hover:bg-gray-100 rounded-lg"
                                                title="Nouvelle visite"
                                            >
                                                <Calendar className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => openVehiculeModal("edit", vehicule)}
                                                className="p-2 text-gray-500 hover:text-orange-600 hover:bg-gray-100 rounded-lg"
                                                title="Modifier"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => deleteVehicule(vehicule)}
                                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg"
                                                title="Supprimer"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Propriétaire */}
                                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center space-x-2 mb-1">
                                            {getClientType(vehicule.proprietaireId) === "professionnel" ? (
                                                <Building2 className="w-4 h-4 text-blue-600" />
                                            ) : (
                                                <User className="w-4 h-4 text-green-600" />
                                            )}
                                            <span className="font-medium text-gray-900">
                                                {getClientName(vehicule.proprietaireId)}
                                            </span>
                                        </div>
                                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${getClientType(vehicule.proprietaireId) === "professionnel"
                                                ? "bg-blue-100 text-blue-800"
                                                : "bg-green-100 text-green-800"
                                            }`}>
                                            {getClientType(vehicule.proprietaireId) === "professionnel" ? "Professionnel" : "Particulier"}
                                        </span>
                                    </div>

                                    {/* Détails du véhicule */}
                                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-4">
                                        {vehicule.annee && (
                                            <div>
                                                <span className="font-medium">Année:</span> {vehicule.annee}
                                            </div>
                                        )}
                                        {vehicule.couleur && (
                                            <div>
                                                <span className="font-medium">Couleur:</span> {vehicule.couleur}
                                            </div>
                                        )}
                                        {vehicule.typeCarburant && (
                                            <div className="col-span-2">
                                                <span className="font-medium">Carburant:</span> {vehicule.typeCarburant}
                                            </div>
                                        )}
                                    </div>

                                    {/* Dernière visite */}
                                    {derniereVisite && (
                                        <div className="pt-4 border-t border-gray-200">
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Dernière visite:</h4>
                                            <div className="bg-blue-50 p-3 rounded-lg">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center space-x-2">
                                                        <UserCheck className="w-4 h-4 text-blue-600" />
                                                        <span className="text-sm font-medium">{derniereVisite.conducteurNom}</span>
                                                        <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                                                            {derniereVisite.conducteurRelation}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-bold text-green-600">
                                                        {derniereVisite.montantTotal}€
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600">
                                                    {new Date(derniereVisite.dateVisite).toLocaleDateString('fr-FR')}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Nombre de visites */}
                                    <div className="mt-3 text-center">
                                        <span className="text-sm text-gray-500">
                                            {vehiculeVisites.length} visite{vehiculeVisites.length > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Modal Véhicule */}
                {showVehiculeModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-gray-900">
                                        {modalType === "add" ? "Nouveau Véhicule" : "Modifier Véhicule"}
                                    </h2>
                                    <button
                                        onClick={() => setShowVehiculeModal(false)}
                                        className="text-gray-400 hover:text-gray-600 text-2xl"
                                    >
                                        ×
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Propriétaire
                                        </label>
                                        <select
                                            value={vehiculeForm.proprietaireId}
                                            onChange={(e) => setVehiculeForm({ ...vehiculeForm, proprietaireId: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Sélectionnez un client</option>
                                            {clients.map(client => (
                                                <option key={client._id} value={client._id}>
                                                    {client.nom} ({client.type})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Marque</label>
                                            <input
                                                type="text"
                                                value={vehiculeForm.marque}
                                                onChange={(e) => setVehiculeForm({ ...vehiculeForm, marque: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Modèle</label>
                                            <input
                                                type="text"
                                                value={vehiculeForm.modele}
                                                onChange={(e) => setVehiculeForm({ ...vehiculeForm, modele: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Kilométrage (km)
                                            </label>
                                            <input
                                                type="text" // text au lieu de number pour permettre le formatage
                                                value={vehiculeForm.kilometrage}
                                                onChange={(e) => {
                                                    // Autoriser seulement les chiffres et espaces
                                                    const value = e.target.value.replace(/[^0-9\s]/g, '');
                                                    setVehiculeForm({ ...vehiculeForm, kilometrage: value });
                                                }}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                placeholder="Ex: 125000"
                                                maxLength="7" // Max 9,999,999 km
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Immatriculation</label>
                                        <input
                                            type="text"
                                            value={vehiculeForm.immatriculation}
                                            onChange={(e) => setVehiculeForm({ ...vehiculeForm, immatriculation: e.target.value.toUpperCase() })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="AB-123-CD"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Année</label>
                                            <input
                                                type="number"
                                                value={vehiculeForm.annee}
                                                onChange={(e) => setVehiculeForm({ ...vehiculeForm, annee: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                min="1900"
                                                max="2024"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
                                            <input
                                                type="text"
                                                value={vehiculeForm.couleur}
                                                onChange={(e) => setVehiculeForm({ ...vehiculeForm, couleur: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Carburant</label>
                                            <select
                                                value={vehiculeForm.typeCarburant}
                                                onChange={(e) => setVehiculeForm({ ...vehiculeForm, typeCarburant: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="essence">Essence</option>
                                                <option value="diesel">Diesel</option>
                                                <option value="hybride">Hybride</option>
                                                <option value="electrique">Électrique</option>
                                                <option value="gpl">GPL</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex justify-end space-x-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowVehiculeModal(false)}
                                            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => handleVehiculeSubmit(e as any)}
                                            disabled={loading}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                                        >
                                            {modalType === "add" ? "Ajouter" : "Sauvegarder"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Visite */}
                {showVisiteModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-gray-900">Nouvelle Visite</h2>
                                    <button
                                        onClick={() => setShowVisiteModal(false)}
                                        className="text-gray-400 hover:text-gray-600 text-2xl"
                                    >
                                        ×
                                    </button>
                                </div>

                                {selectedVehicule && (
                                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                                        <h3 className="font-medium text-blue-900">
                                            {selectedVehicule.marque} {selectedVehicule.modele}
                                        </h3>
                                        <p className="text-sm text-blue-700">{selectedVehicule.immatriculation}</p>
                                        <p className="text-sm text-blue-600">
                                            Propriétaire: {getClientName(selectedVehicule.proprietaireId)}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nom du conducteur/accompagnant
                                            </label>
                                            <input
                                                type="text"
                                                value={visiteForm.conducteurNom}
                                                onChange={(e) => setVisiteForm({ ...visiteForm, conducteurNom: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Relation</label>
                                            <select
                                                value={visiteForm.conducteurRelation}
                                                onChange={(e) => setVisiteForm({ ...visiteForm, conducteurRelation: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="propriétaire">Propriétaire</option>
                                                <option value="famille">Famille</option>
                                                <option value="employe">Employé</option>
                                                <option value="ami">Ami</option>
                                                <option value="autre">Autre</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                                        <input
                                            type="tel"
                                            value={visiteForm.conducteurTelephone}
                                            onChange={(e) => setVisiteForm({ ...visiteForm, conducteurTelephone: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Services (séparés par des virgules)
                                        </label>
                                        <input
                                            type="text"
                                            value={visiteForm.services}
                                            onChange={(e) => setVisiteForm({ ...visiteForm, services: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Vidange, Révision, Réparation freins..."
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Montant total (€)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={visiteForm.montantTotal}
                                            onChange={(e) => setVisiteForm({ ...visiteForm, montantTotal: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                        <textarea
                                            value={visiteForm.notes}
                                            onChange={(e) => setVisiteForm({ ...visiteForm, notes: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            rows={3}
                                        />
                                    </div>

                                    <div className="flex justify-end space-x-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowVisiteModal(false)}
                                            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => handleVisiteSubmit(e as any)}
                                            disabled={loading}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400"
                                        >
                                            Enregistrer la visite
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}