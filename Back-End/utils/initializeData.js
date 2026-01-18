import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { Garage } from "../models/Garage.js";
import { Garagiste } from "../models/Garagiste.js";
import Service from "../models/Service.js";
import GarageService from "../models/GarageService.js";

/**
 * Fonction à appeler au démarrage de votre application
 * pour s'assurer que les données initiales existent
 */
export const initializeDefaultData = async () => {
  try {
    console.log("🔍 Vérification des données initiales...");

    // Vérifier si le garagiste existe
    const garagisteEmail = "ahlembouguerra20@gmail.com";
    let garagiste = await Garagiste.findOne({ email: garagisteEmail });

    if (!garagiste) {
      console.log("📝 Création du garagiste par défaut...");
      
      const hashedPassword = await bcrypt.hash("Admin@123", 10);

      garagiste = await Garagiste.create({
        _id: new mongoose.Types.ObjectId("696a144237dc73e4e03d414c"),
        username: "ahlem bouguerra",
        email: garagisteEmail,
        password: hashedPassword,
        phone: "24552222",
        isVerified: true,
        isActive: true,
        mecanicienData: {
          statut: "Actif",
          services: []
        }
      });

      console.log("✅ Garagiste créé");
    } else {
      console.log("ℹ️ Garagiste déjà existant");
    }

    // Vérifier si le garage existe
    const garageMatricule = "987654321777";
    let garage = await Garage.findOne({ matriculeFiscal: garageMatricule });

    if (!garage) {
      console.log("📝 Création du garage par défaut...");

      garage = await Garage.create({
        _id: new mongoose.Types.ObjectId("69147725cb1b9aa1eaa81e3f"),
        nom: "Garage Elite Motors Premium",
        matriculeFiscal: garageMatricule,
        governorateId: new mongoose.Types.ObjectId("689de78cbbd7f699052fda09"),
        governorateName: "JENDOUBA",
        cityId: new mongoose.Types.ObjectId("689de78cbbd7f699052fdaa1"),
        cityName: "JENDOUBA (Cite Snit)",
        streetAddress: "",
        garagisteAdmins: [garagiste._id],
        description: "Garage spécialisé en réparation automobile de luxe et sport",
        horaires: "Lun-Ven: 8h-19h, Sam: 8h-17h, Dim: Fermé",
        isActive: true,
        emailProfessionnel: "auto@gmail.com",
        telephoneProfessionnel: "45 123 987",
        location: {
          type: "Point",
          coordinates: [8.784, 36.497]
        },
        createdAt: new Date("2025-11-12T12:01:41.005Z"),
        updatedAt: new Date("2025-12-28T12:13:13.967Z")
      });

      console.log("✅ Garage créé");
    } else {
      console.log("ℹ️ Garage déjà existant");
    }

    // Mettre à jour le garagiste si nécessaire
    if (!garagiste.garage || garagiste.garage.toString() !== garage._id.toString()) {
      await Garagiste.findByIdAndUpdate(
        garagiste._id,
        { garage: garage._id }
      );
      console.log("✅ Garagiste lié au garage");
    }

    console.log("✅ Données initiales prêtes\n");
    
    // Initialiser les services par défaut
    await initializeServices(garagiste._id);
    
    // Associer les services au garage
    await initializeGarageServices(garage._id);
    
    return { garage, garagiste };

  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation des données:", error);
    throw error;
  }
};

/**
 * Initialiser les services par défaut
 */
