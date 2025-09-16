import { User } from "../models/User.js";
import  Service  from "../models/Service.js";
import  Reservation  from "../models/Reservation.js";



export const createReservation = async (req, res) => {
  try {
    const {garageId,clientName,clientPhone,clientEmail,serviceId,creneauDemande,descriptionDepannage} = req.body;

    // Vérifier que le garage existe
    const garage = await User.findById(garageId);
    if (!garage) {
      return res.status(404).json({
        success: false,
        message: "Garage non trouvé",
      });
    }

    // Vérifier que le service existe
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service non trouvé",
      });
    }

    const conflictingReservations = await Reservation.find({
      garageId,
      "creneauDemande.date": creneauDemande.date,
      "creneauDemande.heureDebut": creneauDemande.heureDebut,
      status: { $in: ["en_attente", "confirmé"] },
    });

    if (conflictingReservations.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Ce créneau n'est pas disponible",
        conflictingReservations: conflictingReservations.map((r) => ({
          date: r.creneauDemande.date,
          heureDebut: r.creneauDemande.heureDebut,
          status: r.status,
        })),
      });
    }

    // Créer la réservation
    const reservation = new Reservation({
      garageId,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientEmail: clientEmail?.trim() || null,
      serviceId,
      creneauDemande: {
        date: new Date(creneauDemande.date),
        heureDebut: creneauDemande.heureDebut,
      },
      descriptionDepannage: descriptionDepannage.trim(),
      status: "en_attente",
    });

    const savedReservation = await reservation.save();

    // Peupler les données pour la réponse
    await savedReservation.populate([
      { path: "garageId", select: "name address city phone email" },
      { path: "serviceId", select: "name description" },
    ]);

    res.status(201).json({
      success: true,
      message: "Réservation créée avec succès",
      data: savedReservation,
    });
  } catch (error) {
    console.error("Erreur lors de la création de la réservation:", error);

    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Erreurs de validation",
        errors: validationErrors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};


export const getReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate('serviceId', 'name') // Populer seulement le champ 'name' du service
      .populate('garageId', 'username phone') // Optionnel: populer aussi le garage
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
      // Le garage accepte le créneau demandé
      reservation.status = "accepte";
      reservation.messageGarage = message || null;
      
    } else if (action === "refuser") {
      // Le garage refuse définitivement
      reservation.status = "refuse";
      reservation.messageGarage = message || "Demande refusée";
      
    } else if (action === "contre_proposer") {
      // Le garage propose un autre créneau
      reservation.status = "contre_propose";
      reservation.messageGarage = message || "Nouveau créneau proposé";

    // === ACTIONS DU CLIENT ===
    } else if (action === "accepter_contre_proposition") {
      // Le client accepte la contre-proposition du garage
      reservation.status = "accepte";
      // On remplace le créneau demandé par celui proposé
      reservation.creneauDemande = {
        date: reservation.creneauPropose.date,
        heureDebut: reservation.creneauPropose.heureDebut
      };
      reservation.messageClient = message || "Contre-proposition acceptée";
      
    } else if (action === "annuler") {
      // Le client annule sa demande
      reservation.status = "annule";
      reservation.messageClient = message || "Demande annulée par le client";
      
    } else if (action === "client_contre_proposer") {
      // Le client fait une nouvelle contre-proposition
      reservation.status = "en_attente"; // Retour en attente pour le garage
      // On met à jour le créneau demandé avec la nouvelle proposition du client
      reservation.creneauDemande = {
        date: new Date(newDate),
        heureDebut: newHeureDebut
      };
      // On efface l'ancienne contre-proposition du garage
      reservation.creneauPropose = undefined;
      reservation.messageClient = message || "Nouvelle proposition de créneau";
      reservation.messageGarage = null; // Reset du message garage
      
    } else {
      return res.status(400).json({ 
        error: "Action non reconnue", 
        validActions: ["accepter", "refuser", "contre_proposer", "accepter_contre_proposition", "annuler", "client_contre_proposer"]
      });
    }

    const updatedReservation = await reservation.save();
    
    console.log('Réservation après update:', {
      status: updatedReservation.status,
      creneauDemande: updatedReservation.creneauDemande,
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
    console.error("Erreur:", error);
    res.status(500).json({ 
      error: "Erreur serveur lors de la mise à jour",
      details: error.message
    });
  }
};