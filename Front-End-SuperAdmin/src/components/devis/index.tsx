"use client";
import { useEffect, useState } from "react";
import { getAllGarages, getDevisByGarage, getDevisById, deleteDevis, sendDevisByMail, createNewFacture, replaceFactureWithCredit, checkIfDevisModified, checkActiveFactureExists } from "./api";
import { Plus, Edit2, Eye, Send, Loader, Check, X, Car, User, Calendar, FileText, Euro, AlertCircle, Trash2, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Devis {
  _id: string;
  id: string;
  clientName: string;
  vehicleInfo: string;
  inspectionDate: string;
  estimatedTime: string;
  status: 'brouillon' | 'envoye' | 'accepte' | 'refuse';
  services: {
    piece: string;
    unitPrice: string;
    name: string;
    quantity: number;
    priceHT: number;
    totalHT: number;
  }[];
  totalServicesHT: number;
  maindoeuvre: number;
  tvaRate: number;
  montantTVA: number;
  remiseRate: number;
  montantRemise: number;
  totalTTC: number;
}

interface GarageQuoteSystemProps {
  selectedGarage?: string;  // Ajout
  onNavigate?: () => void;  // Ajout
}
export default function DevisSuperAdminPage({ selectedGarage: garageIdProp, onNavigate }: GarageQuoteSystemProps = {}) {
  const [garages, setGarages] = useState([]);
  const [selectedGarage, setSelectedGarage] = useState("");
  const [devis, setDevis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDevis, setSelectedDevis] = useState<Devis | null>(null);
  const [loadingDevisId, setLoadingDevisId] = useState<string | null>(null);
  const [garagesLoading, setGaragesLoading] = useState(true); // ✅ Ajout

  const showGarageSelector = !garageIdProp;

  const statusColors = {
    brouillon: 'bg-gray-100 text-gray-800',
    envoye: 'bg-blue-100 text-blue-800',
    accepte: 'bg-green-100 text-green-800',
    refuse: 'bg-red-100 text-red-800'
  };

  const router = useRouter();

  const handleRedirectToCreate = () => {
    if (!selectedGarage) {
      alert("⚠️ Veuillez d'abord sélectionner un garage");
      return;
    }
    router.push(`/create-devis-alone?garageId=${selectedGarage}`);
  };

  useEffect(() => {
    loadGarages();
  }, []);

  useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;

    if (selectedDevis) {
      header.classList.add("hidden");
    } else {
      header.classList.remove("hidden");
    }
  }, [selectedDevis]);
  // Ajouter cet useEffect après vos useEffect existants
  useEffect(() => {
    if (garageIdProp) {
      setSelectedGarage(garageIdProp);
      handleGarageChange(garageIdProp);
    }
  }, [garageIdProp]);

  const loadGarages = async () => {
    try {
      console.log('🔄 Début chargement garages...');
      setGaragesLoading(true);

      const data = await getAllGarages();

      console.log('📦 Data reçue dans loadGarages:', data);
      console.log('📊 Type de data:', typeof data);
      console.log('📏 Longueur:', Array.isArray(data) ? data.length : 'pas un tableau');

      if (Array.isArray(data) && data.length > 0) {
        console.log('✅ Garages trouvés:', data.length);
        setGarages(data);
      } else {
        console.warn('⚠️ Aucun garage reçu ou format incorrect');
        setGarages([]);
      }

    } catch (error) {
      console.error("❌ Erreur chargement garages:", error);
      setGarages([]);
    } finally {
      setGaragesLoading(false);
      console.log('✅ Chargement garages terminé');
    }
  };

  const handleGarageChange = async (garageId: string) => {
    console.log('🔄 Changement garage:', garageId);
    setSelectedGarage(garageId);
    setDevis([]);
    setLoading(true);

    if (garageId) {
      try {
        const devisList = await getDevisByGarage(garageId);
        console.log('📦 Devis reçus:', devisList);
        setDevis(devisList || []);
      } catch (error) {
        console.error("❌ Erreur chargement devis:", error);
        setDevis([]);
      }
    }
    setLoading(false);
  };

  const handleVoirDetails = async (devisId: string) => {
    setLoadingDevisId(devisId);
    try {
      const data = await getDevisById(devisId);
      setSelectedDevis(data);
    } catch (error) {
      console.error("Erreur:", error);
    }
    setLoadingDevisId(null);
  };

  const handleDeleteDevis = async (devisId: string) => {
    if (!confirm("⚠️ Êtes-vous sûr de vouloir supprimer ce devis ?")) {
      return;
    }

    try {
      await deleteDevis(devisId);
      alert("✅ Devis supprimé avec succès");
      handleGarageChange(selectedGarage);
    } catch (error) {
      console.error("Erreur suppression:", error);
      alert("❌ Erreur lors de la suppression du devis");
    }
  };

  const handleSendDevis = async (devisId: string) => {
    console.log('🚀 handleSendDevis appelé');
    console.log('📋 devisId:', devisId);
    console.log('🏢 selectedGarage:', selectedGarage);

    if (!selectedGarage) {
      alert("⚠️ Aucun garage sélectionné !");
      return;
    }

    if (!confirm("⚠️ Êtes-vous sûr d'envoyer ce devis par mail ?")) {
      return;
    }

    try {
      await sendDevisByMail(devisId, selectedGarage);
      alert("✅ Devis envoyé avec succès");
      handleGarageChange(selectedGarage);
    } catch (error) {
      console.error("Erreur envoi:", error);
      alert("❌ Erreur lors de l'envoi du devis");
    }
  };

  const handleCreateFacture = async (devis: any) => {
    try {
      setLoading(true);

      const garageId = devis.garageId;

      console.log("🔍 Étape 1 : Vérification facture existante pour devis:", devis._id);

      const existingFacture = await checkActiveFactureExists(devis._id, garageId);

      if (!existingFacture) {
        console.log("✅ Aucune facture existante → Création directe");

        const result = await createNewFacture(devis._id, garageId);

        if (result?.success) {
          alert(`✅ Facture N°${result.facture.numeroFacture} créée avec succès !`);
          return;
        } else {
          alert("❌ Impossible de créer la facture");
          return;
        }
      }

      console.log("⚠️ Facture existante trouvée:", existingFacture.numeroFacture);

      const isDevisModified = checkIfDevisModified(devis, existingFacture);

      console.log("📊 Devis modifié ?", isDevisModified);

      if (!isDevisModified) {
        alert(
          `⚠️ Une facture active existe déjà pour ce devis !\n\n` +
          `📄 Numéro : ${existingFacture.numeroFacture}\n` +
          `📅 Date : ${new Date(existingFacture.createdAt).toLocaleDateString()}\n\n` +
          `Le devis n'a pas été modifié depuis la création de cette facture.`
        );
        return;
      }

      const userConfirmed = window.confirm(
        `⚠️ Le devis a été modifié après la création de la facture !\n\n` +
        `📄 Facture existante : ${existingFacture.numeroFacture}\n` +
        `📅 Date facture : ${new Date(existingFacture.createdAt).toLocaleDateString()}\n` +
        `🔄 Dernière modification devis : ${new Date(devis.updatedAt).toLocaleDateString()}\n\n` +
        `Voulez-vous :\n` +
        `✅ Créer un AVOIR pour annuler l'ancienne facture\n` +
        `✅ Générer une NOUVELLE facture avec les données actuelles\n\n` +
        `Confirmer cette action ?`
      );

      if (!userConfirmed) {
        console.log("❌ Opération annulée par l'utilisateur");
        return;
      }

      console.log("🔄 Création avoir + nouvelle facture...");

      const result = await replaceFactureWithCredit(devis._id, garageId);

      if (result?.success) {
        let message = `✅ Opération réussie !\n\n`;

        if (result.creditNote) {
          message += `📝 Avoir créé : ${result.creditNote.creditNumber}\n`;
          message += `   (Annule la facture ${existingFacture.numeroFacture})\n\n`;
        }

        if (result.facture) {
          message += `📄 Nouvelle facture : ${result.facture.numeroFacture}\n`;
          message += `💰 Montant TTC : ${result.facture.finalTotalTTC?.toFixed(3)} DT`;
        }

        alert(message);
      } else {
        alert("❌ Erreur lors de la création de l'avoir et de la nouvelle facture");
      }

    } catch (error: any) {
      console.error("❌ Erreur création facture:", error);

      if (error.response?.status === 400) {
        alert(error.response?.data?.message || "❌ Données invalides");
      } else if (error.response?.status === 403) {
        alert("❌ Accès refusé");
      } else if (error.response?.status === 401) {
        alert("❌ Session expirée. Veuillez vous reconnecter.");
        window.location.href = "/auth/sign-in";
      } else if (error.response?.status === 404) {
        alert("❌ Devis non trouvé");
      } else {
        alert("❌ Une erreur est survenue lors de la création de la facture");
      }

    } finally {
      setLoading(false);
    }
  };

  // ✅ Debug: Afficher l'état actuel
  console.log('🎨 Render - État actuel:', {
    garagesCount: garages.length,
    garagesLoading,
    selectedGarage,
    devisCount: devis.length
  });

  return (
    <div className="min-h-screen  p-3">
      <div className="w-full">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-lg mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FileText className="h-8 w-8" />
          Gestion des Devis - Super Admin
        </h1>
        <p className="text-blue-100 mt-2">Consultez tous les devis de vos garages</p>
      </div>
      {showGarageSelector && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <label className="block text-gray-700 font-semibold mb-3 flex items-center gap-2">
            <Car className="h-5 w-5 text-blue-600" />
            Sélectionner un garage
          </label>

          {/* ✅ Afficher un loader pendant le chargement */}
          {garagesLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Chargement des garages...</p>
            </div>
          ) : garages.length === 0 ? (
            <div className="text-center py-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-2" />
              <p className="text-yellow-800 font-medium">Aucun garage disponible</p>
              <p className="text-yellow-600 text-sm mt-1">Veuillez créer un garage d'abord</p>
            </div>
          ) : (
            <select
              onChange={(e) => handleGarageChange(e.target.value)}
              value={selectedGarage}
              className="w-full p-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-lg outline-none transition-all cursor-pointer hover:from-blue-600 hover:to-blue-700 focus:ring-4 focus:ring-blue-300"
            >
              <option value="" className="bg-white text-gray-800">
                -- Choisissez un garage ({garages.length} disponible{garages.length > 1 ? 's' : ''}) --
              </option>
              {garages.map((g: any) => (
                <option key={g._id} value={g._id} className="bg-white text-gray-800">
                  {g.nom || g.name || 'Garage sans nom'}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
      {selectedGarage && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Liste des devis
          </h2>

          <button
            onClick={handleRedirectToCreate}
            className="mb-4 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Créer un nouveau devis
          </button>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Chargement des devis...</p>
            </div>
          ) : devis.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Aucun devis trouvé pour ce garage.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {devis.map((d: any) => (
                <div
                  key={d._id}
                  className="border border-gray-200 rounded-xl p-5 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      {d.id}
                    </span>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColors[d.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                      {d.status?.charAt(0).toUpperCase() + d.status?.slice(1)}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">

<div className="flex items-center gap-2 text-gray-700">
  <User className="h-4 w-4 text-gray-400" />
  <span className="font-medium">{d.clientName || 'Client inconnu'}</span>
</div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <Car className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{d.vehicleInfo || 'Non renseigné'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {new Date(d.inspectionDate).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">Total TTC</span>
                      <span className="text-xl font-bold text-green-600">
                        {(Number(d.totalTTC || 0) - Number(d.montantRemise || 0)).toFixed(3)} DT
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVoirDetails(d._id)}
                      disabled={loadingDevisId === d._id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                    >
                      {loadingDevisId === d._id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Chargement...
                        </>
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>

                    <button
                      onClick={() => router.push(`/update-devis-alone?garageId=${selectedGarage}&devisId=${d._id}`)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-yellow-700"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteDevis(d._id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => handleSendDevis(d._id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <Mail className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => handleCreateFacture(d)}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin" />
                          <span>Traitement...</span>
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4" />
                          <span>Créer Facture</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Détails Devis */}
      {selectedDevis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full m-4 max-h-screen overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Devis {selectedDevis.id}</h2>
                <button
                  onClick={() => setSelectedDevis(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Informations Client</h3>
                  <p className="text-gray-600">Nom: {selectedDevis.clientName}</p>
                  <p className="text-gray-600">Véhicule: {selectedDevis.vehicleInfo}</p>
                  <p className="text-gray-600">Date d'inspection: {selectedDevis.inspectionDate}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Statut</h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[selectedDevis.status]}`}>
                    {selectedDevis.status.charAt(0).toUpperCase() + selectedDevis.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-4">Détail des Services</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pièce</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qté</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Prix Unit.</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedDevis.services.map((service, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">{service.piece}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{service.quantity}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{Number(service.unitPrice || 0).toFixed(3)} DT</td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">
                            {(Number(service.quantity || 0) * Number(service.unitPrice || 0)).toFixed(3)} DT
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Total pièces HT:</span>
                    <span>{(selectedDevis.totalServicesHT || 0).toFixed(3)} DT</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Main d'œuvre:</span>
                    <span>{(selectedDevis.maindoeuvre || 0).toFixed(3)} DT</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-2">
                    <span>Total HT:</span>
                    <span>{((selectedDevis.totalServicesHT || 0) + (selectedDevis.maindoeuvre || 0)).toFixed(3)} DT</span>
                  </div>
                  <div className="flex justify-between text-blue-600">
                    <span>TVA ({selectedDevis.tvaRate || 19}%):</span>
                    <span>{(selectedDevis.montantTVA || 0).toFixed(3)} DT</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>REMISE ({selectedDevis.remiseRate || 0}%):</span>
                    <span>{(selectedDevis.montantRemise || 0).toFixed(3)} DT</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2 text-green-700">
                    <span>Total TTC:</span>
                    <span>{(selectedDevis.totalTTC || 0).toFixed(3)} DT</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2 text-yellow-700">
                    <span>Total TTC après remise:</span>
                    <span>{((selectedDevis.totalTTC || 0) - (selectedDevis.montantRemise || 0)).toFixed(3)} DT</span>
                  </div>
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