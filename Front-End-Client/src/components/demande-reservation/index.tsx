"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, User, Phone, Mail, FileText, MapPin, ArrowLeft, Send } from 'lucide-react';
import { useSearchParams } from "next/navigation";
import axios from 'axios';

interface Service {
  _id: string;
  name: string;
  statut: string;
  description?: string;
}


const ReservationForm = () => {
    const [voitures, setVoitures] = useState([]); // Liste de voitures
    const router = useRouter();
    const searchParams = useSearchParams();
    const [garageData, setGarageData] = useState<any>({});
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [formData, setFormData] = useState({
        clientID:'',
        vehiculeId:'',
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        serviceId: '',
        date: '',
        heureDebut: '',
        descriptionDepannage: '',
    });
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState(false);
    const [selectedGarage, setSelectedGarage] = useState<Garage | null>(null);
    const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
    };

    useEffect(() => {
        if (searchParams) {
            setGarageData({
                id: searchParams.get("garageId"),
                name: searchParams.get("garageName"),
                address: searchParams.get("garageAddress"),
                city: searchParams.get("garageCity"),
                governorate: searchParams.get("garageGovernorate"),
                phone: searchParams.get("garagePhone"),
                email: searchParams.get("garageEmail"),
            });
        }
    }, [searchParams]);


    useEffect(() => {
        const fetchUserWithLocation = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const response = await axios.get("http://localhost:5000/api/client/profile", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setCurrentUser(response.data);
            } catch (error) {
                console.error("Erreur:", error);
            }
        };

        fetchUserWithLocation();
    }, []);

      useEffect(() => {
    const fetchVoitures = async () => {
         const token = localStorage.getItem("token");
            if (!token) return;
      try {
        const res = await axios.get("http://localhost:5000/api/get-all-mes-vehicules",{
                    headers: { Authorization: `Bearer ${token}` },
                }); 
        // ✅ adapte cette URL à ton API réelle
        setVoitures(res.data);
      } catch (error) {
        console.error("Erreur lors de la récupération des voitures :", error);
      }
    };

    fetchVoitures();
  }, []);

