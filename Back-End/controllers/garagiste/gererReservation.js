import Service from "../../models/Service.js";
import Reservation from "../../models/Reservation.js";
import FicheClient from "../../models/FicheClient.js";
import FicheClientVehicule from "../../models/FicheClientVehicule.js";



export const getReservations = async (req, res) => {
  try {
    // ✅ Récupérer l'ID du garage depuis le token (sécurisé)
    const garageId = req.user.garage;

    console.log('🔍 Récupération réservations pour garage:', garageId);

    // ✅ Filtrer UNIQUEMENT les réservations de ce garage
    const filter = { garageId };

    const reservations = await Reservation.find(filter)
      .populate('serviceId', 'name')
      .populate('garageId', 'nom telephoneProfessionnel')
      .populate('vehiculeId', 'immatriculation marque modele annee couleur typeCarburant kilometrage')
      .sort({ createdAt: -1 });

    console.log(`✅ ${reservations.length} réservations trouvées pour ce garage`);

    res.status(200).json(reservations);
  } catch (error) {
    console.error('❌ Erreur récupération réservations:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
export const updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, newDate, newHeureDebut, message } = req.body;

    console.log('=== UPDATE RESERVATION ===');
    console.log('ID:', id);
    console.log('Action:', action);
    console.log('Données reçues:', { newDate, newHeureDebut, message });

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ error: "Réservation introuvable" });
    }

    console.log('Réservation avant update:', {
      status: reservation.status,
      creneauDemande: reservation.creneauDemande,
    });

    // === ACTIONS DU GARAGE ===
    if (action === "accepter") {

      console.log('🔍 DEBUG CRÉATION FICHE CLIENT');
      console.log('reservation.clientPhone:', reservation.clientPhone);
      console.log('reservation.garageId:', reservation.garageId);
      console.log('reservation.clientName:', reservation.clientName);
      console.log('Type garageId:', typeof reservation.garageId);

// Dans updateReservation, remplacer le bloc try-catch par :

try {
  console.log('🔍 === DÉBUT CRÉATION FICHE CLIENT ===');
  
  let ficheClient = await FicheClient.findOne({
    telephone: reservation.clientPhone,
    garageId: reservation.garageId
  });

  if (!ficheClient) {
    console.log('🆕 Tentative de création de fiche...');
    
    const ficheData = {
      nom: reservation.clientName,
      type: "particulier",
      telephone: reservation.clientPhone,
      email: reservation.clientEmail || `${reservation.clientPhone}@default.com`,
      garageId: reservation.garageId,
      clientId: reservation.clientId
    };
    
    ficheClient = await FicheClient.create(ficheData);
    console.log('✅ Fiche créée:', ficheClient._id);
  }

  // Association véhicule
  if (reservation.vehiculeId && ficheClient) {
    const existingAssoc = await FicheClientVehicule.findOne({
      ficheClientId: ficheClient._id,
      vehiculeId: reservation.vehiculeId
    });

    if (!existingAssoc) {
      await FicheClientVehicule.create({
        ficheClientId: ficheClient._id,
        vehiculeId: reservation.vehiculeId,
        garageId: reservation.garageId,
        notes: `Ajouté via réservation ${reservation._id}`
      });
    }
  }

} catch (ficheErr) {
  console.error("❌ ERREUR CRÉATION FICHE:");
  console.error("Code:", ficheErr.code); // ⭐ Affichera 11000 si duplication
  console.error("Message:", ficheErr.message);
  
  // ⭐ Gestion spécifique erreur de duplication (code 11000)
  if (ficheErr.code === 11000) {
    console.warn("⚠️ Fiche en doublon détectée - recherche de la fiche existante...");
    
    // Récupérer la fiche existante basée sur l'erreur
    try {
      const ficheClient = await FicheClient.findOne({
        $or: [
          { telephone: reservation.clientPhone, garageId: reservation.garageId },
          { email: reservation.clientEmail, garageId: reservation.garageId },
          { nom: reservation.clientName, garageId: reservation.garageId }
        ]
      });
      
      if (ficheClient) {
        console.log('✅ Fiche existante récupérée:', ficheClient._id);
        
        // Associer le véhicule à la fiche existante
        if (reservation.vehiculeId) {
          const existingAssoc = await FicheClientVehicule.findOne({
            ficheClientId: ficheClient._id,
            vehiculeId: reservation.vehiculeId
          });

          if (!existingAssoc) {
            await FicheClientVehicule.create({
              ficheClientId: ficheClient._id,
              vehiculeId: reservation.vehiculeId,
              garageId: reservation.garageId,
              notes: `Ajouté via réservation ${reservation._id}`
            });
            console.log('✅ Véhicule associé à la fiche existante');
          }
        }
      }
    } catch (findErr) {
      console.error("❌ Erreur lors de la récupération de la fiche existante:", findErr);
    }
  }
}
            reservation.status = "accepte";
      reservation.messageGarage = message || null;

    } else if (action === "refuser") {
      reservation.status = "refuse";
      reservation.messageGarage = message || "Demande refusée";

    } else if (action === "contre_proposer") {
      // CORRECTION : Sauvegarder le créneau proposé par le garage
      if (!newDate || !newHeureDebut) {
        return res.status(400).json({ error: "Date et heure requises pour une contre-proposition" });
      }

      reservation.status = "contre_propose";
      reservation.messageGarage = message || "Nouveau créneau proposé";
      // AJOUT : Sauvegarder le créneau proposé
      reservation.creneauPropose = {
        date: new Date(newDate),
        heureDebut: newHeureDebut
      };

      // === ACTIONS DU CLIENT ===
    } else if (action === "accepter_contre_proposition") {
      // CORRECTION : Vérifier que creneauPropose existe
      if (!reservation.creneauPropose || !reservation.creneauPropose.date) {
        return res.status(400).json({ error: "Aucune contre-proposition à accepter" });
      }

      reservation.status = "accepte";
      // On remplace le créneau demandé par celui proposé
      reservation.creneauDemande = {
        date: reservation.creneauPropose.date,
        heureDebut: reservation.creneauPropose.heureDebut
      };
      reservation.messageClient = message || "Contre-proposition acceptée";
      // AJOUT : Nettoyer la contre-proposition
      reservation.creneauPropose = undefined;

    } else if (action === "annuler") {
      reservation.status = "annule";
      reservation.messageClient = message || "Demande annulée par le client";

    } else if (action === "client_contre_proposer") {
      // CORRECTION : Validation des données requises
      if (!newDate || !newHeureDebut) {
        return res.status(400).json({ error: "Date et heure requises pour une contre-proposition" });
      }

      reservation.status = "en_attente";
      reservation.creneauDemande = {
        date: new Date(newDate),
        heureDebut: newHeureDebut
      };
      // On efface l'ancienne contre-proposition du garage
      reservation.creneauPropose = undefined;
      reservation.messageClient = message || "Nouvelle proposition de créneau";
      reservation.messageGarage = null;

    } else {
      return res.status(400).json({
        error: "Action non reconnue",
        validActions: ["accepter", "refuser", "contre_proposer", "accepter_contre_proposition", "annuler", "client_contre_proposer"]
      });
    }

    // CORRECTION : Marquer les champs modifiés explicitement
    reservation.markModified('creneauDemande');
    reservation.markModified('creneauPropose');
    reservation.markModified('messageGarage');
    reservation.markModified('messageClient');

    const updatedReservation = await reservation.save();

    console.log('Réservation après update:', {
      status: updatedReservation.status,
      creneauDemande: updatedReservation.creneauDemande,
      creneauPropose: updatedReservation.creneauPropose,
      messageGarage: updatedReservation.messageGarage,
      messageClient: updatedReservation.messageClient
    });

    res.json({
      success: true,
      reservation: updatedReservation,
      message: "Réservation mise à jour avec succès"
    });


  } catch (error) {
    console.error("=== ERREUR UPDATE RESERVATION ===");
    console.error("Erreur complète:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      error: "Erreur serveur lors de la mise à jour",
      details: error.message
    });
  }


};