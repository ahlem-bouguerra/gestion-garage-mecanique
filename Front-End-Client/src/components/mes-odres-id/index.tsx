'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Wrench,
  MapPin,
  Phone,
  Mail,
  Star,
  FileText,
  TrendingUp
} from 'lucide-react';

interface Tache {
  _id: string;
  description: string;
  serviceNom: string;
  mecanicienNom: string;
  status: string;
  estimationHeures: number;
  heuresReelles: number;
  dateDebut?: string;
  dateFin?: string;
}

interface OrdreDetails {
  _id: string;
  numeroOrdre: string;
  status: string;
  dateCommence: string;
  dateFinPrevue?: string;
  dateFinReelle?: string;
  description?: string;
  clientInfo: {
    nom: string;
    telephone?: string;
    email?: string;
  };
  vehiculedetails: {
    nom: string;
  };
  garageId: {
    _id: string;
    nom: string;
    email?: string;
    phone?: string;
    address?: string;
    averageRating?: number;
    totalRatings?: number;
  };
  atelierId: {
    name: string;
    localisation?: string;
  };
  taches: Tache[];
  nombreTaches: number;
  nombreTachesTerminees: number;
  totalHeuresEstimees: number;
  totalHeuresReelles: number;
  canBeRated: boolean;
  progressionPourcentage: number;
  enRetard: boolean;
  joursRestants?: number;
  ratingId?: any;
  notes?: Array<{
    contenu: string;
    auteur: string;
    date: string;
  }>;
}

