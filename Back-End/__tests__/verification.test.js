import { connectDB, clearDB, closeDB } from './setup/db.js';

describe('Vérification setup', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  test('devrait être configuré correctement', () => {
    expect(true).toBe(true);
  });

  test('devrait avoir JWT_SECRET', () => {
    expect(process.env.JWT_SECRET).toBeDefined();
  });
});