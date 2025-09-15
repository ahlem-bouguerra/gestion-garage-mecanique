"use client"
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ClientReservationManagement() {
  const [reservations, setReservations] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [responseData, setResponseData] = useState({
    action: '',
    newDate: '',
    newHeureDebut: '',
    message: ''
  });

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/reservations");
        setReservations(res.data);
      } catch (err) {
        console.error("Erreur fetch reservations:", err);
      }
    };
    fetchReservations();
  }, []);

  const handleReservationClick = (reservation) => {
    setSelectedReservation(reservation);
    
    // Formater les dates correctement
    const formatDate = (dateInput) => {
      if (!dateInput) return '';
      const date = new Date(dateInput);
      return date.toISOString().split('T')[0]; // Format YYYY-MM-DD
    };
    
    // Initialiser avec les données de la contre-proposition si elle existe
    setResponseData({
      action: '',
      newDate: formatDate(reservation.creneauPropose?.date || reservation.creneauDemande.date),
      newHeureDebut: reservation.creneauPropose?.heureDebut || reservation.creneauDemande.heureDebut,
      message: ''
    });
  };

  const handleResponse = async () => {
    if (!responseData.action || !selectedReservation) {
      console.log("Action ou réservation manquante:", { action: responseData.action, hasReservation: !!selectedReservation });
      return;
    }

    console.log("=== ENVOI DE LA REQUÊTE CLIENT ===");
    console.log("ID Réservation:", selectedReservation._id);
    console.log("Données envoyées:", responseData);
    console.log("URL:", `http://localhost:5000/api/update/reservations/${selectedReservation._id}`);

    try {
      const response = await axios.put(
        `http://localhost:5000/api/update/reservations/${selectedReservation._id}`,
        {
          action: responseData.action,
          newDate: responseData.newDate || undefined,
          newHeureDebut: responseData.newHeureDebut || undefined,
          message: responseData.message || undefined
        }
      );
      
      console.log("Réponse serveur:", response.data);
      
      // Recharger après update
      const res = await axios.get("http://localhost:5000/api/reservations");
      setReservations(res.data);
      setSelectedReservation(null);
      setResponseData({
        action: '',
        newDate: '',
        newHeureDebut: '',
        message: ''
      });

      // Notification de succès (optionnel)
      alert("Réservation mise à jour avec succès !");
      
    } catch (err) {
      console.error("=== ERREUR UPDATE CLIENT ===");
      console.error("Status:", err.response?.status);
      console.error("Message:", err.response?.data?.error || err.message);
      console.error("Détails:", err.response?.data?.details || 'Aucun détail');
      console.error("Erreur complète:", err.response?.data);
      
      // Afficher l'erreur à l'utilisateur
      alert(`Erreur: ${err.response?.data?.error || err.message}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'en_attente': return 'bg-yellow-100 text-yellow-800';
      case 'accepte': return 'bg-green-100 text-green-800';
      case 'refuse': return 'bg-red-100 text-red-800';
      case 'contre_propose': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'en_attente': return 'En attente';
      case 'accepte': return 'Acceptée';
      case 'refuse': return 'Refusée';
      case 'contre_propose': return 'Contre-proposée';
      default: return status;
    }
  };

  // Générer les options d'heures
  const generateTimeOptions = () => {
    const options = [];
    for (let i = 8; i <= 18; i++) {
      options.push(`${i.toString().padStart(2, '0')}:00`);
      if (i < 18) options.push(`${i.toString().padStart(2, '0')}:30`);
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // Fonction pour déterminer si le client peut agir
  const canClientAct = (reservation) => {
    return reservation.status === 'contre_propose';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Mes Réservations</h1>
        <p className="text-gray-600 mt-1">Consultez et gérez vos demandes de réservation</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Liste des réservations */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Mes demandes</h2>
          
          {reservations.map(reservation => (
            <div 
              key={reservation._id}
              onClick={() => handleReservationClick(reservation)}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedReservation?._id === reservation._id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-gray-800">{reservation.clientName}</h3>
                  <p className="text-sm text-gray-600">{reservation.serviceName}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                  {getStatusText(reservation.status)}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center gap-2">
                  <span>📅</span>
                  <span>{new Date(reservation.creneauDemande.date).toLocaleDateString('fr-FR')}</span>
                  <span>🕐</span>
                  <span>{reservation.creneauDemande.heureDebut}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📞</span>
                  <span>{reservation.clientPhone}</span>
                </div>
                {canClientAct(reservation) && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-block w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                    <span className="text-orange-600 text-xs font-medium">Action requise</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Détails et actions */}
        {selectedReservation && (
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Détails de la demande</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <h3 className="font-medium text-gray-700">Client</h3>
                <p className="text-gray-600">{selectedReservation.clientName}</p>
                <p className="text-sm text-gray-500">{selectedReservation.clientPhone}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700">Service demandé</h3>
                <p className="text-gray-600">{selectedReservation.serviceName}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700">Créneau initialement demandé</h3>
                <p className="text-gray-600">
                  {new Date(selectedReservation.creneauDemande.date).toLocaleDateString('fr-FR')} à {selectedReservation.creneauDemande.heureDebut}
                </p>
              </div>

              {/* Afficher la contre-proposition du garage */}
              {selectedReservation.creneauPropose && (
                <div>
                  <h3 className="font-medium text-gray-700">Créneau proposé par le garage</h3>
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-blue-800 font-medium">
                      {new Date(selectedReservation.creneauPropose.date).toLocaleDateString('fr-FR')} à {selectedReservation.creneauPropose.heureDebut}
                    </p>
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="font-medium text-gray-700">Description du problème</h3>
                <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded">
                  {selectedReservation.descriptionDepannage}
                </p>
              </div>

              {/* Afficher le message du garage */}
              {selectedReservation.messageGarage && (
                <div>
                  <h3 className="font-medium text-gray-700">Message du garage</h3>
                  <p className="text-gray-600 text-sm bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                    {selectedReservation.messageGarage}
                  </p>
                </div>
              )}
            </div>

            {/* Actions pour le client - seulement si contre-proposition */}
            {canClientAct(selectedReservation) && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700">Répondre à la contre-proposition</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="action" 
                      value="accepter_contre_proposition"
                      onChange={(e) => setResponseData({...responseData, action: e.target.value})}
                      className="text-green-600"
                    />
                    <span className="text-green-700 font-medium">Accepter le nouveau créneau</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="action" 
                      value="contre_proposer"
                      onChange={(e) => setResponseData({...responseData, action: e.target.value})}
                      className="text-blue-600"
                    />
                    <span className="text-blue-700 font-medium">Proposer un autre créneau</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="action" 
                      value="annuler"
                      onChange={(e) => setResponseData({...responseData, action: e.target.value})}
                      className="text-red-600"
                    />
                    <span className="text-red-700 font-medium">Annuler la demande</span>
                  </label>
                </div>

                {responseData.action === 'contre_proposer' && (
                  <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                    <h4 className="font-medium text-blue-800">Proposer un nouveau créneau</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-blue-700 mb-1">Date</label>
                        <input
                          type="date"
                          value={responseData.newDate}
                          onChange={(e) => setResponseData({...responseData, newDate: e.target.value})}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-2 py-1 text-sm border border-blue-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-blue-700 mb-1">Heure de début</label>
                        <select
                          value={responseData.newHeureDebut}
                          onChange={(e) => setResponseData({...responseData, newHeureDebut: e.target.value})}
                          className="w-full px-2 py-1 text-sm border border-blue-300 rounded"
                        >
                          {timeOptions.map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {(responseData.action === 'annuler' || responseData.action === 'contre_proposer') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message {responseData.action === 'annuler' ? '(optionnel)' : '(recommandé)'}
                    </label>
                    <textarea
                      value={responseData.message}
                      onChange={(e) => setResponseData({...responseData, message: e.target.value})}
                      placeholder={
                        responseData.action === 'annuler' 
                          ? "Expliquez pourquoi vous annulez (optionnel)"
                          : "Expliquez votre nouvelle proposition"
                      }
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded resize-none"
                    />
                  </div>
                )}

                <button
                  onClick={handleResponse}
                  disabled={!responseData.action || (responseData.action === 'contre_proposer' && (!responseData.newDate || !responseData.newHeureDebut))}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Envoyer la réponse
                </button>

                {/* Message de validation */}
                {responseData.action === 'contre_proposer' && (!responseData.newDate || !responseData.newHeureDebut) && (
                  <p className="text-red-600 text-sm mt-2">
                    ⚠️ Veuillez sélectionner une date et une heure pour votre proposition
                  </p>
                )}
              </div>
            )}

            {/* Affichage du statut pour les réservations non modifiables */}
            {!canClientAct(selectedReservation) && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Statut :</strong> {getStatusText(selectedReservation.status)}
                </p>
                {selectedReservation.status === 'en_attente' && (
                  <p className="text-sm text-gray-500 mt-1">
                    En attente de réponse du garage...
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}