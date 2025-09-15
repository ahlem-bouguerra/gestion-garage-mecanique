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


export const getReservations =  async (req, res) => {
  try {
    const reservations = await Reservation.find();
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération" });
  }
};



export const updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, newDate, newHeureDebut, message } = req.body;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ error: "Réservation introuvable" });
    }

    // Logique de mise à jour selon action
    if (action === "accepter") {
      reservation.status = "accepte";
    } else if (action === "refuser") {
      reservation.status = "refuse";
      reservation.messageGarage = message;
    } else if (action === "contre_proposer") {
      reservation.status = "contre_propose";
      // On modifie directement le créneau demandé
      reservation.creneauDemande = {
        date: newDate || reservation.creneauDemande.date,
        heureDebut: newHeureDebut || reservation.creneauDemande.heureDebut,
      };
      reservation.messageGarage = message;
    }

    await reservation.save();
    res.json({ success: true, reservation });
  } catch (error) {
    console.error("Erreur update reservation:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

