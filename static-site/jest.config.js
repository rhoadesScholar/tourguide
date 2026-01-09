module.exports = {
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'app.js',
    'organelle-data.js',
    '!node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  coverageDirectory: 'coverage',
  collectCoverage: true
};
