// export-data.js
import mongoose from 'mongoose';
import fs from 'fs';
import 'dotenv/config';


// Import des modèles
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
import Street from  "../models/Street.js";

async function exportData() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    // Créer un dossier pour les exports
    const exportDir = './exported-data';
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir);
    }

    // Exporter chaque collection
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
      console.log(`📦 Export de ${collection.name}...`);
      
      const data = await collection.model.find({}).lean();
      
      // Écrire dans un fichier JSON
      fs.writeFileSync(
        `${exportDir}/${collection.name}.json`,
        JSON.stringify(data, null, 2)
      );
      
      console.log(`✅ ${data.length} documents exportés pour ${collection.name}`);
    }

    // Créer un fichier seed.js avec toutes les données
    console.log('📝 Génération du fichier seed-data.js...');
    
    let seedContent = '// seed-data.js - Données exportées\nconst mongoose = require("mongoose");\n\n';
    
    for (const collection of collections) {
      const data = JSON.parse(fs.readFileSync(`${exportDir}/${collection.name}.json`, 'utf8'));
      seedContent += `const ${collection.name} = ${JSON.stringify(data, null, 2)};\n\n`;
    }
    
    seedContent += 'module.exports = {\n';
    seedContent += collections.map(c => `  ${c.name}`).join(',\n');
    seedContent += '\n};\n';
    
    fs.writeFileSync(`${exportDir}/seed-data.js`, seedContent);
    
    console.log('🎉 Export terminé avec succès !');
    console.log(`📁 Fichiers exportés dans le dossier: ${exportDir}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'export:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Déconnecté de MongoDB');
    process.exit(0);
  }
}

// Exécuter l'export
exportData();