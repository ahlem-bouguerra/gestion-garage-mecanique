import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Calendar,
  Award,
  Lock
} from 'lucide-react';

import { getGaragisteById } from './api';
import GaragistePermissionsSection from './GaragistePermissionsSection';

interface GaragisteDetailsModalProps {
  garagisteId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function GaragisteDetailsModal({ garagisteId, isOpen, onClose }: GaragisteDetailsModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && garagisteId) {
      fetchGaragisteDetails();
    }
  }, [isOpen, garagisteId]);

useEffect(() => {
  if (isOpen && garagisteId) {
    console.log('🔎 Chargement détails pour ID:', garagisteId);
    fetchGaragisteDetails();
  }
}, [isOpen, garagisteId]);

const fetchGaragisteDetails = async () => {
  setLoading(true);
  setError('');
  try {
    const response = await getGaragisteById(garagisteId);
    console.log('📦 Données reçues:', response);
    console.log('👤 Garagiste dans data:', response.data.garagiste);
    console.log('🆔 ID du garagiste:', response.data.garagiste._id);
    setData(response.data);
  } catch (err: any) {
    setError(err.message || 'Erreur lors du chargement');
  } finally {
    setLoading(false);
  }
};

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: any = {
      appointments: 'bg-blue-100 text-blue-800',
      users: 'bg-purple-100 text-purple-800',
      reports: 'bg-green-100 text-green-800',
      services: 'bg-orange-100 text-orange-800',
      default: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.default;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <User className="w-7 h-7" />
                Détails du Garagiste
              </h2>
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div>
                  <h3 className="text-red-900 font-semibold mb-1">Erreur</h3>
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              </div>
            ) : data ? (
              <div className="space-y-6">
                {/* Informations Principales */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Informations Personnelles
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-500 mb-1 block">Nom d'utilisateur</label>
                      <p className="text-gray-900 font-semibold text-lg">{data.garagiste.username}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500 mb-1 block">Email</label>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <a href={`mailto:${data.garagiste.email}`} className="text-blue-600 hover:underline">
                          {data.garagiste.email}
                        </a>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500 mb-1 block">Téléphone</label>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <a href={`tel:${data.garagiste.phone}`} className="text-blue-600 hover:underline">
                          {data.garagiste.phone}
                        </a>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500 mb-1 block">Statut du compte</label>
                      <div className="flex items-center gap-2">
                        {data.garagiste.isVerified ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-green-600 font-medium">Vérifié</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-5 h-5 text-orange-600" />
                            <span className="text-orange-600 font-medium">En attente</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {data.garagiste.createdBy && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <label className="text-sm font-medium text-gray-500 mb-1 block">Créé par</label>
                      <p className="text-gray-700">
                        {data.garagiste.createdBy.username} ({data.garagiste.createdBy.email})
                      </p>
                    </div>
                  )}
                </div>

                {/* Rôle */}
                <div className="bg-purple-50 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-600" />
                    Rôle et Statut
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 mb-2 block">Rôle actuel</label>
                      <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-lg font-semibold">
                        <Award className="w-5 h-5" />
                        {data.role.name}
                      </div>
                      {data.role.description && (
                        <p className="text-gray-600 text-sm mt-2">{data.role.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                      {data.garagiste.isAdmin && (
                        <span className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                          <Lock className="w-4 h-4" />
                          Administrateur
                        </span>
                      )}
                      <span className="text-gray-600 text-sm">
                        {data.stats.totalPermissions} permission(s)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Permissions */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-blue-600" />
                    Permissions ({data.permissions.length})
                  </h3>
                  
                  {data.permissions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {data.permissions.map((permission: any) => (
                        <div
                          key={permission.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900">{permission.name}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryColor(permission.category)}`}>
                              {permission.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{permission.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Aucune permission assignée</p>
                  )}
                </div>

                {/* Dates */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Historique
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500 mb-1 block">Créé le</label>
                      <p className="text-gray-900">{formatDate(data.garagiste.createdAt)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 mb-1 block">Dernière modification</label>
                      <p className="text-gray-900">{formatDate(data.garagiste.updatedAt)}</p>
                    </div>
                  </div>
                </div>
                {data && data.garagiste && (
  <GaragistePermissionsSection garagiste={data.garagiste} />
)}
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}