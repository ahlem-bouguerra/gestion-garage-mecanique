"use client"
import React, { useState, useEffect } from 'react';
import { Car, Plus, Edit, Trash2, User, Building2, Search, X, Calendar, BookOpen, Phone, UserCheck, AlertTriangle, CheckCircle, Pen } from 'lucide-react';
import axios from 'axios';

import { useSearchParams, useRouter } from 'next/navigation';
import { useGlobalAlert } from "@/components/ui-elements/AlertProvider";
import { useConfirm } from "@/components/ui-elements/ConfirmProvider";



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
    carteGrise?: {
        numeroCG: string;
        numeroChassis: string;
        dateMiseCirculation: Date;
        puissanceFiscale: number;
        genre: 'VP' | 'VU' | 'MOTO';
        nombrePlaces: number;
        dateVisite?: Date;
        dateProchaineVisite?: Date;
    };
}

interface Client {
    _id: string;
    nom: string;
    type: "particulier" | "professionnel";
    telephone?: string;
    email?: string;
}

interface Visite {
    _id: string;
    clientId: string;
    vehiculeId: string;
    conducteurNom: string;
    conducteurTelephone?: string;
    conducteurRelation: string;
    dateVisite: Date;
    kilometrageVisite?: number;
    services: string[];
    montantTotal: number;
    statut: "en_cours" | "terminee" | "annulee";
    notes?: string;
}

interface VehiculeFormData {
    proprietaireId: string;
    marque: string;
    kilometrage: string;
    modele: string;
    immatriculation: string;
    annee: string;
    couleur: string;
    typeCarburant: string;
    carteGrise?: {
        numeroCG: string;
        numeroChassis: string;
        dateMiseCirculation: string;
        puissanceFiscale: string;
        genre: string;
        nombrePlaces: string;
        dateVisite: string;
        dateProchaineVisite: string;
    };
}

interface ValidationError {
    field: string;
    message: string;
    type: 'error' | 'warning' | 'success';
}

interface FieldValidation {
    isValid: boolean;
    message: string;
    type: 'error' | 'warning' | 'success';
}

interface CountryImmatRule {
    code: string;
    name: string;
    patterns: RegExp[];
    examples: string[];
    description: string;
}

class SmartImmatriculationValidator {
    private static countries: CountryImmatRule[] = [
        {
            code: 'TN',
            name: 'Tunisie',
            patterns: [
                /^[0-9]{1,4}TUN[0-9]{1,4}$/,           // 123TUN456
                /^TUN[0-9]{3,6}$/,                      // TUN12345
                /^[0-9]{1,4}-TUN-[0-9]{1,4}$/,         // 123-TUN-456
                /^[0-9]{6,8}$/                          // 12345678 (ancien format)
            ],
            examples: ['123TUN456', 'TUN12345', '123-TUN-456'],
            description: 'Format tunisien'
        },
    ];

    static validateImmatriculationFlexible(immat: string, countryCode?: 'TN' | 'OTHER'): FieldValidation {
        if (!immat.trim()) {
            return { isValid: false, message: 'Immatriculation obligatoire', type: 'error' };
        }

        const cleanImmat = immat.trim().toUpperCase().replace(/[\s]/g, '');

        // Si pays spécifique TN ou FR, validation stricte
        if (countryCode === 'TN') {
            const country = this.countries.find(c => c.code === countryCode);
            if (!country) {
                return { isValid: false, message: 'Pays non supporté', type: 'error' };
            }

            const isValid = country.patterns.some(pattern => pattern.test(cleanImmat));
            return {
                isValid,
                message: isValid
                    ? `Format ${country.description} valide`
                    : `Format ${country.description} invalide. Exemples: ${country.examples.join(', ')}`,
                type: isValid ? 'success' : 'error'
            };
        }

        // Si "OTHER" ou pas de pays, validation flexible
        // Vérifier d'abord si ça correspond à TN ou FR
        for (const country of this.countries) {
            const isValid = country.patterns.some(pattern => pattern.test(cleanImmat));
            if (isValid) {
                return {
                    isValid: true,
                    message: `Format ${country.description} détecté`,
                    type: 'success'
                };
            }
        }

        // Si pas TN ou FR, accepter comme texte libre avec validation basique
        if (cleanImmat.length < 3) {
            return { isValid: false, message: 'Immatriculation trop courte (min 3 caractères)', type: 'error' };
        }

        if (cleanImmat.length > 15) {
            return { isValid: false, message: 'Immatriculation trop longue (max 15 caractères)', type: 'error' };
        }

        // Accepter seulement lettres, chiffres et tirets
        if (!/^[A-Z0-9-]+$/.test(cleanImmat)) {
            return { isValid: false, message: 'Caractères invalides (seulement lettres, chiffres, tirets)', type: 'error' };
        }

        return {
            isValid: true,
            message: 'Format libre accepté',
            type: 'success'
        };
    }

    static detectCountryFromImmatriculation(immat: string): 'TN' | 'FR' | 'OTHER' {
        const cleanImmat = immat.trim().toUpperCase().replace(/[\s]/g, '');

        for (const country of this.countries) {
            const matches = country.patterns.some(pattern => pattern.test(cleanImmat));
            if (matches) {
                return country.code as 'TN' | 'FR';
            }
        }
        return 'OTHER';
    }
}

