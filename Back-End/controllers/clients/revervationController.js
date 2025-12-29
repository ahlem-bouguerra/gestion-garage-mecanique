import { Garagiste } from "../../models/Garagiste.js";
import  Service  from "../../models/Service.js";
import  Reservation  from "../../models/Reservation.js";
import { Client } from "../../models/Client.js";
import Vehicule from "../../models/Vehicule.js";
import {Garage} from "../../models/Garage.js";
import FicheClient from "../../models/FicheClient.js";
import FicheClientVehicule from "../../models/FicheClientVehicule.js";



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
    const clientId = req.client._id;
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // ✅ Construire les filtres correctement
    const filters = { clientId };
    
    // ✅ CORRECTION : Gérer le filtre de statut
    if (req.query.status && req.query.status !== 'all_month') {
      // Si un statut spécifique est demandé, on filtre par ce statut
      filters.status = req.query.status;
    }
    
    // ✅ CORRECTION : Pour 'all_month', on ne filtre PAS par statut
    // On retourne toutes les réservations du mois en cours (tous statuts confondus)
    if (!req.query.status || req.query.status === 'all_month') {
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
      
      filters['creneauDemande.date'] = { 
        $gte: startOfMonth,
        $lte: endOfMonth 
      };
    }

    // ✅ Log pour debug
    console.log('🔍 Filtres appliqués:', JSON.stringify(filters, null, 2));
    console.log('📄 Page:', page, 'Limit:', limit);

    // Compter le total
    const total = await Reservation.countDocuments(filters);
    console.log('📊 Total trouvé:', total);

    // Récupérer les réservations
    const reservations = await Reservation.find(filters)
      .populate('serviceId', 'name')
      .populate('garageId', 'nom telephoneProfessionnel emailProfessionnel')
      .populate('vehiculeId', 'immatriculation marque modele annee couleur typeCarburant kilometrage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const pages = Math.ceil(total / limit);
    
    console.log('✅ Pages calculées:', pages);

    res.status(200).json({
      success: true,
      reservations,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasMore: page * limit < total
      }
    });
  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur',
      error: error.message 
    });
  }
};

export const ClientUpdateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, newDate, newHeureDebut, message } = req.body;

    console.log('=== UPDATE RESERVATION CLIENT ===');
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

    // === ACTIONS DU CLIENT ===
    if (action === "accepter_contre_proposition") {
      // Vérifier que creneauPropose existe
      if (!reservation.creneauPropose || !reservation.creneauPropose.date) {
        return res.status(400).json({ error: "Aucune contre-proposition à accepter" });
      }

      // ✨ CRÉATION FICHE CLIENT (même logique que le garage)
      try {
        console.log('🔍 === DÉBUT CRÉATION FICHE CLIENT (Client accepte) ===');
        
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
        } else {
          console.log('ℹ️ Fiche existante trouvée:', ficheClient._id);
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
              notes: `Ajouté via réservation ${reservation._id} (acceptation client)`
            });
            console.log('✅ Véhicule associé à la fiche');
          }
        }

      } catch (ficheErr) {
        console.error("❌ ERREUR CRÉATION FICHE:");
        console.error("Code:", ficheErr.code);
        console.error("Message:", ficheErr.message);
        
        // Gestion erreur de duplication (code 11000)
        if (ficheErr.code === 11000) {
          console.warn("⚠️ Fiche en doublon détectée - recherche de la fiche existante...");
          
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
                    notes: `Ajouté via réservation ${reservation._id} (doublon résolu)`
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

      // Mise à jour de la réservation
      reservation.status = "accepte";
      reservation.creneauDemande = {
        date: reservation.creneauPropose.date,
        heureDebut: reservation.creneauPropose.heureDebut
      };
      reservation.messageClient = message || "Contre-proposition acceptée";
      reservation.creneauPropose = undefined;
      
    } else if (action === "annuler") {
      reservation.status = "annule";
      reservation.messageClient = message || "Demande annulée par le client";
      
    } else if (action === "client_contre_proposer") {
      if (!newDate || !newHeureDebut) {
        return res.status(400).json({ error: "Date et heure requises pour une contre-proposition" });
      }
      
      reservation.status = "en_attente";
      reservation.creneauDemande = {
        date: new Date(newDate),
        heureDebut: newHeureDebut
      };
      reservation.creneauPropose = undefined;
      reservation.messageClient = message || "Nouvelle proposition de créneau";
      reservation.messageGarage = null;
      
    } else {
      return res.status(400).json({ 
        error: "Action non reconnue", 
        validActions: ["accepter_contre_proposition", "annuler", "client_contre_proposer"]
      });
    }

    // Marquer les champs modifiés
    reservation.markModified('creneauDemande');
    reservation.markModified('creneauPropose');
    reservation.markModified('messageGarage');
    reservation.markModified('messageClient');

    const updatedReservation = await reservation.save();
    
    console.log('Réservation après update:', {
      status: updatedReservation.status,
      creneauDemande: updatedReservation.creneauDemande,
      creneauPropose: updatedReservation.creneauPropose,
      messageClient: updatedReservation.messageClient
    });

    res.json({ 
      success: true, 
      reservation: updatedReservation,
      message: "Réservation mise à jour avec succès"
    });

  } catch (error) {
    console.error("=== ERREUR UPDATE RESERVATION CLIENT ===");
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