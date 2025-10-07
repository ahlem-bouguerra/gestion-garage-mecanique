import { User } from "../../models/User.js";
import  Service  from "../../models/Service.js";
import  Reservation  from "../../models/Reservation.js";
import FicheClient from "../../models/FicheClient.js";
import FicheClientVehicule from "../../models/FicheClientVehicule.js";



export const getReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate('serviceId', 'name') // Populer seulement le champ 'name' du service
      .populate('garageId', 'username phone') // Optionnel: populer aussi le garage
      .populate('vehiculeId', 'immatriculation marque modele annee couleur typeCarburant kilometrage')
      .sort({ createdAt: -1 }); // Trier par date de création décroissante

    res.status(200).json(reservations);
  } catch (error) {
    console.error('Erreur lors de la récupération des réservations:', error);
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
    if (action === "accepter") {
  console.log("🔵 DÉBUT ACCEPTATION");
  
  reservation.status = "accepte";
  reservation.messageGarage = message || null;
  
  // ✅ CRÉER/RÉCUPÉRER LA FICHE CLIENT (ICI, DANS LE IF)
  try {
    console.log("clientPhone:", reservation.clientPhone);
    console.log("garageId:", reservation.garageId);
    
    let ficheClient = await FicheClient.findOne({
      telephone: reservation.clientPhone,
      garagisteId: reservation.garageId
    });
    
    console.log("Fiche trouvée?", ficheClient);
    
    if (!ficheClient) {
      console.log("🟢 Création fiche client");
      ficheClient = await FicheClient.create({
        nom: reservation.clientName,
        type: "particulier",
        telephone: reservation.clientPhone,
        email: reservation.clientEmail || `${reservation.clientPhone}@temp.com`,
        garagisteId: reservation.garageId
      });
      console.log("✅ Fiche créée:", ficheClient._id);
    }
    
    // ✅ ASSOCIER LE VÉHICULE
    if (reservation.vehiculeId) {
      console.log("🔵 Vérif association véhicule");
      const existingAssoc = await FicheClientVehicule.findOne({
        ficheClientId: ficheClient._id,
        vehiculeId: reservation.vehiculeId
      });
      
      if (!existingAssoc) {
        console.log("🟢 Création association");
        await FicheClientVehicule.create({
          ficheClientId: ficheClient._id,
          vehiculeId: reservation.vehiculeId,
          garageId: reservation.garageId,
          notes: `Ajouté via réservation ${reservation._id}`
        });
        console.log("✅ Association créée");
      }
    }
  } catch (ficheErr) {
    console.error("❌ Erreur création fiche:", ficheErr.message);
  }
}

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