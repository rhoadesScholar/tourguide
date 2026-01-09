// Jest setup file
// Mock localStorage with updatable mock functions
const localStorageMock = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock fetch
global.fetch = jest.fn(() => Promise.resolve({
  ok: true,
  json: async () => ({}),
  text: async () => '',
}));

// Reset mocks before each test
beforeEach(() => {
  // Clear mock history but keep mock functions
  localStorageMock.getItem.mockClear();
  localStorageMock.getItem.mockReturnValue(null);
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  
  global.fetch.mockClear();
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({}),
    text: async () => '',
  });
});
