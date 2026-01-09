module.exports = {
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'organelle-data.js',
    '!node_modules/**'
  ],
  coverageThreshold: {
    './organelle-data.js': {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  testMatch: [
    '**/__tests__/**/*.test.js',
    '!**/__tests__/e2e/**'
  ],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  coverageDirectory: 'coverage',
  collectCoverage: true
};
