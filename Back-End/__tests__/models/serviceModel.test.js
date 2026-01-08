// tests/models/serviceModel.test.js
import mongoose from 'mongoose';
import Service from '../../models/Service.js';
import { connectDB, clearDB, closeDB } from '../setup/db.js';

describe('Modèle Service', () => {
  beforeAll(async () => {
    await connectDB();
  });


  afterAll(async () => {
    await closeDB();
  });

  test('devrait créer un service valide et générer un id SERV001', async () => {
    const createdBy = new mongoose.Types.ObjectId();

    const service = await Service.create({
      name: 'Vidange complète',
      description: 'Vidange moteur avec changement filtre',
      // statut non fourni -> doit être "Actif" par défaut
      createdBy,
    });

    expect(service).toBeDefined();
    expect(service._id).toBeDefined();
    expect(service.id).toBe('SERV001');           // 🔥 génération auto
    expect(service.statut).toBe('Actif');         // 🔥 valeur par défaut
    expect(service.name).toBe('Vidange complète');
  });

  test("devrait incrémenter l'id (SERV001, SERV002, ...)", async () => {
    const createdBy = new mongoose.Types.ObjectId();

    const s1 = await Service.create({
      name: 'Diagnostic',
      description: 'Diagnostic électronique complet',
      createdBy,
    });

    const s2 = await Service.create({
      name: 'Révision',
      description: 'Révision constructeur',
      createdBy,
    });

    expect(s1.id).toBe('SERV001');
    expect(s2.id).toBe('SERV002');
  });

  test('ne doit pas autoriser deux services avec le même name (unicité)', async () => {
    const createdBy = new mongoose.Types.ObjectId();

    await Service.create({
      name: 'Changement pneus',
      description: 'Remplacement des pneus avant/arrière',
      createdBy,
    });

    let error;
    try {
      await Service.create({
        name: 'Changement pneus', // 🔥 même name
        description: 'Deuxième service avec le même nom',
        createdBy,
      });
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    // Erreur Mongo duplicate key
    expect(error.code).toBe(11000);
  });

  test('devrait refuser un statut invalide', async () => {
    const createdBy = new mongoose.Types.ObjectId();

    let error;
    try {
      await Service.create({
        name: 'Polissage',
        description: 'Polissage complet de la carrosserie',
        statut: 'Inconnu', // 🔥 valeur non autorisée
        createdBy,
      });
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    // message de validation mongoose sur enum
    expect(error.errors?.statut?.kind).toBe('enum');
  });

  test('devrait refuser la création sans name ou description', async () => {
    const createdBy = new mongoose.Types.ObjectId();
    let error;

    try {
      await Service.create({
        // name manquant
        description: 'Test sans nom',
        createdBy,
      });
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors?.name?.kind).toBe('required');
  });
});