class FormValidator {
    // Validation email
    static validateEmail(email: string): FieldValidation {
        if (!email.trim()) {
            return { isValid: true, message: '', type: 'success' }; // Email optionnel
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(email.trim());

        return {
            isValid,
            message: isValid ? 'Email valide' : 'Format d\'email invalide (ex: nom@domaine.com)',
            type: isValid ? 'success' : 'error'
        };
    }

    // Validation téléphone (français et tunisien)
    static validatePhone(phone: string): FieldValidation {
        if (!phone.trim()) {
            return { isValid: true, message: '', type: 'success' }; // Téléphone optionnel
        }

        // Nettoyer le numéro (enlever espaces, tirets, points)
        const cleanPhone = phone.replace(/[\s\-\.]/g, '');

        // Formats acceptés:

        // Tunisie: 12345678, 21612345678, +21612345678, 0021612345678
        const phoneRegexes = [
            /^[2-9]\d{7}$/, // Format tunisien 8 chiffres
            /^(\+216|00216|216)[2-9]\d{7}$/ // Format tunisien international
        ];

        const isValid = phoneRegexes.some(regex => regex.test(cleanPhone));

        return {
            isValid,
            message: isValid ? 'Numéro valide' : 'Format invalide (ex: 12 345 678)',
            type: isValid ? 'success' : 'error'
        };
    }



    static validateImmatriculation(immat: string, selectedCountry?: 'TN' | 'FR' | 'OTHER'): FieldValidation {
        return SmartImmatriculationValidator.validateImmatriculationFlexible(immat, selectedCountry);
    }

    // ✅ AJOUTER CETTE NOUVELLE MÉTHODE
    static detectImmatriculationCountry(immat: string): 'TN' | 'FR' | 'OTHER' {
        return SmartImmatriculationValidator.detectCountryFromImmatriculation(immat);
    }



    // Validation longueur champs texte
    static validateTextLength(text: string, minLength: number, maxLength: number, fieldName: string): FieldValidation {
        const trimmedText = text.trim();
        const length = trimmedText.length;

        if (length === 0) {
            return { isValid: false, message: `${fieldName} obligatoire`, type: 'error' };
        }

        if (length < minLength) {
            return { isValid: false, message: `${fieldName} trop court (min ${minLength} caractères)`, type: 'error' };
        }

        if (length > maxLength) {
            return { isValid: false, message: `${fieldName} trop long (max ${maxLength} caractères)`, type: 'error' };
        }

        return { isValid: true, message: `${length}/${maxLength} caractères`, type: 'success' };
    }

    // Validation année
    static validateYear(year: string): FieldValidation {
        if (!year.trim()) {
            return { isValid: true, message: 'Optionnel', type: 'success' };
        }

        const yearNum = parseInt(year);
        const currentYear = new Date().getFullYear();

        if (isNaN(yearNum)) {
            return { isValid: false, message: 'Année doit être un nombre', type: 'error' };
        }

        if (yearNum < 1900) {
            return { isValid: false, message: 'Année trop ancienne (min 1900)', type: 'error' };
        }

        if (yearNum > currentYear + 1) {
            return { isValid: false, message: `Année future non autorisée (max ${currentYear + 1})`, type: 'error' };
        }

        return { isValid: true, message: 'Année valide', type: 'success' };
    }




    // Validation montant
    static validateAmount(amount: string): FieldValidation {
        if (!amount.trim()) {
            return { isValid: false, message: 'Montant obligatoire', type: 'error' };
        }

        const amountNum = parseFloat(amount);

        if (isNaN(amountNum)) {
            return { isValid: false, message: 'Doit être un nombre', type: 'error' };
        }

        if (amountNum < 0) {
            return { isValid: false, message: 'Ne peut pas être négatif', type: 'error' };
        }

        if (amountNum > 50000) {
            return {
                isValid: true,
                message: 'Montant très élevé, vérifiez',
                type: 'warning'
            };
        }
        // 5️⃣ Formatage avec points pour milliers et 3 décimales
        const formattedAmount = amountNum
            .toFixed(3)                         // 3 décimales
            .replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // point tous les 3 chiffres

        return {
            isValid: true,
            message: `${formattedAmount} TND`,
            type: 'success'
        };
    }
}

interface ValidatedFieldProps {
    label: string;
    type?: string;
    value: string;
    onChange: (value: string) => void;
    validation?: FieldValidation;
    required?: boolean;
    placeholder?: string;
    maxLength?: number;
    children?: React.ReactNode; // Pour les selects
}

const ValidatedField: React.FC<ValidatedFieldProps> = ({
    label,
    type = "text",
    value,
    onChange,
    validation,
    required = false,
    placeholder,
    maxLength,
    children
}) => {
    const safeValue = value ?? "";
    const getValidationColor = () => {
        if (!validation) return 'border-gray-300';

        switch (validation.type) {
            case 'error': return 'border-red-500 focus:ring-red-500';
            case 'warning': return 'border-yellow-500 focus:ring-yellow-500';
            case 'success': return 'border-green-500 focus:ring-green-500';
            default: return 'border-gray-300';
        }
    };

    const getValidationIcon = () => {
        if (!validation || !validation.message) return null;

        switch (validation.type) {
            case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
            case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
            default: return null;
        }
    };

    const getValidationTextColor = () => {
        if (!validation) return 'text-gray-600';

        switch (validation.type) {
            case 'error': return 'text-red-600';
            case 'warning': return 'text-yellow-600';
            case 'success': return 'text-green-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            <div className="relative">
                {children ? (
                    <select
                        value={safeValue}
                        onChange={(e) => onChange(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${getValidationColor()}`}
                    >
                        {children}
                    </select>
                ) : (
                    <input
                        type={type}
                        value={safeValue}
                        onChange={(e) => onChange(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent pr-10 ${getValidationColor()}`}
                        placeholder={placeholder}
                        maxLength={maxLength}
                    />
                )}

                {/* Icône de validation */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {getValidationIcon()}
                </div>
            </div>

            {/* Message de validation */}
            {validation?.message && (
                <p className={`text-xs mt-1 flex items-center space-x-1 ${getValidationTextColor()}`}>
                    <span>{validation.message}</span>
                </p>
            )}
        </div>
    );
};

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
    const [selectedCountry, setSelectedCountry] = useState<'TN' | 'FR' | 'OTHER'>('OTHER');
    const searchParams = useSearchParams();
    const router = useRouter();
    const preselectedClientId = searchParams.get('clientId');
    const preselectedClientName = searchParams.get('clientName');
    const [preselectionMessage, setPreselectionMessage] = useState<string>("");
    const [existingImmatriculations, setExistingImmatriculations] = useState<string[]>([]);
    const [vehiculeForm, setVehiculeForm] = useState<VehiculeFormData>({ proprietaireId: "", marque: "", modele: "", kilometrage: "", immatriculation: "", annee: "", couleur: "", typeCarburant: "essence" });
    const [vehiculeValidations, setVehiculeValidations] = useState<{ [key: string]: FieldValidation }>({});
    const [visiteValidations, setVisiteValidations] = useState<{ [key: string]: FieldValidation }>({});
    const [rechercheGlobale, setRechercheGlobale] = useState("");
    const [vehiculesFiltres, setVehiculesFiltres] = useState<Vehicule[]>([]);
    const { showAlert } = useGlobalAlert();
    const { confirm } = useConfirm();


    const getAuthToken = () => {
        return localStorage.getItem('token') || sessionStorage.getItem('token');
    };

    useEffect(() => {
        if (!rechercheGlobale.trim()) {
            setVehiculesFiltres(vehicules);
            return;
        }

        const termesRecherche = rechercheGlobale.toLowerCase().trim();

        const vehiculesFiltrés = vehicules.filter(v => {isVehiculeFormValid
            // Recherche dans l'immatriculation
            const matchImmat = v.immatriculation.toLowerCase().includes(termesRecherche);

            // Recherche dans la marque
            const matchMarque = v.marque.toLowerCase().includes(termesRecherche);

            // Recherche dans le modèle
            const matchModele = v.modele.toLowerCase().includes(termesRecherche);

            // Recherche dans le nom du propriétaire
            const nomProprietaire = getClientName(v.proprietaireId).toLowerCase();
            const matchProprietaire = nomProprietaire.includes(termesRecherche);

            // Recherche dans la couleur (si elle existe)
            const matchCouleur = v.couleur ? v.couleur.toLowerCase().includes(termesRecherche) : false;

            // Retourner true si au moins un critère correspond
            return matchImmat || matchMarque || matchModele || matchProprietaire || matchCouleur;
        });

        setVehiculesFiltres(vehiculesFiltrés);
    }, [vehicules, rechercheGlobale, clients]);

    const reinitialiserRecherche = () => {
        setRechercheGlobale("");
    };


    useEffect(() => {
        const header = document.querySelector('header');
        if (!header) return;

        if (showVehiculeModal) {
            header.classList.add("hidden");
        } else {
            header.classList.remove("hidden");
        }
    }, [showVehiculeModal]);

    useEffect(() => {
        fetchClients();
        fetchVehicules();
    }, []);

    useEffect(() => {
        const immatriculations = vehicules.map(v => v.immatriculation.toUpperCase());
        setExistingImmatriculations(immatriculations);
    }, [vehicules]);


    useEffect(() => {
        const newValidations: { [key: string]: FieldValidation } = {};
        if (!vehiculeForm.proprietaireId) {
            newValidations.proprietaireId = { isValid: false, message: 'Propriétaire obligatoire', type: 'error' };
        } else {
            newValidations.proprietaireId = { isValid: true, message: 'Propriétaire sélectionné', type: 'success' };
        }
        newValidations.marque = FormValidator.validateTextLength(vehiculeForm.marque, 2, 50, 'Marque');
        newValidations.modele = FormValidator.validateTextLength(vehiculeForm.modele, 1, 50, 'Modèle');
        const immatValidation = FormValidator.validateImmatriculation(vehiculeForm.immatriculation, selectedCountry);
        if (selectedCountry === 'OTHER' && vehiculeForm.immatriculation.length > 5) {
            const detectedCountry = FormValidator.detectImmatriculationCountry(vehiculeForm.immatriculation);
            if (detectedCountry !== 'OTHER') {
                immatValidation.message += ` (${detectedCountry === 'TN' ? 'Tunisie' : 'France'} détecté)`;
            }
        }
        if (immatValidation.isValid) {
            const cleanImmat = vehiculeForm.immatriculation.trim().toUpperCase().replace(/[\s\-]/g, '');
            const currentVehiculeImmat = selectedVehicule?.immatriculation.toUpperCase().replace(/[\s\-]/g, '');
            if (existingImmatriculations.includes(cleanImmat) && cleanImmat !== currentVehiculeImmat) {
                newValidations.immatriculation = {
                    isValid: false,
                    message: 'Cette immatriculation existe déjà',
                    type: 'error'
                };
            } else {
                newValidations.immatriculation = immatValidation;
            }
        } else {
            newValidations.immatriculation = immatValidation;
        }


        // Validation année
        newValidations.annee = FormValidator.validateYear(vehiculeForm.annee);

        // Validation couleur (optionnelle)
        if (vehiculeForm.couleur.trim()) {
            newValidations.couleur = FormValidator.validateTextLength(vehiculeForm.couleur, 2, 30, 'Couleur');
        } else {
            newValidations.couleur = { isValid: true, message: 'Optionnel', type: 'success' };
        }




        setVehiculeValidations(newValidations);
    }, [vehiculeForm, existingImmatriculations, selectedVehicule, selectedCountry]);


    const showError = (message: string) => {
        console.error("❌ Erreur:", message);
        setError(typeof message === 'string' ? message : 'Une erreur est survenue');
        setTimeout(() => setError(""), 5000);
    };


    const fetchClients = async () => {
        try {

            const token = getAuthToken();
      
            // ⭐ VÉRIFICATION CRITIQUE
            if (!token || token === 'null' || token === 'undefined') {
                console.error('❌ Aucun token valide trouvé');
                // Rediriger vers le login
                window.location.href = '/auth/sign-in';
                return;
            }
            setError("");
            const response = await axios.get(`${API_BASE_URL}/clients/noms`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("🔍 Clients reçus:", response.data);

            if (Array.isArray(response.data)) {
                setClients(response.data);
                console.log("✅ Clients chargés:", response.data.length);
            } else {
                console.error("❌ Format de données incorrect:", response.data);
                showError("Format de données clients incorrect");
            }
        } catch (error: any) {
            console.error("❌ Erreur lors du chargement des clients:", error);
            showError(`Erreur chargement clients: ${error.response?.data?.error || error.message}`);
        }
    };

    const fetchVehicules = async () => {
        try {
            const token = getAuthToken();
      
            // ⭐ VÉRIFICATION CRITIQUE
            if (!token || token === 'null' || token === 'undefined') {
                console.error('❌ Aucun token valide trouvé');
                // Rediriger vers le login
                window.location.href = '/auth/sign-in';
                return;
            }
            setError("");
            const response = await axios.get(`${API_BASE_URL}/vehicules`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVehicules(response.data);
        } catch (error: any) {
            console.error("❌ Erreur lors du chargement des véhicules:", error);
            showError(`Erreur chargement véhicules: ${error.response?.data?.error || error.message}`);
        }
    };

    useEffect(() => {
        const preselectedData = sessionStorage.getItem('preselectedClient');

        if (preselectedData && clients.length > 0) {
            try {
                const { id, nom } = JSON.parse(preselectedData);
                const clientExists = clients.find(c => c._id === id);

                if (clientExists) {
                    setVehiculeForm(prev => ({ ...prev, proprietaireId: id }));
                    setTimeout(() => {
                        setModalType("add");
                        setSelectedVehicule(null);
                        setShowVehiculeModal(true);
                        setPreselectionMessage(`Client "${nom}" présélectionné automatiquement`);
                        setTimeout(() => setPreselectionMessage(""), 5000);
                    }, 100);
                    sessionStorage.removeItem('preselectedClient');
                }
            } catch (error) {
                sessionStorage.removeItem('preselectedClient');
            }
        }
    }, [clients]);


    const getClientName = (clientData: string | any) => {
        console.log("🔍 Recherche client ID/Data:", clientData);
        console.log("🔍 Clients disponibles:", clients.length);

        if (typeof clientData === 'object' && clientData?.nom) {
            console.log("🔍 Client trouvé directement:", clientData.nom);
            return clientData.nom;
        }

        const clientId = typeof clientData === 'object' ? clientData?._id : clientData;
        const client = clients.find(c => c._id === clientId);
        console.log("🔍 Client trouvé:", client?.nom || 'Non trouvé');

        return client ? client.nom : "Client inconnu";
    };

    const getClientType = (clientData: string | any) => {
        if (typeof clientData === 'object' && clientData?.type) {
            return clientData.type;
        }

        const clientId = typeof clientData === 'object' ? clientData?._id : clientData;
        const client = clients.find(c => c._id === clientId);
        return client ? client.type : "particulier";
    };

    const getClientNumero = (clientData: string | any) => {
        if (typeof clientData === 'object' && clientData?.telephone) {
            return clientData.telephone;
        }

        const clientId = typeof clientData === 'object' ? clientData?._id : clientData;
        const client = clients.find(c => c._id === clientId);
        return client ? client.type : "telephone inconnu";
    };

    const isVehiculeFormValid = () => {
        const requiredFields = ['proprietaireId', 'marque', 'modele', 'immatriculation'];



        // Vérifier qu'il n'y a pas d'erreurs de validation
        const validationErrors = Object.values(vehiculeValidations).filter(v => !v.isValid);
        return validationErrors.length === 0;
    };

    const openVehiculeModal = (type: "add" | "edit", vehicule: Vehicule | null = null) => {
        setError("");
        setModalType(type);
        setSelectedCountry('OTHER');

        if (vehicule) {
            // MODE ÉDITION - Remplir le formulaire avec les données existantes
            setSelectedVehicule(vehicule);

            setVehiculeForm({
                proprietaireId: vehicule.proprietaireId,
                marque: vehicule.marque,
                modele: vehicule.modele,
                immatriculation: vehicule.immatriculation,
                kilometrage: vehicule.kilometrage ? vehicule.kilometrage.toString() : "",
                annee: vehicule.annee ? vehicule.annee.toString() : "",
                couleur: vehicule.couleur || "",
                typeCarburant: vehicule.typeCarburant || "essence",
                carteGrise: vehicule.carteGrise ? {
                    numeroCG: vehicule.carteGrise.numeroCG || "",
                    numeroChassis: vehicule.carteGrise.numeroChassis || "",
                    dateMiseCirculation: vehicule.carteGrise.dateMiseCirculation
                        ? new Date(vehicule.carteGrise.dateMiseCirculation).toISOString().split('T')[0]
                        : "",
                    puissanceFiscale: vehicule.carteGrise.puissanceFiscale?.toString() || "",
                    genre: vehicule.carteGrise.genre || "VP",
                    nombrePlaces: vehicule.carteGrise.nombrePlaces?.toString() || "5",
                    dateVisite: vehicule.carteGrise.dateVisite
                        ? new Date(vehicule.carteGrise.dateVisite).toISOString().split('T')[0]
                        : "",
                    dateProchaineVisite: vehicule.carteGrise.dateProchaineVisite
                        ? new Date(vehicule.carteGrise.dateProchaineVisite).toISOString().split('T')[0]
                        : ""
                } : undefined
            });

            // Détecter le pays d'immatriculation
            const detectedCountry = FormValidator.detectImmatriculationCountry(vehicule.immatriculation);
            setSelectedCountry(detectedCountry);

        } else {
            // MODE AJOUT - Formulaire vide
            setSelectedVehicule(null);

            // Gérer la présélection client si elle existe
            const initialProprietaireId = preselectedClientId;

            setVehiculeForm({
                proprietaireId: initialProprietaireId,
                marque: "",
                modele: "",
                kilometrage: "",
                immatriculation: "",
                annee: "",
                couleur: "",
                typeCarburant: "essence",
                carteGrise: {
                    numeroCG: "",
                    numeroChassis: "",
                    dateMiseCirculation: "",
                    puissanceFiscale: "",
                    genre: "VP",
                    nombrePlaces: "5",
                    dateVisite: "",
                    dateProchaineVisite: ""
                }
            });

            // Message de présélection
            if (preselectedClientId && preselectedClientName) {
                setPreselectionMessage(`Client "${decodeURIComponent(preselectedClientName)}" présélectionné`);
                setTimeout(() => setPreselectionMessage(""), 5000);
            }
        }

        setShowVehiculeModal(true);
    };

    const openVisiteModal = (vehicule: Vehicule) => {
        setError("");
        setSelectedVehicule(vehicule);
        setShowVisiteModal(true);
    };

const handleVehiculeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ VALIDATION FINALE AVANT SOUMISSION
    if (!isVehiculeFormValid()) {
        showError("Veuillez corriger les erreurs dans le formulaire");
        return;
    }

    setLoading(true);
    setError("");

    try {
        const token = getAuthToken();
        // ⭐ VÉRIFICATION CRITIQUE
        if (!token || token === 'null' || token === 'undefined') {
            // Rediriger vers le login
            window.location.href = '/auth/sign-in';
            return;
        }
        
        const submitData = {
            marque: vehiculeForm.marque.trim(),
            modele: vehiculeForm.modele.trim(),
            immatriculation: vehiculeForm.immatriculation.trim().toUpperCase(),
            annee: vehiculeForm.annee ? parseInt(vehiculeForm.annee) : undefined,
            couleur: vehiculeForm.couleur.trim() || undefined,
            typeCarburant: vehiculeForm.typeCarburant,
            kilometrage: vehiculeForm.kilometrage ? parseInt(vehiculeForm.kilometrage.replace(/\s/g, '')) : undefined,
            carteGrise: vehiculeForm.carteGrise?.numeroCG || vehiculeForm.carteGrise?.numeroChassis ? {
                numeroCG: vehiculeForm.carteGrise.numeroCG?.trim() || undefined,
                numeroChassis: vehiculeForm.carteGrise.numeroChassis?.trim() || undefined,
                dateMiseCirculation: vehiculeForm.carteGrise.dateMiseCirculation || undefined,
                puissanceFiscale: vehiculeForm.carteGrise.puissanceFiscale ? parseInt(vehiculeForm.carteGrise.puissanceFiscale) : undefined,
                genre: vehiculeForm.carteGrise.genre || undefined,
                nombrePlaces: vehiculeForm.carteGrise.nombrePlaces ? parseInt(vehiculeForm.carteGrise.nombrePlaces) : undefined,
                dateVisite: vehiculeForm.carteGrise.dateVisite || undefined,
                dateProchaineVisite: vehiculeForm.carteGrise.dateProchaineVisite || undefined
            } : undefined
        };

        console.log("📤 Données à envoyer:", submitData);

        if (modalType === "add") {
            submitData.proprietaireId = vehiculeForm.proprietaireId;
            await axios.post(`${API_BASE_URL}/vehicules`, submitData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showAlert("success", "Véhicule ajouté", "Véhicule ajouté avec succès !");
        } 
        else if (modalType === "edit" && selectedVehicule) {
            await axios.put(`${API_BASE_URL}/vehicules/${selectedVehicule._id}`, submitData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showAlert("success", "Véhicule modifié", "Véhicule modifié avec succès !");
        }

        fetchVehicules();
        setShowVehiculeModal(false);

    } catch (error: any) {
        
        // ⭐ VÉRIFICATION DES ERREURS D'AUTORISATION
        if (error.response?.status === 403) {
            showAlert("error", "Accès refusé", "Vous n'avez pas la permission");
            return;
        }
        
        if (error.response?.status === 401) {
            showAlert("warning", "Session expirée", "Veuillez vous reconnecter");
            window.location.href = '/auth/sign-in';
            return;
        }

        
        
    } finally {
        setLoading(false);
    }
};

const deleteVehicule = async (vehicule: Vehicule) => {
   
    const isConfirmed = await confirm({
    title: "Suppression du véhicule",
    message: `Êtes-vous sûr de vouloir supprimer ${vehicule.marque} ${vehicule.modele} ? Cette action est irréversible.`,
    confirmText: "Supprimer",
    cancelText: "Annuler",
  });

  if (!isConfirmed) return;
        try {
            const token = getAuthToken();
  
            // ⭐ VÉRIFICATION CRITIQUE
            if (!token || token === 'null' || token === 'undefined') {
                window.location.href = '/auth/sign-in';
                return;
            }
            
            await axios.delete(`${API_BASE_URL}/vehicules/${vehicule._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            fetchVehicules();
            showAlert("success", "Véhicule supprimé", "Véhicule supprimé avec succès!");
            
        } catch (error: any) {

            
            // ⭐ VÉRIFICATION DES ERREURS D'AUTORISATION
            if (error.response?.status === 403) {
                showAlert("error", "Accès refusé", "Vous n'avez pas la permission");
                return;
            }
            
            if (error.response?.status === 401) {
                showAlert("warning", "Session expirée", "Veuillez vous reconnecter");
                window.location.href = '/auth/sign-in';
                return;
            }
            
            const errorMessage = error.response?.data?.error || error.message;
            showError(`Erreur suppression: ${errorMessage}`);
        }
    
};

    const getVehiculeVisites = (vehiculeId: string) => {
        return visites.filter(v => v.vehiculeId === vehiculeId);
    };

    const formatKilometrage = (value: string) => {
        const numericValue = value.replace(/[^0-9]/g, '');
        if (numericValue) {
            return parseInt(numericValue).toLocaleString('fr-FR');
        }
        return '';
    };

    return (
        <div className="min-h-screen p-6">
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

                    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                        <div className="flex items-center space-x-4">
                            {/* Input de recherche global */}
                            <div className="flex-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Rechercher par immatriculation, marque, modèle, propriétaire, couleur..."
                                    value={rechercheGlobale}
                                    onChange={(e) => setRechercheGlobale(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* Bouton réinitialiser */}
                            {rechercheGlobale && (
                                <button
                                    onClick={() => setRechercheGlobale("")}
                                    className="px-3 py-2 text-sm text-gray-500 hover:text-blue-600 hover:bg-gray-50 rounded-lg"
                                >
                                    Effacer
                                </button>
                            )}

                            {/* Compteur de résultats */}
                            <div className="text-sm text-gray-600 whitespace-nowrap">
                                {vehiculesFiltres.length} résultat{vehiculesFiltres.length > 1 ? 's' : ''}
                                {rechercheGlobale && vehiculesFiltres.length !== vehicules.length && (
                                    <span className="text-gray-400"> sur {vehicules.length}</span>
                                )}
                            </div>
                        </div>
                    </div>


                    {/* ✅ AFFICHAGE DES ERREURS AMÉLIORÉ */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <AlertTriangle className="h-5 w-5 text-red-400" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium">{error}</p>
                                </div>
                                <div className="ml-auto pl-3">
                                    <button
                                        onClick={() => setError("")}
                                        className="inline-flex text-red-400 hover:text-red-600"
                                    >
                                        <span className="sr-only">Fermer</span>
                                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {preselectionMessage && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm">{preselectionMessage}</span>
                        </div>
                    </div>
                )}

                {/* Liste des Véhicules */}
                <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-2">
                    {vehiculesFiltres.map((vehicule) => {
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
                                                onClick={() => router.push(`/gestion-carnet-entretien?vehiculeId=${vehicule._id}`)}
                                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                                title="Voir Carnet d'Entretien"
                                            >
                                                <BookOpen className="w-4 h-4" />
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
                                                <span className="font-medium">Année:</span> {String(vehicule.annee)}
                                            </div>
                                        )}
                                        {vehicule.couleur && (
                                            <div>
                                                <span className="font-medium">Couleur:</span> {String(vehicule.couleur)}
                                            </div>
                                        )}
                                        {vehicule.typeCarburant && (
                                            <div className="col-span-2">
                                                <span className="font-medium">Carburant:</span> {String(vehicule.typeCarburant)}
                                            </div>
                                        )}
                                        {vehicule.kilometrage && (
                                            <div className="col-span-2">
                                                <span className="font-medium">Kilométrage:</span> {Number(vehicule.kilometrage).toLocaleString('fr-FR')} km
                                            </div>
                                        )}
                                    </div>
                                    {/* Carte Grise */}
                                    {vehicule.carteGrise && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">📄 Carte Grise</h4>
                                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                                <div><span className="font-medium">N° CG:</span> {vehicule.carteGrise.numeroCG}</div>
                                                <div><span className="font-medium">Châssis:</span> {vehicule.carteGrise.numeroChassis}</div>
                                                <div><span className="font-medium">Mise en circ.:</span> {new Date(vehicule.carteGrise.dateMiseCirculation).toLocaleDateString('fr-FR')}</div>
                                                <div><span className="font-medium">Puissance:</span> {vehicule.carteGrise.puissanceFiscale} CV</div>
                                                {vehicule.carteGrise.dateProchaineVisite && (
                                                    <div className="col-span-2">
                                                        <span className="font-medium">Prochaine visite:</span>{' '}
                                                        {new Date(vehicule.carteGrise.dateProchaineVisite).toLocaleDateString('fr-FR')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}


                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ✅ MODAL VÉHICULE AVEC VALIDATION */}
                {showVehiculeModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-3xl w-full max-h-screen overflow-y-auto">
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

                                {/* ✅ INDICATEUR DE VALIDATION GLOBALE */}
                                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">État du formulaire:</span>
                                        <div className="flex items-center space-x-2">
                                            {isVehiculeFormValid() ? (
                                                <>
                                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                                    <span className="text-sm text-green-600 font-medium">Prêt à soumettre</span>
                                                </>
                                            ) : (
                                                <>
                                                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                                    <span className="text-sm text-yellow-600 font-medium">Veuillez corriger les erreurs</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleVehiculeSubmit}>
                                    <div className="space-y-6">
                                        <ValidatedField
                                            label="Propriétaire"
                                            value={vehiculeForm.proprietaireId}
                                            onChange={(value) => {
                                                console.log("Propriétaire sélectionné:", value);
                                                setVehiculeForm({ ...vehiculeForm, proprietaireId: value });
                                            }}
                                            validation={vehiculeValidations.proprietaireId}
                                            required
                                        >
                                            <option value="">-- Sélectionner un propriétaire --</option>
                                            {clients.map((client) => (
                                                <option
                                                    key={client._id}
                                                    value={client._id}
                                                >
                                                    {client.nom} ({client.type})
                                                </option>
                                            ))}
                                        </ValidatedField>

                                        {/* Pays d'immatriculation */}
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Pays d'immatriculation
                                            </label>
                                            <select
                                                value={selectedCountry}
                                                onChange={(e) => setSelectedCountry(e.target.value as 'TN' | 'FR' | 'OTHER')}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="OTHER">🌍 Autre pays (format libre)</option>
                                                <option value="TN">🇹🇳 Tunisie</option>
                                            </select>
                                        </div>




                                        {/* Première ligne : Marque, Modèle, Kilométrage */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <ValidatedField
                                                label="Marque"
                                                value={vehiculeForm.marque}
                                                onChange={(value) => setVehiculeForm({ ...vehiculeForm, marque: value })}
                                                validation={vehiculeValidations.marque}
                                                required
                                                maxLength={50}
                                                placeholder="Ex: Peugeot"
                                            />

                                            <ValidatedField
                                                label="Modèle"
                                                value={vehiculeForm.modele}
                                                onChange={(value) => setVehiculeForm({ ...vehiculeForm, modele: value })}
                                                validation={vehiculeValidations.modele}
                                                required
                                                maxLength={50}
                                                placeholder="Ex: 308"
                                            />

                                            <ValidatedField
                                                label="Kilométrage (km)"
                                                value={vehiculeForm.kilometrage}
                                                onChange={(value) => {
                                                    const formatted = formatKilometrage(value);
                                                    setVehiculeForm({ ...vehiculeForm, kilometrage: formatted });
                                                }}
                                                validation={vehiculeValidations.kilometrage}
                                                placeholder="Ex: 125 000"
                                                maxLength={10}
                                            />
                                        </div>

                                        {/* Immatriculation */}
                                        <ValidatedField
                                            label="Immatriculation"
                                            value={vehiculeForm.immatriculation}
                                            onChange={(value) => {
                                                const uppercased = value.toUpperCase();
                                                setVehiculeForm({ ...vehiculeForm, immatriculation: uppercased });

                                                // Auto-détection si "Autre pays" sélectionné
                                                if (selectedCountry === 'OTHER' && uppercased.length > 5) {
                                                    const detected = FormValidator.detectImmatriculationCountry(uppercased);
                                                    if (detected !== 'OTHER') {
                                                        console.log(`Pays détecté: ${detected}`);
                                                        // Optionnel: setSelectedCountry(detected);
                                                    }
                                                }
                                            }}
                                            validation={vehiculeValidations.immatriculation}
                                            required
                                            placeholder={
                                                selectedCountry === 'TN' ? "Ex: 123TUN456, TUN12345" :
                                                    selectedCountry === 'FR' ? "Ex: AB-123-CD, AB123CD" :
                                                        "Ex: ABC123 (format libre)"
                                            }
                                            maxLength={15}
                                        />

                                        {/* Deuxième ligne : Année, Couleur, Carburant */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <ValidatedField
                                                label="Année"
                                                type="number"
                                                value={vehiculeForm.annee}
                                                onChange={(value) => setVehiculeForm({ ...vehiculeForm, annee: value })}
                                                validation={vehiculeValidations.annee}
                                                placeholder="Ex: 2020"
                                            />

                                            <ValidatedField
                                                label="Couleur"
                                                value={vehiculeForm.couleur}
                                                onChange={(value) => setVehiculeForm({ ...vehiculeForm, couleur: value })}
                                                validation={vehiculeValidations.couleur}
                                                placeholder="Ex: Bleu"
                                                maxLength={30}
                                            />

                                            <ValidatedField
                                                label="Carburant"
                                                value={vehiculeForm.typeCarburant}
                                                onChange={(value) => setVehiculeForm({ ...vehiculeForm, typeCarburant: value })}
                                            >
                                                <option value="essence">Essence</option>
                                                <option value="diesel">Diesel</option>
                                                <option value="hybride">Hybride</option>
                                                <option value="electrique">Électrique</option>
                                                <option value="gpl">GPL</option>
                                            </ValidatedField>
                                        </div>

                                        {/* ✅ ALERTE DE COHÉRENCE */}
                                        {vehiculeValidations.coherence?.message && vehiculeValidations.coherence.type === 'warning' && (
                                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                <div className="flex items-center space-x-2">
                                                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                                    <span className="text-sm text-yellow-800">
                                                        {vehiculeValidations.coherence.message}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* ===== SECTION CARTE GRISE ===== */}
                                        <div className="col-span-3 mt-6 pt-6 border-t border-gray-300">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <span>Informations Carte Grise</span>
                                            </h3>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {/* Numéro CG */}
                                                <ValidatedField
                                                    label="Numéro Carte Grise"
                                                    value={vehiculeForm.carteGrise?.numeroCG || ""}
                                                    onChange={(value) => setVehiculeForm({
                                                        ...vehiculeForm,
                                                        carteGrise: { ...vehiculeForm.carteGrise, numeroCG: value.toUpperCase() }
                                                    })}
                                                    placeholder="Ex: 123456/2020"
                                                    maxLength={20}
                                                />

                                                {/* Numéro Châssis */}
                                                <ValidatedField
                                                    label="Numéro Châssis (VIN)"
                                                    value={vehiculeForm.carteGrise?.numeroChassis || ""}
                                                    onChange={(value) => setVehiculeForm({
                                                        ...vehiculeForm,
                                                        carteGrise: { ...vehiculeForm.carteGrise, numeroChassis: value.toUpperCase() }
                                                    })}
                                                    placeholder="Ex: VF1XXXXX..."
                                                    maxLength={17}
                                                />

                                                {/* Date mise en circulation */}
                                                <ValidatedField
                                                    label="Date mise en circulation"
                                                    type="date"
                                                    value={vehiculeForm.carteGrise?.dateMiseCirculation || ""}
                                                    onChange={(value) => setVehiculeForm({
                                                        ...vehiculeForm,
                                                        carteGrise: { ...vehiculeForm.carteGrise, dateMiseCirculation: value }
                                                    })}
                                                />

                                                {/* Puissance fiscale */}
                                                <ValidatedField
                                                    label="Puissance fiscale (CV)"
                                                    type="number"
                                                    value={vehiculeForm.carteGrise?.puissanceFiscale || ""}
                                                    onChange={(value) => setVehiculeForm({
                                                        ...vehiculeForm,
                                                        carteGrise: { ...vehiculeForm.carteGrise, puissanceFiscale: value }
                                                    })}
                                                    placeholder="Ex: 7"
                                                />

                                                {/* Genre */}
                                                <ValidatedField
                                                    label="Type véhicule"
                                                    value={vehiculeForm.carteGrise?.genre || "VP"}
                                                    onChange={(value) => setVehiculeForm({
                                                        ...vehiculeForm,
                                                        carteGrise: { ...vehiculeForm.carteGrise, genre: value }
                                                    })}
                                                >
                                                    <option value="VP">VP - Véhicule Particulier</option>
                                                    <option value="VU">VU - Véhicule Utilitaire</option>
                                                    <option value="MOTO">MOTO - Motocyclette</option>
                                                </ValidatedField>

                                                {/* Nombre places */}
                                                <ValidatedField
                                                    label="Nombre de places"
                                                    type="number"
                                                    value={vehiculeForm.carteGrise?.nombrePlaces || "5"}
                                                    onChange={(value) => setVehiculeForm({
                                                        ...vehiculeForm,
                                                        carteGrise: { ...vehiculeForm.carteGrise, nombrePlaces: value }
                                                    })}
                                                />

                                                {/* Date visite technique */}
                                                <ValidatedField
                                                    label="Dernière visite technique"
                                                    type="date"
                                                    value={vehiculeForm.carteGrise?.dateVisite || ""}
                                                    onChange={(value) => setVehiculeForm({
                                                        ...vehiculeForm,
                                                        carteGrise: { ...vehiculeForm.carteGrise, dateVisite: value }
                                                    })}
                                                />

                                                {/* Prochaine visite */}
                                                <ValidatedField
                                                    label="Prochaine visite technique"
                                                    type="date"
                                                    value={vehiculeForm.carteGrise?.dateProchaineVisite || ""}
                                                    onChange={(value) => setVehiculeForm({
                                                        ...vehiculeForm,
                                                        carteGrise: { ...vehiculeForm.carteGrise, dateProchaineVisite: value }
                                                    })}
                                                />
                                            </div>
                                        </div>
                                        {/* Boutons */}
                                        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                                            <button
                                                type="button"
                                                onClick={() => setShowVehiculeModal(false)}
                                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={loading || !isVehiculeFormValid()}
                                                className={`px-4 py-2 rounded-lg text-white font-medium ${loading || !isVehiculeFormValid()
                                                    ? 'bg-gray-400 cursor-not-allowed'
                                                    : 'bg-blue-600 hover:bg-blue-700'
                                                    }`}
                                            >
                                                {loading ? (
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                        <span>En cours...</span>
                                                    </div>
                                                ) : (
                                                    modalType === "add" ? "Ajouter le véhicule" : "Sauvegarder les modifications"
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}