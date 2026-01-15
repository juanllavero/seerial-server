// Jest setup file for global test configuration

// Set longer timeout for network requests
jest.setTimeout(30000);

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  // Keep log and warn for debugging
  log: jest.fn(),
  warn: jest.fn(),
  // Suppress info and debug in tests
  info: jest.fn(),
  debug: jest.fn(),
};