useEffect(() => {
  const fetchServices = async () => {
    if (!garageData.id) {  // ← Utilise garageData.id
      setServices([]);
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:5000/api/services/garage/${garageData.id}`  // ← ICI
      );
    
    if (Array.isArray(res.data)) {
      setServices(res.data);
    } else if (res.data.success && Array.isArray(res.data.services)) {
      setServices(res.data.services);
    } else {
      setServices([]);
    }
   } catch (err: any) {
      console.error("❌ Erreur:", err.response?.data || err.message);
      setServices([]);
    }
  };

  fetchServices();
}, [garageData.id]);  

    // Générer les options d'heures (8h à 18h)
    const generateTimeOptions = () => {
        const options = [];
        for (let i = 8; i <= 18; i++) {
            options.push(`${i.toString().padStart(2, '0')}:00`);
            if (i < 18) options.push(`${i.toString().padStart(2, '0')}:30`);
        }
        return options;
    };

    const timeOptions = generateTimeOptions();

    const validateForm = () => {
        const newErrors = {};

        if (!formData.clientName.trim()) newErrors.clientName = 'Le nom est requis';
        if (!formData.clientPhone.trim()) newErrors.clientPhone = 'Le téléphone est requis';
        if (!formData.serviceId) newErrors.serviceId = 'Veuillez sélectionner un service';
        if (!formData.date) newErrors.date = 'La date est requise';
        if (!formData.heureDebut) newErrors.heureDebut = 'L\'heure de début est requise';
        if (!formData.descriptionDepannage.trim()) newErrors.descriptionDepannage = 'La description est requise';

        // Validation de la date (pas dans le passé)
        if (formData.date && new Date(formData.date) < new Date().setHours(0, 0, 0, 0)) {
            newErrors.date = 'La date ne peut pas être dans le passé';
        }

        // Validation du téléphone (format tunisien basique)
        const phoneRegex = /^(\+216|216)?[2-9][0-9]{7}$/;
        if (formData.clientPhone && !phoneRegex.test(formData.clientPhone.replace(/\s/g, ''))) {
            newErrors.clientPhone = 'Format de téléphone invalide (ex: +216 20 123 456)';
        }

        // Validation de l'email si fourni
        if (formData.clientEmail && !/\S+@\S+\.\S+/.test(formData.clientEmail)) {
            newErrors.clientEmail = 'Format d\'email invalide';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    useEffect(() => {
    if (!currentUser) return;
    setFormData((prev) => ({
        ...prev,
        clientName: currentUser.username || '',
        clientPhone: currentUser.phone || '',
        clientEmail: currentUser.email || '',
    }));
}, [currentUser]);


const handleSubmit = async () => {
    console.log("Button cliqué !");
    if (!validateForm()) return;

    setSubmitting(true);
    setErrors({});

    try {
        const reservationData = {
            garageId: garageData.id,
            clientId: currentUser?._id,
            vehiculeId: formData.vehiculeId,
            clientName: formData.clientName.trim(),
            clientPhone: formData.clientPhone.trim(),
            clientEmail: formData.clientEmail.trim() || null,
            serviceId: formData.serviceId,
            creneauDemande: {
                date: formData.date,
                heureDebut: formData.heureDebut,
            },
            descriptionDepannage: formData.descriptionDepannage.trim(),
        };

        // 🔹 Appel API POST réel
        const response = await axios.post(
            'http://localhost:5000/api/create-reservation',
            reservationData,{
      headers: { Authorization: `Bearer ${getAuthToken()}` }
    }
        );

        if (response.data.success) {
            setSuccess(true);
        } else {
            setErrors({ submit: 'Erreur lors de la création de la réservation.' });
        }

    } catch (error: any) {
        console.error('Erreur:', error.response?.data || error.message);
        setErrors({ submit: 'Erreur de connexion. Veuillez réessayer.' });
    } finally {
        setSubmitting(false);
    }
};


    const handleGoBack = () => {
        router.push(`/chercher-garage`);
        console.log('Retour à la recherche');
    };

    if (success) {
        return (
            <div className="max-w-2xl mx-auto p-6 text-center">
                <div className="bg-green-50 border border-green-200 rounded-lg p-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-green-600 text-2xl">✓</span>
                    </div>
                    <h2 className="text-2xl font-semibold text-green-800 mb-2">Demande envoyée !</h2>
                    <p className="text-green-600 mb-4">
                        Votre demande de réservation a été envoyée avec succès au garage <strong>{garageData.name}</strong>.
                    </p>
                    <p className="text-green-600 text-sm mb-6">
                        Vous recevrez une réponse par téléphone ou email dans les 24 heures.
                    </p>
                    <button
                        onClick={handleGoBack}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Retour à la recherche
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Bouton retour */}
            <button
                onClick={handleGoBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Retour à la recherche
            </button>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Informations du garage */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Garage sélectionné</h2>

                        <div className="space-y-3">
                            <div>
                                <h3 className="font-semibold text-blue-600">{garageData.name}</h3>
                            </div>

                            <div className="flex items-start gap-2 text-sm text-gray-600">
                                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p>{garageData.address}</p>
                                    <p>{garageData.city}, {garageData.governorate}</p>
                                </div>
                            </div>

                            {garageData.phone && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Phone className="h-4 w-4 flex-shrink-0" />
                                    <span>{garageData.phone}</span>
                                </div>
                            )}

                            {garageData.email && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Mail className="h-4 w-4 flex-shrink-0" />
                                    <span>{garageData.email}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                            <h4 className="font-medium text-blue-800 text-sm mb-1">Information</h4>
                            <p className="text-blue-600 text-xs">
                                Votre demande sera envoyée directement au garage. Vous recevrez une réponse bientôt.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Formulaire de réservation */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h1 className="text-2xl font-bold text-gray-800 mb-6">Demande de réservation</h1>

                        <div className="space-y-6">
                            {/* Informations client */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">
                                    Vos informations
                                </h3>

                                <div className="grid md:grid-cols-2 gap-4">
                                    {/* Nom complet */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nom complet *
                                        </label>
                                        <div className="relative flex items-center pl-10 pr-4 py-2 border rounded-lg bg-gray-50">
                                            <User className="absolute left-3 h-4 w-4 text-gray-400" />
                                            <p className="text-gray-800">{currentUser?.username || "Non renseigné"}</p>
                                        </div>
                                    </div>

                                    {/* Téléphone */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Téléphone *
                                        </label>
                                        <div className="relative flex items-center pl-10 pr-4 py-2 border rounded-lg bg-gray-50">
                                            <Phone className="absolute left-3 h-4 w-4 text-gray-400" />
                                            <p className="text-gray-800">{currentUser?.phone || "Non renseigné"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email (optionnel)
                                    </label>
                                    <div className="relative flex items-center pl-10 pr-4 py-2 border rounded-lg bg-gray-50">
                                        <Mail className="absolute left-3 h-4 w-4 text-gray-400" />
                                        <p className="text-gray-800">{currentUser?.email || "Non renseigné"}</p>
                                    </div>
                                </div>
                            </div>


                            {/* Service et créneau */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">
                                    Service et créneau
                                </h3>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Service demandé *
                                    </label>
                                    <select
                                        value={formData.serviceId}
                                        onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.serviceId ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        disabled={loading}
                                    >
                                        <option value="">Sélectionnez un service</option>
                                        {services.map((service) => (
                                            <option key={service._id} value={service._id}>
                                                {service.name} -- {service.statut}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.serviceId && <p className="text-red-500 text-xs mt-1">{errors.serviceId}</p>}
                                </div>



                                <div className="p-4">
      <label htmlFor="voiture" className="block mb-2 font-semibold text-gray-700">
        Sélectionner une voiture :
      </label>
      <select
        id="voiture"
        value={formData.vehiculeId}
        onChange={(e) => setFormData({...formData, vehiculeId: e.target.value})}
        className="border border-gray-300 rounded-md p-2 w-full"
      >
        <option value="">-- Choisir une voiture --</option>

        {voitures.map((voiture) => (
  <option key={voiture._id} value={voiture._id}>
            {voiture.marque} {voiture.modele} ({voiture.immatriculation})
          </option>
        ))}
      </select>
    </div>



















                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Date souhaitée *
                                        </label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                            <input
                                                type="date"
                                                value={formData.date}
                                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                min={new Date().toISOString().split('T')[0]}
                                                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.date ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                            />
                                        </div>
                                        {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Heure de début *
                                        </label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                            <select
                                                value={formData.heureDebut}
                                                onChange={(e) => setFormData({ ...formData, heureDebut: e.target.value })}
                                                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.heureDebut ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                            >
                                                <option value="">Début</option>
                                                {timeOptions.map(time => (
                                                    <option key={time} value={time}>{time}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {errors.heureDebut && <p className="text-red-500 text-xs mt-1">{errors.heureDebut}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description du problème *
                                </label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <textarea
                                        value={formData.descriptionDepannage}
                                        onChange={(e) => setFormData({ ...formData, descriptionDepannage: e.target.value })}
                                        rows={4}
                                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none ${errors.descriptionDepannage ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Décrivez en détail le problème de votre véhicule, les symptômes observés, etc."
                                    />
                                </div>
                                {errors.descriptionDepannage && <p className="text-red-500 text-xs mt-1">{errors.descriptionDepannage}</p>}
                            </div>

                            {/* Bouton de soumission */}
                            <div className="flex justify-end">
                                <button
                                    type="button"   // ← IMPORTANT
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Envoi en cours...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4" />
                                            Envoyer la demande
                                        </>
                                    )}
                                </button>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReservationForm;