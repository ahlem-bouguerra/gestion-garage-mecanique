import mongoose from 'mongoose';
import fs from 'fs';
import 'dotenv/config';

// Import des modèles (comme dans export-data.js)
import Vehicule from "../models/Vehicule.js";
import {Users} from "../models/Users.js";
import {UserRole} from "../models/UserRole.js";
import Service from "../models/Service.js";
import Reservation from "../models/Reservation.js";
import OrdreTravail from "../models/Ordre.js";
import Mecanicien from "../models/Mecanicien.js";
import {GaragisteRole} from "../models/GaragisteRole.js";
import {GaragistePermission} from "../models/GaragistePermission.js";
import {Garagiste} from "../models/Garagiste.js";
import GarageService from "../models/GarageService.js";
import {Garage} from "../models/Garage.js";
import FicheClientVehicule from "../models/FicheClientVehicule.js";
import FicheClient from "../models/FicheClient.js";
import Facture from "../models/Facture.js";
import Devis from "../models/Devis.js";
import CreditNote from "../models/CreditNote.js";
import {Client} from "../models/Client.js";
import CarnetEntretien from "../models/CarnetEntretien.js";
import Atelier from "../models/Atelier.js";
import Governorate from "../models/Governorate.js";
import City from "../models/City.js";
import Street from "../models/Street.js";

async function importData() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    const importDir = './exported-data';

    const collections = [
      { name: 'ateliers', model: Atelier },
      { name: 'carnetentretiens', model: CarnetEntretien },
      { name: 'clients', model: Client },
      { name: 'creditnotes', model: CreditNote },
      { name: 'ficheclients', model: FicheClient },
      { name: 'vehicules', model: Vehicule },
      { name: 'ficheclientvehicules', model: FicheClientVehicule },
      { name: 'garages', model: Garage },
      { name: 'garageservices', model: GarageService },
      { name: 'garagistes', model: Garagiste },
      { name: 'mecaniciens', model: Mecanicien },
      { name: 'garagisteroles', model: GaragisteRole },
      { name: 'ordretravails', model: OrdreTravail },
      { name: 'devis', model: Devis },
      { name: 'factures', model: Facture },
      { name: 'reservations', model: Reservation },
      { name: 'services', model: Service },
      { name: 'userroles', model: UserRole },
      { name: 'users', model: Users },
      { name: 'governorates', model: Governorate },
      { name: 'cities', model: City },
      { name: 'streets', model: Street }
    ];

    for (const collection of collections) {
      console.log(`📥 Import de ${collection.name}...`);
      const filePath = `${importDir}/${collection.name}.json`;
      if (!fs.existsSync(filePath)) continue;

      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      // Supprimer les anciennes données avant import (optionnel)
      await collection.model.deleteMany({});
      
      // Insérer les nouvelles données
      await collection.model.insertMany(data);
      console.log(`✅ ${data.length} documents importés pour ${collection.name}`);
    }

    console.log('🎉 Import terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Déconnecté de MongoDB');
    process.exit(0);
  }
}

importData();