const OrdreDetailsPage = () => {
  const router = useRouter();
  const params = useParams();
  const ordreId = params.id as string;

  const [ordre, setOrdre] = useState<OrdreDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || sessionStorage.getItem('token');
    }
    return null;
  };

  const fetchOrdreDetails = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/auth/sign-in');
        return;
      }

      const response = await axios.get(
        `http://localhost:5000/api/mes-ordres/${ordreId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = await response.data;

      if (data.success) {
        setOrdre(data.ordre);
      } else {
        console.error('Erreur:', data.message);
        router.push('/mes-ordres');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        window.location.href = '/auth/sign-in';
        return;
      }
      console.error('❌ Erreur chargement ordre:', error);
      router.push('/mes-ordres');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ordreId) {
      fetchOrdreDetails();
    }
  }, [ordreId]);

  const StatusBadge = ({ status }: { status: string }) => {
    const configs = {
      en_attente: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'En attente' },
      en_cours: { color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'En cours' },
      termine: { color: 'bg-green-100 text-green-800 border-green-300', label: 'Terminé' },
      suspendu: { color: 'bg-red-100 text-red-800 border-red-300', label: 'Suspendu' }
    };

    const config = configs[status as keyof typeof configs] || configs.en_attente;

    return (
      <span className={`px-4 py-2 rounded-lg font-semibold border-2 ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const TacheCard = ({ tache }: { tache: Tache }) => {
    const statusConfig = {
      assignee: { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Assignée' },
      en_cours: { color: 'bg-blue-100 text-blue-800', icon: TrendingUp, label: 'En cours' },
      terminee: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Terminée' },
      suspendue: { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Suspendue' }
    };

    const config = statusConfig[tache.status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">{tache.serviceNom}</h4>
            <p className="text-sm text-gray-600">{tache.description}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color} flex items-center gap-1`}>
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <User className="w-4 h-4" />
            <span>{tache.mecanicienNom}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>
              {tache.status === 'terminee'
                ? `${tache.heuresReelles}h réelles`
                : `${tache.estimationHeures}h estimées`
              }
            </span>
          </div>
        </div>

        {tache.dateDebut && (
          <div className="mt-2 text-xs text-gray-500">
            Début: {new Date(tache.dateDebut).toLocaleDateString('fr-FR')}
            {tache.dateFin && ` • Fin: ${new Date(tache.dateFin).toLocaleDateString('fr-FR')}`}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!ordre) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ordre non trouvé</h2>
          <button
            onClick={() => router.push('/mes-ordres')}
            className="text-blue-600 hover:underline"
          >
            Retour à mes ordres
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Bouton retour */}
        <button
          onClick={() => router.push('/mes-ordres')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour à mes ordres
        </button>

        {/* En-tête */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                  {ordre.numeroOrdre}
                </h1>
                <StatusBadge status={ordre.status} />
                {ordre.enRetard && ordre.status !== 'termine' && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-lg font-medium">
                    <AlertCircle className="w-4 h-4" />
                    En retard
                  </span>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <span className="font-semibold">Début:</span>{' '}
                    {new Date(ordre.dateCommence).toLocaleDateString('fr-FR')}
                  </div>
                </div>

                {ordre.dateFinPrevue && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    <div>
                      <span className="font-semibold">Fin prévue:</span>{' '}
                      {new Date(ordre.dateFinPrevue).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                )}

                {ordre.dateFinReelle && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <span className="font-semibold">Terminé le:</span>{' '}
                      {new Date(ordre.dateFinReelle).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-gray-600">
                  <Wrench className="w-5 h-5 text-purple-600" />
                  <div>
                    <span className="font-semibold">Véhicule:</span>{' '}
                    {ordre.vehiculedetails.nom}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            {ordre.canBeRated && (
              <button
                onClick={() => setShowRatingModal(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
              >
                <Star className="w-5 h-5" />
                Noter ce service
              </button>
            )}

            {ordre.ratingId && (
              <div className="flex items-center gap-2 px-6 py-3 bg-green-100 text-green-800 rounded-lg font-semibold">
                <CheckCircle className="w-5 h-5" />
                Service noté
              </div>
            )}
          </div>


        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {ordre.description && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Description
                </h2>
                <p className="text-gray-700">{ordre.description}</p>
              </div>
            )}

            {/* Liste des tâches */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-600" />
                Tâches ({ordre.nombreTaches})
              </h2>

              <div className="space-y-3">
                {ordre.taches.map((tache) => (
                  <TacheCard key={tache._id} tache={tache} />
                ))}
              </div>
            </div>


            {/* Notes */}
            {ordre.notes && ordre.notes.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Notes</h2>
                <div className="space-y-3">
                  {ordre.notes.map((note, index) => (
                    <div key={index} className="border-l-4 border-blue-600 pl-4 py-2">
                      <p className="text-gray-700 mb-1">{note.contenu}</p>
                      <div className="text-xs text-gray-500">
                        Par {note.auteur} • {new Date(note.date).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Colonne latérale */}
          <div className="space-y-6">
            {/* Info garage */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Garage :</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-red-600">{ordre.garageId.nom}</p>
                  {ordre.garageId.averageRating && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">
                        {ordre.garageId.averageRating.toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({ordre.garageId.totalRatings} avis)
                      </span>
                    </div>
                  )}
                </div>

                {ordre.garageId.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${ordre.garageId.phone}`} className="hover:text-blue-600">
                      {ordre.garageId.phone}
                    </a>
                  </div>
                )}

                {ordre.garageId.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${ordre.garageId.email}`} className="hover:text-blue-600">
                      {ordre.garageId.email}
                    </a>
                  </div>
                )}

                {ordre.garageId.address && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5" />
                    <span>{ordre.garageId.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Info atelier */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Atelier :</h3>
              <div className="space-y-2">
                <p className="font-semibold text-gray-900">{ordre.atelierId.name}</p>
                {ordre.atelierId.localisation && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5" />
                    <span>{ordre.atelierId.localisation}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Statistiques */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow p-6 text-white">
              <h3 className="text-lg font-bold mb-4">Statistiques</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="opacity-90">Tâches totales</span>
                  <span className="font-bold">{ordre.nombreTaches}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-90">Heures estimées</span>
                  <span className="font-bold">{ordre.totalHeuresEstimees}h</span>
                </div>
                {ordre.totalHeuresReelles > 0 && (
                  <div className="flex justify-between">
                    <span className="opacity-90">Heures réelles</span>
                    <span className="font-bold">{ordre.totalHeuresReelles}h</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal de notation - Réutiliser le composant RatingModal de la page précédente */}
        {showRatingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-4">Noter le service</h2>
              <p className="text-gray-600 mb-4">
                Votre avis nous aide à améliorer nos services
              </p>
              {/* Intégrer ici le formulaire de notation */}
              <button
                onClick={() => setShowRatingModal(false)}
                className="w-full mt-4 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdreDetailsPage;