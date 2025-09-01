import React from 'react';
import useOrdreTravail from './hooks/useOrdreTravail';
import Header from './components/Header';
import TabNavigation from './components/TabNavigation';
import AlertMessages from './components/AlertMessages';
import CreateOrdreForm from './components/CreateOrdreForm';
import OrdresList from './components/OrdresList';
import OrdreDetailsModal from './components/OrdreDetailsModal';

const OrdreTravailSystem: React.FC = () => {
  const {
    // États
    selectedOrdre,
    editMode,
    activeTab,
    error,
    success,

    // Setters
    setSelectedOrdre,
    setActiveTab,

    // Actions
    loadOrdreDetails,
    loadOrdresTravail,
    demarrerOrdre,
    terminerOrdre,
    supprimerOrdre,
    startEdit,
    cancelEdit,

    // Messages
    showError,
    showSuccess
  } = useOrdreTravail();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Header 
          title="Ordres de Travail"
          subtitle="Gestion des ordres de travail pour l'atelier"
        />

        {/* Messages d'alerte */}
        <AlertMessages error={error} success={success} />

        {/* Navigation par onglets */}
        <TabNavigation 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Contenu des onglets */}
        {activeTab === 'create' && (
          <CreateOrdreForm
            onSuccess={showSuccess}
            onError={showError}
          />
        )}

        {activeTab === 'list' && (
          <OrdresList
            onViewDetails={loadOrdreDetails}
            onStartEdit={startEdit}
            onDemarrer={demarrerOrdre}
            onTerminer={terminerOrdre}
            onSupprimer={supprimerOrdre}
            onError={showError}
            onSuccess={showSuccess}
          />
        )}

        {/* Modal de détails d'ordre */}
        {selectedOrdre && (
          <OrdreDetailsModal
            selectedOrdre={selectedOrdre}
            editMode={editMode}
            onClose={() => setSelectedOrdre(null)}
            onStartEdit={() => startEdit(selectedOrdre)}
            onCancelEdit={cancelEdit}
            onDemarrer={demarrerOrdre}
            onTerminer={terminerOrdre}
            onSuccess={showSuccess}
            onError={showError}
            onReloadDetails={loadOrdreDetails}
            onReloadList={loadOrdresTravail}
          />
        )}
      </div>
    </div>
  );
};

export default OrdreTravailSystem;