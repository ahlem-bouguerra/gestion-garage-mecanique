// components/garage/index.tsx
"use client";
import ConfirmDialog from './ConfirmDialog'; // adapte le chemin exact

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, X, ArrowRight } from 'lucide-react';

// Import des composants
import GarageList from './GarageList';
import GarageForm from './GarageForm';
import GaragisteForm from './GaragisteForm';
import GarageDetails from './GarageDetails';
import GarageEditForm from './GarageEditForm';
import { deleteGarage } from './api';

// Import des fonctions API
import { getAllGarages, getAllRoles, createGarage, createGaragiste, updateGarage } from './api';

export default function GarageManagement() {
  const [view, setView] = useState('list');
  const [step, setStep] = useState(1);
  const [selectedGarageForDetails, setSelectedGarageForDetails] = useState(null);
  const [garages, setGarages] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createdGarage, setCreatedGarage] = useState(null);
  const [selectedGarage, setSelectedGarage] = useState(null);
  const [garageToEdit, setGarageToEdit] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Confirmer',
  cancelText: 'Annuler',
  type: 'warning' as 'danger' | 'warning' | 'info',
  requireTextConfirm: false,
  textToConfirm: '',
  onConfirm: async () => {}
});

  
const [garageData, setGarageData] = useState({
  garagenom: '',
  matriculefiscal: '',
  governorateId: '',      // 🔥 AJOUTÉ
  governorateName: '',
  cityId: '',             // 🔥 AJOUTÉ
  cityName: '',
  streetAddress: '',
  description: '',
  horaires: '',
  emailProfessionnel: '',
  telephoneProfessionnel: '',
  location: null as { type: string; coordinates: [number, number] } | null,
});

  const [garagisteData, setGaragisteData] = useState({
    username: '',
    email: '',
    password: '',
    phone: '',
    roleId: ''
  });

  // ========== FONCTIONS ==========
  
  useEffect(() => {
    fetchGarages();
    fetchRoles();
  }, []);

  const fetchGarages = async () => {
    try {
      const data = await getAllGarages();
      setGarages(data);
    } catch (err) {
      console.error('Erreur chargement garages:', err);
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await getAllRoles();
      setRoles(data);
      
      const adminRole = data?.find((r: any) => r.name === 'Admin Garage');
      if (adminRole) {
        setGaragisteData(prev => ({ ...prev, roleId: adminRole._id }));
      }
    } catch (err) {
      console.error('Erreur chargement rôles:', err);
    }
  };

  const handleGarageChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setGarageData(prev => ({ ...prev, [name]: value }));
  };

  const handleGaragisteChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setGaragisteData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateGarage = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const garage = await createGarage(garageData);
      setCreatedGarage(garage);
      setSuccess(`Garage "${garage.nom}" créé avec succès !`);
      
      setTimeout(() => {
        setStep(2);
        setSuccess('');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGaragiste = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const garageId = (createdGarage as any)?._id || (selectedGarage as any)?._id;
console.log('🔍 garageId trouvé:', garageId);
console.log('🔍 createdGarage:', createdGarage);
console.log('🔍 selectedGarage:', selectedGarage);
    try {
      const garagiste = await createGaragiste(garageId, garagisteData);
      setSuccess(`Garagiste "${garagiste.username}" créé avec succès !`);
      
      setTimeout(() => {
        resetForm();
        fetchGarages();
        setView('list');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };



  // ⭐ FONCTION EDIT - DÉFINIE ICI
// ⭐ FONCTION EDIT - MODIFIÉE
const handleEditGarage = (garage: any) => {
  console.log('🔧 Édition du garage:', garage);
  setGarageToEdit(garage);
  setGarageData({
    garagenom: garage.nom || '',              // 🔥 CHANGÉ: nom au lieu de garagenom
    matriculefiscal: garage.matriculeFiscal || '',
    emailProfessionnel: garage.emailProfessionnel || '',
    telephoneProfessionnel: garage.telephoneProfessionnel || '',
    governorateId: garage.governorateId || '',     // 🔥 AJOUTÉ
    governorateName: garage.governorateName || '',
    cityId: garage.cityId || '',                   // 🔥 AJOUTÉ
    cityName: garage.cityName || '',
    streetAddress: garage.streetAddress || '',
    description: garage.description || '',
    horaires: garage.horaires || '',
    location: garage.location || null,
  });
  setView('editGarage');
};

const handleUpdateGarage = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  setSuccess('');

  try {
    console.log('📤 Données envoyées:', garageData);

    const updateData = {
      garagenom: garageData.garagenom,           // 🔥 Frontend → Backend
      emailProfessionnel: garageData.emailProfessionnel,
      telephoneProfessionnel: garageData.telephoneProfessionnel,
      governorateId: garageData.governorateId,   // 🔥 AJOUTÉ
      governorateName: garageData.governorateName,
      cityId: garageData.cityId,                 // 🔥 AJOUTÉ
      cityName: garageData.cityName,
      streetAddress: garageData.streetAddress,
      description: garageData.description,
      horaires: garageData.horaires,
      location: garageData.location, 
    };

    console.log('📦 Payload final:', updateData);

    await updateGarage((garageToEdit as any)._id, updateData);
    setSuccess('✅ Garage modifié avec succès !');
    
    setTimeout(() => {
      resetForm();
      fetchGarages();
      setView('list');
    }, 2000);
  } catch (err: any) {
    console.error('❌ Erreur:', err);
    setError(err.message || 'Erreur lors de la modification');
  } finally {
    setLoading(false);
  }
};

  const handleViewDetails = (garage: any) => {
    setSelectedGarageForDetails(garage);
    setView('details');
  };

const resetForm = () => {
  setStep(1);
  setCreatedGarage(null);
  setSelectedGarage(null);
  setGarageToEdit(null);
  setGarageData({
    garagenom: '',
    matriculefiscal: '',
    governorateId: '',      // 🔥 AJOUTÉ
    governorateName: '',
    cityId: '',             // 🔥 AJOUTÉ
    cityName: '',
    streetAddress: '',
    description: '',
    horaires: '',
    emailProfessionnel: '',
    telephoneProfessionnel: '',
    location: null, 
  });
  setGaragisteData({
    username: '',
    email: '',
    password: '',
    phone: '',
    roleId: roles.find((r: any) => r.name === 'Admin Garage')?._id || ''
  });
  setError('');
  setSuccess('');
};

  const startCreateGarage = () => {
    resetForm();
    setView('createGarage');
    setStep(1);
  };

  const startAddGaragiste = (garage: any) => {
    setSelectedGarage(garage);
    setGaragisteData({
      username: '',
      email: '',
      password: '',
      phone: '',
      roleId: roles.find((r: any) => r.name === 'Admin Garage')?._id || ''
    });
    setError('');
    setSuccess('');
    setView('addGaragiste');
  };

const handleDeleteGarage = (garage: any) => {
  setConfirmDialog({
    isOpen: true,
    title: '⚠️ Supprimer le garage',
    message: `Cette action va supprimer :

- Le garage "${garage.nom}"
- Tous les garagistes de ce garage
- Toutes leurs données associées

Cette action est IRRÉVERSIBLE !`,
    confirmText: 'Supprimer',
    cancelText: 'Annuler',
    type: 'danger',
    requireTextConfirm: true,
    textToConfirm: garage.nom,
    onConfirm: async () => {
      setLoading(true);
      setError('');
      setSuccess('');

      try {
        const result = await deleteGarage(garage._id);
        setSuccess(`✅ ${result.message} — ${result.deletedGaragistes} garagiste(s) supprimé(s)`);
        await fetchGarages();
      } catch (err: any) {
        setError(err.message || 'Erreur lors de la suppression');
      } finally {
        setLoading(false);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    }
  });
};


  // ========== VUES (RENDER) ==========

  // ⭐ VUE LISTE - UNE SEULE FOIS
if (view === 'list') {
  return (
    <>
      <GarageList
        garages={garages}
        onCreateGarage={startCreateGarage}
        onAddGaragiste={startAddGaragiste}
        onViewDetails={handleViewDetails}
        onEditGarage={handleEditGarage}
        onDeleteGarage={handleDeleteGarage}
      />

      <ConfirmDialog
        {...confirmDialog}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
      />
    </>
  );
}


  // VUE CRÉATION GARAGE
  if (view === 'createGarage') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Créer un Garage</h1>
            <button
              onClick={() => { resetForm(); setView('list'); }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className={`flex items-center gap-2 ${step === 1 ? 'text-blue-600' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 1 ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
              }`}>
                {step === 1 ? '1' : '✓'}
              </div>
              <span className="font-medium">Informations du Garage</span>
            </div>
            
            <ArrowRight className="w-5 h-5 text-gray-400" />
            
            <div className={`flex items-center gap-2 ${step === 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className="font-medium">Admin Garage</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-800 text-sm">{success}</p>
            </div>
          )}

          {step === 1 && (
            <GarageForm
              garageData={garageData}
              onChange={handleGarageChange}
              onSubmit={handleCreateGarage}
              loading={loading}
            />
          )}

          {step === 2 && createdGarage && (
            <GaragisteForm
              garagisteData={garagisteData}
              roles={roles}
              onChange={handleGaragisteChange}
              onSubmit={handleCreateGaragiste}
              onBack={() => setStep(1)}
              onCancel={resetForm}
              loading={loading}
              showBackButton={true}
              successMessage={`Garage "${(createdGarage as any).nom}" créé avec succès. Ajoutez maintenant un administrateur pour ce garage.`}
            />
          )}
        </div>
      </div>
    );
  }

  // ⭐ VUE ÉDITION GARAGE
  if (view === 'editGarage' && garageToEdit) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Modifier le Garage</h1>
              <p className="text-gray-600 mt-1">{(garageToEdit as any).nom}</p>
            </div>
            <button
              onClick={() => { resetForm(); setView('list'); }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <p className="text-green-800 text-sm">{success}</p>
            </div>
          )}

          <GarageEditForm
  garageData={garageData}
  onChange={handleGarageChange}
  onSubmit={handleUpdateGarage}
  loading={loading}
  onLocationChange={(coords) => {  // 🔥 AJOUTÉ
    setGarageData(prev => ({
      ...prev,
      location: {
        type: 'Point',
        coordinates: [coords[1], coords[0]]
      }
    }));
  }}
/>
        </div>
      </div>
    );
  }

  // VUE AJOUT GARAGISTE
  if (view === 'addGaragiste' && selectedGarage) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ajouter un Garagiste</h1>
              <p className="text-gray-600 mt-1">Pour le garage: {(selectedGarage as any).nom}</p>
            </div>
            <button
              onClick={() => { resetForm(); setView('list'); }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-800 text-sm">{success}</p>
            </div>
          )}

          <GaragisteForm
            garagisteData={garagisteData}
            roles={roles}
            onChange={handleGaragisteChange}
            onSubmit={handleCreateGaragiste}
            onCancel={resetForm}
            loading={loading}
          />
        </div>
      </div>
    );
  }

  // VUE DÉTAILS
  if (view === 'details' && selectedGarageForDetails) {
    return (
      <GarageDetails
        garageId={(selectedGarageForDetails as any)._id}
        onBack={() => {
          setSelectedGarageForDetails(null);
          setView('list');
        }}
        onAddGaragiste={() => startAddGaragiste(selectedGarageForDetails)}
      />
    );
  }

  <ConfirmDialog
  {...confirmDialog}
  onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
  onInputChange={(val: string) =>
    setConfirmDialog(prev => ({ ...prev, inputValue: val }))
  }
/>


  return null;
}