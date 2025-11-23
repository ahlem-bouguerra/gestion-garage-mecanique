import React, { useState } from 'react';
import { X, User, MapPin, Wrench, UserCheck, Clock, FileText, Edit2, Play, CheckCircle, Package, DollarSign, Calendar, AlertCircle } from 'lucide-react';

// Composant principal du modal de détails
const OrderDetailsModal = ({ 
  ordre, 
  devisDetails, 
  onClose, 
  onEdit,
  onDemarrer,
  onTerminer,
  loading = false 
}) => {
  const [activeTab, setActiveTab] = useState('general');

  const statusConfig = {
    en_attente: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    en_cours: { label: 'En cours', color: 'bg-blue-100 text-blue-800', icon: Wrench },
    termine: { label: 'Terminé', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    suspendu: { label: 'Suspendu', color: 'bg-red-100 text-red-800', icon: AlertCircle },
    supprime: { label: 'Supprimé', color: 'bg-gray-100 text-gray-800', icon: X },
  };

  const prioriteConfig = {
    faible: { label: 'Faible', color: 'bg-gray-100 text-gray-800' },
    normale: { label: 'Normale', color: 'bg-blue-100 text-blue-800' },
    elevee: { label: 'Élevée', color: 'bg-orange-100 text-orange-800' },
    urgente: { label: 'Urgente', color: 'bg-red-100 text-red-800' }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(price || 0);
  };

  const StatusIcon = statusConfig[ordre?.status]?.icon || Clock;
  const statusInfo = statusConfig[ordre?.status] || statusConfig.en_attente;
  const prioriteInfo = prioriteConfig[ordre?.priorite] || prioriteConfig.normale;

  const tabs = [
    { id: 'general', label: 'Informations Générales', icon: FileText },
    { id: 'taches', label: `Tâches (${ordre?.taches?.length || 0})`, icon: Wrench },
    { id: 'financier', label: 'Résumé Financier', icon: DollarSign }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">
                {ordre?.numeroOrdre || `Ordre ${ordre?._id}`}
              </h2>
              <p className="text-blue-100 text-sm">
                Devis: <span className="font-semibold">{devisDetails?.id || ordre?.devisId}</span>
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Actions rapides */}
              {ordre?.status === 'en_attente' && onDemarrer && (
                <button
                  onClick={onDemarrer}
                  disabled={loading}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  <span className="font-medium">Démarrer</span>
                </button>
              )}

              {ordre?.status === 'en_cours' && onTerminer && (
                <button
                  onClick={onTerminer}
                  disabled={loading}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Terminer</span>
                </button>
              )}

              {ordre?.status !== 'termine' && ordre?.status !== 'supprime' && onEdit && (
                <button
                  onClick={onEdit}
                  disabled={loading}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Edit2 className="w-4 h-4" />
                  <span className="font-medium">Modifier</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Badges Status et Priorité */}
          <div className="flex items-center gap-3 mt-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-white bg-opacity-20 backdrop-blur`}>
              <StatusIcon className="w-4 h-4" />
              <span className="font-semibold">{statusInfo.label}</span>
            </div>
            <div className={`px-4 py-2 rounded-lg ${prioriteInfo.color}`}>
              <span className="font-semibold">{prioriteInfo.label}</span>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b bg-gray-50">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'general' && (
            <GeneralTab ordre={ordre} devisDetails={devisDetails} formatDate={formatDate} />
          )}
          
          {activeTab === 'taches' && (
            <TachesTab taches={ordre?.taches} formatDate={formatDate} />
          )}
          
          {activeTab === 'services' && (
            <ServicesTab services={devisDetails?.services} formatPrice={formatPrice} />
          )}
          
          {activeTab === 'pieces' && (
            <PiecesTab pieces={devisDetails?.pieces} formatPrice={formatPrice} />
          )}
          
          {activeTab === 'financier' && (
            <FinancierTab devisDetails={devisDetails} formatPrice={formatPrice} />
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 p-4 flex justify-between items-center">
        
          
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

// Tab: Informations Générales
const GeneralTab = ({ ordre, devisDetails, formatDate }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Client */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center text-lg">
          <User className="w-5 h-5 mr-2 text-blue-600" />
          Informations Client
        </h3>
        <div className="space-y-3">
          <div>
            <span className="text-gray-600 text-sm">Nom complet</span>
            <p className="font-medium text-gray-900">{devisDetails?.clientName || ordre?.clientInfo?.nom || 'N/A'}</p>
          </div>
          {devisDetails?.clientPhone && (
            <div>
              <span className="text-gray-600 text-sm">Téléphone</span>
              <p className="font-medium text-gray-900">{devisDetails.clientPhone}</p>
            </div>
          )}
          {devisDetails?.clientEmail && (
            <div>
              <span className="text-gray-600 text-sm">Email</span>
              <p className="font-medium text-gray-900">{devisDetails.clientEmail}</p>
            </div>
          )}
        </div>
      </div>

      {/* Véhicule */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center text-lg">
          <MapPin className="w-5 h-5 mr-2 text-green-600" />
          Véhicule
        </h3>
        <div className="space-y-3">
          <div>
            <span className="text-gray-600 text-sm">Modèle</span>
            <p className="font-medium text-gray-900">
              {devisDetails?.vehicleInfo || ordre?.vehiculedetails?.nom || 'N/A'}
            </p>
          </div>
          {devisDetails?.vehiclePlate && (
            <div>
              <span className="text-gray-600 text-sm">Immatriculation</span>
              <p className="font-medium text-gray-900">{devisDetails.vehiclePlate}</p>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Planification */}
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center text-lg">
        <Calendar className="w-5 h-5 mr-2 text-purple-600" />
        Planification
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <span className="text-gray-600 text-sm">Date de création</span>
          <p className="font-medium text-gray-900">{formatDate(devisDetails?.createdAt || ordre?.dateCommence)}</p>
        </div>
        <div>
          <span className="text-gray-600 text-sm">Date de début</span>
          <p className="font-medium text-gray-900">{formatDate(ordre?.dateCommence)}</p>
        </div>
        <div>
          <span className="text-gray-600 text-sm">Date fin prévue</span>
          <p className="font-medium text-gray-900">{formatDate(ordre?.dateFinPrevue)}</p>
        </div>
        {devisDetails?.estimatedTime && (
          <div>
            <span className="text-gray-600 text-sm">Temps estimé</span>
            <p className="font-medium text-gray-900">
              {devisDetails.estimatedTime.value} {devisDetails.estimatedTime.unit}
            </p>
          </div>
        )}
        {ordre?.atelierNom && (
          <div>
            <span className="text-gray-600 text-sm">Atelier</span>
            <p className="font-medium text-gray-900">{ordre.atelierNom}</p>
          </div>
        )}
      </div>
    </div>

    {/* Description */}
    {ordre?.description && (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
        <p className="text-gray-700 leading-relaxed">{ordre.description}</p>
      </div>
    )}
  </div>
);

// Tab: Tâches
const TachesTab = ({ taches, formatDate }) => (
  <div className="space-y-4">
    {taches && taches.length > 0 ? (
      <>
        {/* Statistiques des tâches */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Statistiques des Tâches</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{taches.length}</div>
              <div className="text-sm text-gray-600 mt-1">Total</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {taches.filter(t => t.status === 'terminee').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Terminées</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {taches.reduce((sum, t) => sum + (t.estimationHeures || 0), 0)}h
              </div>
              <div className="text-sm text-gray-600 mt-1">Estimé</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {taches.reduce((sum, t) => sum + (t.heuresReelles || 0), 0)}h
              </div>
              <div className="text-sm text-gray-600 mt-1">Réel</div>
            </div>
          </div>
        </div>

        {/* Liste des tâches */}
        {taches.map((tache, index) => (
          <div key={tache._id || index} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-lg mb-2">{tache.description}</h4>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    Qté: {tache.quantite}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Estimation: {tache.estimationHeures}h
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Réelles: {tache.heuresReelles || 0}h
                  </span>
                </div>
                {tache.serviceNom && (
                  <p className="text-sm text-blue-600 mt-2">📦 Service: {tache.serviceNom}</p>
                )}
              </div>

              {tache.status && (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  tache.status === 'terminee' ? 'bg-green-100 text-green-800' :
                  tache.status === 'en_cours' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {tache.status === 'terminee' ? 'Terminée' :
                   tache.status === 'en_cours' ? 'En cours' : 'En attente'}
                </span>
              )}
            </div>

            {tache.mecanicienNom && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">
                    Mécanicien: <span className="text-green-700">{tache.mecanicienNom}</span>
                  </span>
                </div>
              </div>
            )}

            {tache.notes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">📝 Notes:</span> {tache.notes}
                </p>
              </div>
            )}

            {(tache.dateDebut || tache.dateFin) && (
              <div className="text-xs text-gray-500 space-y-1 mt-3 pt-3 border-t">
                {tache.dateDebut && <p>🕐 Démarré: {formatDate(tache.dateDebut)}</p>}
                {tache.dateFin && <p>✅ Terminé: {formatDate(tache.dateFin)}</p>}
              </div>
            )}
          </div>
        ))}
      </>
    ) : (
      <div className="text-center py-12 text-gray-500">
        <Wrench className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p className="text-lg">Aucune tâche assignée</p>
      </div>
    )}
  </div>
);


// Tab: Financier
const FinancierTab = ({ devisDetails, formatPrice }) => (
  <div className="max-w-2xl mx-auto">
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <DollarSign className="w-8 h-8 mr-3 text-green-600" />
        Résumé Financier
      </h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center py-3 border-b border-green-200">
          <span className="text-gray-700 font-medium">Total HT</span>
          <span className="text-xl font-bold text-gray-900">{formatPrice(devisDetails?.totalHT)}</span>
        </div>
        
        <div className="flex justify-between items-center py-3 border-b border-green-200">
          <span className="text-gray-700 font-medium">TVA ({devisDetails?.tvaRate || 0}%)</span>
          <span className="text-xl font-bold text-gray-900">
            {formatPrice((devisDetails?.totalHT || 0) * ((devisDetails?.tvaRate || 0) / 100))}
          </span>
        </div>
        
        <div className="flex justify-between items-center py-4 bg-green-100 rounded-lg px-4 mt-4">
          <span className="text-xl font-bold text-gray-900">Total TTC</span>
          <span className="text-3xl font-bold text-green-600">
            {formatPrice(devisDetails?.totalTTC)}
          </span>
        </div>
      </div>

      {/* Détails supplémentaires */}
      <div className="mt-8 pt-6 border-t border-green-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center p-4 bg-white rounded-lg">
            <p className="text-gray-600 mb-1">Services</p>
            <p className="text-2xl font-bold text-blue-600">
              {devisDetails?.services?.length || 0}
            </p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg">
            <p className="text-gray-600 mb-1">Pièces</p>
            <p className="text-2xl font-bold text-green-600">
              {devisDetails?.pieces?.length || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default OrderDetailsModal;