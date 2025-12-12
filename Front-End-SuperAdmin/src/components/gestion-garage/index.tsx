"use client";
import { useState, useEffect } from 'react';
import { Building2, FileText, Wrench, ChevronRight, Loader2,CreditCard,Settings2 } from 'lucide-react';

// Types
interface Garage {
    _id: string;
    nom: string;
    matriculeFiscal: string;
    phone?: string;
    email?: string;
    address?: string;
}

interface UnifiedGarageDashboardProps {
    DevisComponent: React.ComponentType<{ selectedGarage: string; onNavigate?: () => void }>;
    OrdresComponent: React.ComponentType<{ selectedGarage: Garage; onNavigate?: () => void }>;
    FactureComponent: React.ComponentType<{ selectedGarage: Garage; onNavigate?: () => void }>;
    GarageEtGaragiteTableStatusComponent: React.ComponentType;

    apiBase?: string;
}

const UnifiedGarageDashboard: React.FC<UnifiedGarageDashboardProps> = ({
    DevisComponent,
    OrdresComponent,
    FactureComponent,
    GarageEtGaragiteTableStatusComponent,
    apiBase = 'http://localhost:5000/api'
}) => {
    const [garages, setGarages] = useState<Garage[]>([]);
    const [selectedGarage, setSelectedGarage] = useState<Garage | null>(null);
    const [activeSection, setActiveSection] = useState<'selection' | 'devis' | 'ordres' | 'factures' |'status'>('selection');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadGarages();
    }, []);

    const getAuthToken = () => {
        return localStorage.getItem('token') || sessionStorage.getItem('token');
    };

    const loadGarages = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = getAuthToken();
            if (!token || token === 'null' || token === 'undefined') {
                window.location.href = '/auth/sign-in';
                return;
            }

            const response = await fetch(`${apiBase}/garages`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Erreur lors du chargement des garages');
            }

            const data = await response.json();
            const garagesList = Array.isArray(data) ? data : (data.garages || []);

            setGarages(garagesList);
        } catch (err: any) {
            console.error('❌ Erreur chargement garages:', err);
            setError('Erreur lors du chargement des garages');
        } finally {
            setLoading(false);
        }
    };

    const handleGarageSelect = (garage: Garage) => {
        setSelectedGarage(garage);
        setActiveSection('selection');
    };

    const handleBackToGarages = () => {
        setSelectedGarage(null);
        setActiveSection('selection');
    };

    const handleNavigateToDevis = () => {
        setActiveSection('devis');
    };

    const handleNavigateToOrdres = () => {
        setActiveSection('ordres');
    };

    const handleNavigateToFactures = () => {
        setActiveSection('factures');
    };
    const handleNavigateToStatus = () => {
        setActiveSection('status');
    };

    const handleBackToMenu = () => {
        setActiveSection('selection');
    };

    // Écran de sélection de garage
    if (!selectedGarage) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
                <div className="max-w-9xl mx-auto">
                    {/* Header */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-4 rounded-xl">
                                <Building2 className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-gray-900">
                                    Gestion Centralisée
                                </h1>
                                <p className="text-gray-600 text-lg mt-">
                                    Sélectionnez un garage pour gérer ses devis , ordres , factures et statut
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
                            <p className="text-red-800 font-medium">{error}</p>
                        </div>
                    )}

                    {/* Garages Grid */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
                            <p className="text-gray-600 text-lg">Chargement des garages...</p>
                        </div>
                    ) : garages.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                            <Building2 className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-2xl font-semibold text-gray-700 mb-2">
                                Aucun garage disponible
                            </h3>
                            <p className="text-gray-500">
                                Veuillez créer un garage pour commencer
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {garages.map((garage) => (
                                <button
                                    key={garage._id}
                                    onClick={() => handleGarageSelect(garage)}
                                    className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 text-left group border-2 border-transparent hover:border-blue-500 transform hover:-translate-y-1"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-3 rounded-xl group-hover:from-blue-600 group-hover:to-indigo-600 transition-all duration-300">
                                            <Building2 className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors" />
                                        </div>
                                        <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                        {garage.nom}
                                    </h3>

                                    <div className="space-y-2 text-sm text-gray-600">
                                        <p className="flex items-center gap-2">
                                            <span className="font-medium">MF:</span>
                                            <span>{garage.matriculeFiscal}</span>
                                        </p>
                                        {garage.phone && (
                                            <p className="flex items-center gap-2">
                                                <span className="font-medium">Tél:</span>
                                                <span>{garage.phone}</span>
                                            </p>
                                        )}
                                        {garage.email && (
                                            <p className="flex items-center gap-2 truncate">
                                                <span className="font-medium">Email:</span>
                                                <span className="truncate">{garage.email}</span>
                                            </p>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Menu de sélection (Devis ou Ordres)
    if (activeSection === 'selection') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
                <div className="max-w-9xl mx-auto">
                    {/* Header avec garage sélectionné */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                        <button
                            onClick={handleBackToGarages}
                            className="text-blue-600 hover:text-blue-700 font-medium mb-4 flex items-center gap-2"
                        >
                            ← Retour aux garages
                        </button>

                        <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-4 rounded-xl">
                                <Building2 className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {selectedGarage.nom}
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    {selectedGarage.matriculeFiscal}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Choix des sections */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Carte Devis */}
                        <button
                            onClick={handleNavigateToDevis}
                            className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-left group border-2 border-transparent hover:border-green-500 transform hover:-translate-y-2"
                        >
                            <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-4 rounded-xl mb-6 group-hover:from-green-600 group-hover:to-emerald-600 transition-all duration-300 inline-block">
                                <FileText className="w-12 h-12 text-green-600 group-hover:text-white transition-colors" />
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
                                Gestion des Devis
                            </h2>

                            <p className="text-gray-600 mb-4">
                                Créer, consulter et gérer tous les devis du garage
                            </p>

                            <div className="flex items-center gap-2 text-green-600 font-medium">
                                <span>Accéder</span>
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </button>

                        {/* Carte Ordres */}
                        <button
                            onClick={handleNavigateToOrdres}
                            className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-left group border-2 border-transparent hover:border-purple-500 transform hover:-translate-y-2"
                        >
                            <div className="bg-gradient-to-br from-purple-100 to-indigo-100 p-4 rounded-xl mb-6 group-hover:from-purple-600 group-hover:to-indigo-600 transition-all duration-300 inline-block">
                                <Wrench className="w-12 h-12 text-purple-600 group-hover:text-white transition-colors" />
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">
                                Ordres de Travail
                            </h2>

                            <p className="text-gray-600 mb-4">
                                Suivre et gérer les ordres de travail en cours
                            </p>

                            <div className="flex items-center gap-2 text-purple-600 font-medium">
                                <span>Accéder</span>
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </button>


                        <button
                            onClick={handleNavigateToFactures}
                            className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-left group border-2 border-transparent hover:border-yellow-500 transform hover:-translate-y-2"
                        >
                            <div className="bg-gradient-to-br from-yellow-100 to-indigo-100 p-4 rounded-xl mb-6 group-hover:from-yellow-600 group-hover:to-indigo-600 transition-all duration-300 inline-block">
                                <CreditCard className="w-12 h-12 text-yellow-600 group-hover:text-white transition-colors" />
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-yellow-600 transition-colors">
                                Factures
                            </h2>

                            <p className="text-gray-600 mb-4">
                                Suivre et gérer les Factures
                            </p>

                            <div className="flex items-center gap-2 text-yellow-600 font-medium">
                                <span>Accéder</span>
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </button>

                        <button
                            onClick={handleNavigateToStatus}
                            className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-left group border-2 border-transparent hover:border-pink-500 transform hover:-translate-y-2"
                        >
                            <div className="bg-gradient-to-br from-pink-100 to-indigo-100 p-4 rounded-xl mb-6 group-hover:from-pink-600 group-hover:to-indigo-600 transition-all duration-300 inline-block">
                                <Settings2 className="w-12 h-12 text-pink-600 group-hover:text-white transition-colors" />
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-pink-600 transition-colors">
                                Statut des Garages et Garagistes
                            </h2>

                            <p className="text-gray-600 mb-4">
                                Suivre les statut des garages et garagistes
                            </p>

                            <div className="flex items-center gap-2 text-pink-600 font-medium">
                                <span>Accéder</span>
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Affichage du composant Devis
    if (activeSection === 'devis') {
        return (
            <div>
                <div className="bg-white border-b shadow-sm p-4 mb-6">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <button
                            onClick={handleBackToMenu}
                            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                        >
                            ← Retour au menu
                        </button>
                        <div className="flex items-center gap-3">
                            <Building2 className="w-5 h-5 text-gray-600" />
                            <span className="font-semibold text-gray-900">{selectedGarage.nom}</span>
                        </div>
                    </div>
                </div>
                <DevisComponent
                    selectedGarage={selectedGarage._id}
                    onNavigate={handleBackToMenu}
                />
            </div>
        );
    }

    // Affichage du composant Ordres
    if (activeSection === 'ordres') {
        return (
            <div>
                <div className="bg-white border-b shadow-sm p-4 mb-6">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <button
                            onClick={handleBackToMenu}
                            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                        >
                            ← Retour au menu
                        </button>
                        <div className="flex items-center gap-3">
                            <Building2 className="w-5 h-5 text-gray-600" />
                            <span className="font-semibold text-gray-900">{selectedGarage.nom}</span>
                        </div>
                    </div>
                </div>
                <OrdresComponent
                    selectedGarage={selectedGarage}
                    onNavigate={handleBackToMenu}
                />
            </div>
        );
    }

    if (activeSection === 'factures') {
        return (
            <div>
                <div className="bg-white border-b shadow-sm p-4 mb-6">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <button
                            onClick={handleBackToMenu}
                            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                        >
                            ← Retour au menu
                        </button>
                        <div className="flex items-center gap-3">
                            <Building2 className="w-5 h-5 text-gray-600" />
                            <span className="font-semibold text-gray-900">{selectedGarage.nom}</span>
                        </div>
                    </div>
                </div>
                <FactureComponent
                    selectedGarage={selectedGarage}
                    onNavigate={handleBackToMenu}
                />
            </div>
        );
    }

        if (activeSection === 'status') {
        return (
            <div>
                <div className="bg-white border-b shadow-sm p-4 mb-6">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <button
                            onClick={handleBackToMenu}
                            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                        >
                            ← Retour au menu
                        </button>
                        <div className="flex items-center gap-3">
                            <Building2 className="w-5 h-5 text-gray-600" />
                            <span className="font-semibold text-gray-900">{selectedGarage.nom}</span>
                        </div>
                    </div>
                </div>
                <GarageEtGaragiteTableStatusComponent
                />
            </div>
        );
    }

    return null;
};

export default UnifiedGarageDashboard;