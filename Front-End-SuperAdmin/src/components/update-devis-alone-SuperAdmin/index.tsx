"use client";
import { useState, useEffect } from 'react';
import { Plus, X, Check, User, Car, Calendar, Euro, ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAllGarageClients, loadVehiculesByClient, updateDevis, getDevisById } from "../devis/api";

export default function DevisUpdateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const garageId = searchParams.get('garageId');
  const devisId = searchParams.get('devisId'); // 🆕 ID du devis à modifier

  const [clients, setClients] = useState([]);
  const [vehicules, setVehicules] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedVehiculeId, setSelectedVehiculeId] = useState("");
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingVehicules, setLoadingVehicules] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDevis, setLoadingDevis] = useState(true);

  const [formData, setFormData] = useState({
    clientName: "",
    vehicleInfo: "",
    inspectionDate: new Date().toISOString().split('T')[0],
    services: [{ piece: "", quantity: 1, unitPrice: 0 }],
    maindoeuvre: 0,
    tvaRate: 19,
    remiseRate: 0,
    estimatedTime: { days: 0, hours: 0, minutes: 0 }
  });

  // 🆕 Charger le devis existant
  useEffect(() => {
    if (!garageId || !devisId) {
      alert("⚠️ Paramètres manquants");
      router.push('/gestion-centrale');
      return;
    }
    loadDevisData();
    loadClients();
  }, [garageId, devisId]);

  const loadDevisData = async () => {
    setLoadingDevis(true);
    try {
      const devis = await getDevisById(devisId);
      
      // Remplir le formulaire avec les données existantes
      setFormData({
        clientName: devis.clientName || "",
        vehicleInfo: devis.vehicleInfo || "",
        inspectionDate: devis.inspectionDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        services: devis.services?.length > 0 ? devis.services.map(s => ({
          piece: s.piece || "",
          quantity: s.quantity || 1,
          unitPrice: s.unitPrice || 0
        })) : [{ piece: "", quantity: 1, unitPrice: 0 }],
        maindoeuvre: devis.maindoeuvre || 0,
        tvaRate: devis.tvaRate || 19,
        remiseRate: devis.remiseRate || 0,
        estimatedTime: devis.estimatedTime || { days: 0, hours: 0, minutes: 0 }
      });

      setSelectedClient(devis.clientId || "");
      setSelectedVehiculeId(devis.vehiculeId || "");

      // Charger les véhicules du client
      if (devis.clientId) {
        const vehs = await loadVehiculesByClient(devis.clientId, garageId);
        setVehicules(vehs || []);
      }

    } catch (error) {
      console.error("Erreur chargement devis:", error);
      alert("❌ Erreur lors du chargement du devis");
      router.push('/gestion-centrale');
    }
    setLoadingDevis(false);
  };

  const loadClients = async () => {
    setLoadingClients(true);
    try {
      const clientsData = await getAllGarageClients(garageId);
      setClients(clientsData || []);
    } catch (error) {
      console.error("Erreur chargement clients:", error);
      alert("❌ Erreur lors du chargement des clients");
    }
    setLoadingClients(false);
  };

  const handleClientChange = async (clientId: string) => {
    setSelectedClient(clientId);
    setSelectedVehiculeId("");
    setVehicules([]);
    
    const client = clients.find((c: any) => c._id === clientId);
    if (client) {
      setFormData(prev => ({ 
        ...prev, 
        clientName: client.nom,
        vehicleInfo: ""
      }));
      
      setLoadingVehicules(true);
      try {
        const vehs = await loadVehiculesByClient(clientId, garageId);
        setVehicules(vehs || []);
      } catch (error) {
        console.error("Erreur chargement véhicules:", error);
        alert("❌ Erreur lors du chargement des véhicules");
      }
      setLoadingVehicules(false);
    }
  };

  const handleVehicleChange = (vehicleId: string) => {
    setSelectedVehiculeId(vehicleId);
    const veh = vehicules.find((v: any) => v._id === vehicleId);
    setFormData(prev => ({
      ...prev,
      vehicleInfo: veh ? `${veh.marque} ${veh.modele} (${veh.immatriculation})` : ""
    }));
  };

  const addService = () => {
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, { piece: "", quantity: 1, unitPrice: 0 }]
    }));
  };

  const removeService = (index: number) => {
    if (formData.services.length > 1) {
      setFormData(prev => ({
        ...prev,
        services: prev.services.filter((_, i) => i !== index)
      }));
    }
  };

  const updateService = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map((service, i) =>
        i === index ? { ...service, [field]: value } : service
      )
    }));
  };

  const calculateTotals = () => {
    const totalServicesHT = formData.services.reduce(
      (sum, service) => sum + (service.quantity * service.unitPrice), 0
    );
    const totalHT = totalServicesHT + formData.maindoeuvre;
    const montantTVA = totalHT * (formData.tvaRate / 100);
    const totalTTC = totalHT + montantTVA;
    const montantRemise = totalTTC * (formData.remiseRate / 100);
    const finalTotalTTC = totalTTC - montantRemise;

    return {
      totalServicesHT,
      totalHT,
      montantTVA,
      totalTTC,
      montantRemise,
      finalTotalTTC
    };
  };

  const totals = calculateTotals();

  // 🆕 Mettre à jour le devis
  const handleUpdateDevis = async () => {
    if (!selectedClient || !selectedVehiculeId) {
      alert("⚠️ Veuillez sélectionner un client et un véhicule");
      return;
    }

    if (formData.services.some(s => !s.piece.trim())) {
      alert("⚠️ Veuillez remplir toutes les pièces");
      return;
    }

    setLoading(true);
    try {
      const devisData = {
        garageId, // 🆕 Inclure garageId pour SuperAdmin
        clientId: selectedClient,
        vehiculeId: selectedVehiculeId,
        clientName: formData.clientName,
        vehicleInfo: formData.vehicleInfo,
        inspectionDate: formData.inspectionDate,
        services: formData.services,
        maindoeuvre: formData.maindoeuvre,
        tvaRate: formData.tvaRate,
        remiseRate: formData.remiseRate,
        estimatedTime: formData.estimatedTime,
        montantTVA: totals.montantTVA,
        montantRemise: totals.montantRemise
      };

      await updateDevis(devisId, devisData);
      
      alert("✅ Devis mis à jour avec succès !");
      router.push('/gestion-centrale');
      
    } catch (error) {
      console.error("Erreur mise à jour devis:", error);
      alert("❌ Erreur lors de la mise à jour du devis");
    }
    setLoading(false);
  };

  const handleCancel = () => {
    router.push('/gestion-centrale');
  };

  if (!garageId || !devisId) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-red-600 mb-4">⚠️ Paramètres manquants</p>
          <button
            onClick={() => router.push('/gestion-centrale')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  if (loadingDevis) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du devis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-lg mb-6">
          <button
            onClick={handleCancel}
            className="mb-4 flex items-center gap-2 text-white hover:text-blue-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Retour
          </button>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Check className="h-8 w-8" />
            Modifier le Devis
          </h1>
          <p className="text-blue-100 mt-2">Modifiez les informations ci-dessous</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {loadingClients ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Chargement des clients...</p>
            </div>
          ) : (
            <>
              {/* Section Client et Véhicule */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    Client *
                  </label>
                  <select
                    value={selectedClient}
                    onChange={(e) => handleClientChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Sélectionner un client --</option>
                    {clients.map((c: any) => (
                      <option key={c._id} value={c._id}>
                        {c.nom} {c.type && `(${c.type})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Car className="h-4 w-4 text-blue-600" />
                    Véhicule *
                  </label>
                  <select
                    value={selectedVehiculeId}
                    onChange={(e) => handleVehicleChange(e.target.value)}
                    disabled={!selectedClient}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">
                      {!selectedClient
                        ? "Sélectionnez d'abord un client"
                        : loadingVehicules
                        ? "Chargement des véhicules..."
                        : vehicules.length === 0
                        ? "Aucun véhicule trouvé"
                        : "-- Sélectionner un véhicule --"
                      }
                    </option>
                    {vehicules.map((v: any) => (
                      <option key={v._id} value={v._id}>
                        {v.marque} {v.modele} - {v.immatriculation} ({v.annee})
                      </option>
                    ))}
                  </select>
                  
                  {loadingVehicules && (
                    <div className="mt-1 text-sm text-blue-600 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Chargement...
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    Date Création *
                  </label>
                  <input
                    type="date"
                    value={formData.inspectionDate}
                    onChange={(e) => setFormData({ ...formData, inspectionDate: e.target.value })}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Services */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Services et Pièces</h3>
                  <button
                    onClick={addService}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Ajouter pièce</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.services.map((service, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                      {formData.services.length > 1 && (
                        <button
                          onClick={() => removeService(index)}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-1 transition-colors"
                          title="Supprimer cette ligne"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pièce *
                          </label>
                          <input
                            type="text"
                            value={service.piece}
                            onChange={(e) => updateService(index, 'piece', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Nom de la pièce ou service"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantité *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={service.quantity}
                            onChange={(e) => updateService(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Prix unitaire (DT)
                          </label>
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            value={service.unitPrice}
                            onChange={(e) => updateService(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total cette ligne :</span>
                          <span className="text-sm font-medium text-gray-900">
                            {(service.quantity * service.unitPrice).toFixed(3)} DT
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Main d'oeuvre, TVA, Remise, Temps estimé */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Euro className="h-4 w-4 inline mr-1" />
                    Main d'œuvre (DT)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.maindoeuvre}
                    onChange={(e) => setFormData({ ...formData, maindoeuvre: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Taux TVA (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.tvaRate}
                    onChange={(e) => setFormData({ ...formData, tvaRate: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remise (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.remiseRate}
                    onChange={(e) => setFormData({ ...formData, remiseRate: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temps Estimé
                  </label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      min="0"
                      value={formData.estimatedTime.days}
                      onChange={(e) => setFormData({
                        ...formData,
                        estimatedTime: { ...formData.estimatedTime, days: parseInt(e.target.value) || 0 }
                      })}
                      className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                      placeholder="J"
                      title="Jours"
                    />
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={formData.estimatedTime.hours}
                      onChange={(e) => setFormData({
                        ...formData,
                        estimatedTime: { ...formData.estimatedTime, hours: parseInt(e.target.value) || 0 }
                      })}
                      className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                      placeholder="H"
                      title="Heures"
                    />
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={formData.estimatedTime.minutes}
                      onChange={(e) => setFormData({
                        ...formData,
                        estimatedTime: { ...formData.estimatedTime, minutes: parseInt(e.target.value) || 0 }
                      })}
                      className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                      placeholder="M"
                      title="Minutes"
                    />
                  </div>
                </div>
              </div>

              {/* Récapitulatif */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 mb-6 border border-blue-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Euro className="h-5 w-5 text-blue-600" />
                  Récapitulatif
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-700">
                    <span>Total pièces HT:</span>
                    <span className="font-medium">{totals.totalServicesHT.toFixed(3)} DT</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Main d'œuvre:</span>
                    <span className="font-medium">{formData.maindoeuvre.toFixed(3)} DT</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2 text-gray-800">
                    <span>Total HT:</span>
                    <span>{totals.totalHT.toFixed(3)} DT</span>
                  </div>
                  <div className="flex justify-between text-blue-600">
                    <span>TVA ({formData.tvaRate}%):</span>
                    <span className="font-medium">{totals.montantTVA.toFixed(3)} DT</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2 text-green-700">
                    <span>Total TTC:</span>
                    <span>{totals.totalTTC.toFixed(3)} DT</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Remise ({formData.remiseRate}%):</span>
                    <span className="font-medium">-{totals.montantRemise.toFixed(3)} DT</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold border-t-2 pt-3 text-purple-700">
                    <span>Total final TTC:</span>
                    <span>{totals.finalTotalTTC.toFixed(3)} DT</span>
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex space-x-4">
                <button
                  onClick={handleUpdateDevis}
                  disabled={loading || !selectedClient || !selectedVehiculeId}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="h-4 w-4" />
                  <span>{loading ? 'Mise à jour...' : 'Mettre à jour le Devis'}</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}