const initializeServices = async (createdByUserId) => {
  try {
    const existingServices = await Service.countDocuments();
    
    if (existingServices > 0) {
      console.log(`ℹ️  ${existingServices} services déjà existants`);
      return;
    }

    console.log("📝 Création des services par défaut...");

    const servicesData = [
      {
        id: "SERV001",
        name: "Vidange moteur",
        description: "Changement de l'huile moteur et du filtre à huile pour assurer le bon fonctionnement du moteur",
        statut: "Actif",
        createdBy: createdByUserId
      },
      {
        id: "SERV002",
        name: "Révision complète",
        description: "Contrôle et entretien complet du véhicule selon le carnet d'entretien constructeur",
        statut: "Actif",
        createdBy: createdByUserId
      },
      {
        id: "SERV003",
        name: "Freinage",
        description: "Remplacement des plaquettes et disques de frein, purge du circuit de freinage",
        statut: "Actif",
        createdBy: createdByUserId
      },
      {
        id: "SERV004",
        name: "Pneumatiques",
        description: "Montage, équilibrage, permutation et remplacement des pneus",
        statut: "Actif",
        createdBy: createdByUserId
      },
      {
        id: "SERV005",
        name: "Climatisation",
        description: "Recharge et entretien du système de climatisation automobile",
        statut: "Actif",
        createdBy: createdByUserId
      },
      {
        id: "SERV006",
        name: "Batterie",
        description: "Test, charge et remplacement de la batterie du véhicule",
        statut: "Actif",
        createdBy: createdByUserId
      },
      {
        id: "SERV007",
        name: "Géométrie et parallélisme",
        description: "Réglage de la géométrie des roues pour une usure optimale des pneus",
        statut: "Actif",
        createdBy: createdByUserId
      },
      {
        id: "SERV008",
        name: "Échappement",
        description: "Réparation et remplacement du système d'échappement complet",
        statut: "Actif",
        createdBy: createdByUserId
      },
      {
        id: "SERV009",
        name: "Diagnostic électronique",
        description: "Diagnostic complet via valise électronique pour détecter les pannes",
        statut: "Actif",
        createdBy: createdByUserId
      },
      {
        id: "SERV010",
        name: "Distribution",
        description: "Remplacement de la courroie ou chaîne de distribution et accessoires",
        statut: "Actif",
        createdBy: createdByUserId
      },
      {
        id: "SERV011",
        name: "Embrayage",
        description: "Remplacement du kit d'embrayage complet (disque, mécanisme, butée)",
        statut: "Actif",
        createdBy: createdByUserId
      },
      {
        id: "SERV012",
        name: "Amortisseurs",
        description: "Remplacement des amortisseurs avant et arrière",
        statut: "Actif",
        createdBy: createdByUserId
      },
      {
        id: "SERV013",
        name: "Carrosserie",
        description: "Réparation de carrosserie, débosselage et peinture",
        statut: "Actif",
        createdBy: createdByUserId
      },
      {
        id: "SERV014",
        name: "Vitrerie",
        description: "Réparation et remplacement de pare-brise et vitres",
        statut: "Actif",
        createdBy: createdByUserId
      },
      {
        id: "SERV015",
        name: "Contrôle technique",
        description: "Préparation et accompagnement pour le contrôle technique",
        statut: "Actif",
        createdBy: createdByUserId
      },
      {
        id: "SERV016",
        name: "Injection diesel",
        description: "Nettoyage et réparation du système d'injection diesel",
        statut: "Actif",
        createdBy: createdByUserId
      },
      {
        id: "SERV017",
        name: "Démarrage et charge",
        description: "Réparation du système de démarrage (démarreur, alternateur)",
        statut: "Actif",
        createdBy: createdByUserId
      },
      {
        id: "SERV018",
        name: "Transmission",
        description: "Réparation et entretien de la boîte de vitesses",
        statut: "Actif",
        createdBy: createdByUserId
      },
      {
        id: "SERV019",
        name: "Refroidissement moteur",
        description: "Entretien du circuit de refroidissement, remplacement du radiateur",
        statut: "Actif",
        createdBy: createdByUserId
      },
      {
        id: "SERV020",
        name: "Éclairage",
        description: "Remplacement et réglage des phares, feux et ampoules",
        statut: "Actif",
        createdBy: createdByUserId
      }
    ];

    await Service.insertMany(servicesData);
    console.log(`✅ ${servicesData.length} services créés avec succès`);

  } catch (error) {
    console.error("❌ Erreur lors de la création des services:", error);
  }
};

/**
 * Associer tous les services au garage
 */
const initializeGarageServices = async (garageId) => {
  try {
    const existingGarageServices = await GarageService.countDocuments({ garageId });
    
    if (existingGarageServices > 0) {
      console.log(`ℹ️  ${existingGarageServices} services déjà associés au garage`);
      return;
    }

    console.log("📝 Association des services au garage...");

    // Récupérer tous les services actifs
    const services = await Service.find({ statut: "Actif" });
    
    if (services.length === 0) {
      console.log("⚠️  Aucun service à associer");
      return;
    }

    // Créer les associations
    const garageServices = services.map(service => ({
      garageId: garageId,
      serviceId: service._id,
      addedAt: new Date()
    }));

    await GarageService.insertMany(garageServices);
    console.log(`✅ ${garageServices.length} services associés au garage`);

  } catch (error) {
    console.error("❌ Erreur lors de l'association des services:", error);
  }
};

// Pour l'utiliser dans votre fichier principal (server.js ou app.js):
// import { initializeDefaultData } from './seed/initializeData.js';
// 
// await mongoose.connect(process.env.MONGODB_URI);
// await initializeDefaultData(); // Appeler après connexion MongoDB
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
