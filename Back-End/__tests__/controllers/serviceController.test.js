// tests/controllers/serviceController.test.js
import mongoose from 'mongoose';
import Service from '../../models/Service.js';
import { jest } from '@jest/globals';

import {
  createGlobalService,
  getAllGlobalServices,
  updateGlobalService,
  deleteGlobalService,
} from '../../controllers/superAdmin/serviceController.js';

import { connectDB, clearDB, closeDB } from '../setup/db.js';

const makeRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('Controller Service (Admin)', () => {
  beforeAll(async () => {
    await connectDB();
  });



  afterAll(async () => {
    await closeDB();
  });

  test('createGlobalService - devrait créer un service et retourner 201', async () => {
    const req = {
      body: {
        name: 'Vidange moteur',
        description: 'Vidange + filtre',
        // statut est optionnel
      },
      user: {
        _id: new mongoose.Types.ObjectId(),
      },
    };
    const res = makeRes();

    await createGlobalService(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalled();

    const data = res.json.mock.calls[0][0];
    expect(data.name).toBe('Vidange moteur');
    expect(data.id).toBe('SERV001');
    expect(data.statut).toBe('Actif');

    const inDb = await Service.findOne({ name: 'Vidange moteur' });
    expect(inDb).not.toBeNull();
  });

  test('createGlobalService - devrait retourner 400 si champs manquants', async () => {
    const req = {
      body: {
        // name & description manquants
      },
      user: {
        _id: new mongoose.Types.ObjectId(),
      },
    };
    const res = makeRes();

    await createGlobalService(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const payload = res.json.mock.calls[0][0];
    expect(payload.error).toMatch(/nom et description sont obligatoires/i);
  });

  test('createGlobalService - devrait retourner 409 si service existe déjà', async () => {
    const createdBy = new mongoose.Types.ObjectId();

    await Service.create({
      name: 'Réglage géométrie',
      description: 'Alignement des roues',
      statut: 'Actif',
      createdBy,
    });

    const req = {
      body: {
        name: 'Réglage géométrie', // 🔥 déjà existant
        description: 'Alignement des roues bis',
      },
      user: {
        _id: createdBy,
      },
    };
    const res = makeRes();

    await createGlobalService(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    const payload = res.json.mock.calls[0][0];
    expect(payload.error).toMatch(/existe déjà/i);
  });

  test('getAllGlobalServices - devrait retourner tous les services', async () => {
    const createdBy = new mongoose.Types.ObjectId();

    await Service.create({
  name: 'Lavage',
  description: 'Lavage extérieur',
  statut: 'Actif',
  createdBy,
});

await Service.create({
  name: 'Lavage complet',
  description: 'Intérieur + extérieur',
  statut: 'Désactivé',
  createdBy,
});


    const req = {};
    const res = makeRes();

    await getAllGlobalServices(req, res);

    expect(res.status).not.toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalled();

    const services = res.json.mock.calls[0][0];
    expect(Array.isArray(services)).toBe(true);
    expect(services.length).toBe(2);
    expect(services[0]).toHaveProperty('name');
  });

  test('updateGlobalService - devrait modifier un service existant', async () => {
    const createdBy = new mongoose.Types.ObjectId();

    const service = await Service.create({
      name: 'Ancien nom',
      description: 'Description initiale',
      statut: 'Actif',
      createdBy,
    });

    const req = {
      params: {
        id: service._id.toString(),
      },
      body: {
        name: 'Nouveau nom',
        description: 'Description modifiée',
      },
    };
    const res = makeRes();

    await updateGlobalService(req, res);

    expect(res.status).not.toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalled();

    const updated = res.json.mock.calls[0][0];
    expect(updated.name).toBe('Nouveau nom');
    expect(updated.description).toBe('Description modifiée');

    const inDb = await Service.findById(service._id);
    expect(inDb.name).toBe('Nouveau nom');
  });

  test('updateGlobalService - devrait retourner 404 si service introuvable', async () => {
    const req = {
      params: {
        id: new mongoose.Types.ObjectId().toString(),
      },
      body: {
        name: 'Nom inexistant',
      },
    };
    const res = makeRes();

    await updateGlobalService(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    const payload = res.json.mock.calls[0][0];
    expect(payload.error).toMatch(/non trouvé/i);
  });

  test('deleteGlobalService - devrait supprimer un service', async () => {
    const createdBy = new mongoose.Types.ObjectId();

    const service = await Service.create({
      name: 'Service à supprimer',
      description: 'Ce service sera supprimé',
      statut: 'Actif',
      createdBy,
    });

    const req = {
      params: {
        id: service._id.toString(),
      },
    };
    const res = makeRes();

    await deleteGlobalService(req, res);

    expect(res.status).not.toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalled();

    const payload = res.json.mock.calls[0][0];
    expect(payload.message).toMatch(/supprimé avec succès/i);

    const inDb = await Service.findById(service._id);
    expect(inDb).toBeNull();
  });

  test('deleteGlobalService - devrait retourner 404 si service introuvable', async () => {
    const req = {
      params: {
        id: new mongoose.Types.ObjectId().toString(),
      },
    };
    const res = makeRes();

    await deleteGlobalService(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    const payload = res.json.mock.calls[0][0];
    expect(payload.error).toMatch(/non trouvé/i);
  });
});
