import { Garagiste } from "../../models/Garagiste.js";
import  Service  from "../../models/Service.js";
import  Reservation  from "../../models/Reservation.js";
import { Client } from "../../models/Client.js";
import Vehicule from "../../models/Vehicule.js";
import {Garage} from "../../models/Garage.js";



export const ClientCreateReservation = async (req, res) => {
  try {
    const {garageId,clientId,vehiculeId,clientName,clientPhone,clientEmail,serviceId,creneauDemande,descriptionDepannage} = req.body;

    // Vérifier que le client existe (optionnel mais recommandé)
    if (clientId) {
      const client = await Client.findById(clientId);
      if (!client) {
        return res.status(404).json({
          success: false,
          message: "Client non trouvé",
        });
      }
    }

    if (vehiculeId) {
      const vehicule = await Vehicule.findById(vehiculeId);
      if (!vehicule) {
        return res.status(404).json({
          success: false,
          message: "vehicule non trouvé",
        });
      }
    }


    // Vérifier que le garage existe
    const garage = await Garage.findById(garageId);
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
      vehiculeId,
      clientId,
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
      { path: "garageId", select: "nom governorateName cityName streetAddress telephoneProfessionnel emailProfessionnel" },
      { path: "serviceId", select: "name description" },
      { path: "clientId", select: "username email phone" },
      { path: "vehiculeId", select: "marque modele immatriculation annee typeCarburant kilometrage" }
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


export const ClientGetReservations = async (req, res) => {
  try {
    const clientId = req.client._id;  // <- corriger ici
    const reservations = await Reservation.find({ clientId })
      .populate('serviceId', 'name')
      .populate('garageId', 'nom telephoneProfessionnel')
      .populate('vehiculeId', 'immatriculation marque modele annee couleur typeCarburant kilometrage')


      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reservations
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur' 
    });
  }
};

export const ClientUpdateReservation = async (req, res) => {
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

export const ClientCancelReservation = async (req, res) => {
  try {
    const clientId = req.client._id;
    const { reservationId } = req.params; // ou req.body
    
    // Trouver la réservation
    const reservation = await Reservation.findOne({ 
      _id: reservationId, 
      clientId 
    });
    
    if (!reservation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Réservation non trouvée' 
      });
    }
    
    // Vérifier si elle peut être annulée
    if (reservation.status === 'annule') {
      return res.status(400).json({ 
        success: false, 
        message: 'Réservation déjà annulée' 
      });
    }
    
    // Annuler la réservation
    reservation.status = 'annule';
    await reservation.save();
    
    res.status(200).json({ 
      success: true, 
      message: 'Réservation annulée avec succès',
      reservation 
    });
    
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
};