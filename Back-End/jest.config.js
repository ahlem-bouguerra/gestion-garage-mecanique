export default {
  testEnvironment: 'node',
  
  // Pour les modules ES
  transform: {},
  
  // Pattern des fichiers de test
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Ignorer ces dossiers
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  
  // Couverture de code
  collectCoverageFrom: [
    'src/**/*.js',
    'models/**/*.js',
    'routes/**/*.js',
    'controllers/**/*.js',
    '!**/*.test.js',
    '!**/__tests__/**',
    '!**/node_modules/**'
  ],
  
  // Options de couverture
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Timeout par défaut (peut être augmenté pour les tests lents)
  testTimeout: 10000,
  
  // Variables d'environnement
  setupFiles: ['<rootDir>/__tests__/setup/env.js'],
  
  // Verbose pour plus de détails
  verbose: true,
  
  // Force la fermeture après les tests
  forceExit: true,
  
  // Détecte les fuites de mémoire
  detectOpenHandles: true
};