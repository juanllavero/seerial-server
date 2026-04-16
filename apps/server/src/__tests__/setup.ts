// Jest setup file for global test configuration

// Set longer timeout for network requests
jest.setTimeout(30000);

// Suppress noisy logs during tests while keeping errors available
global.console = {
	...console,
	log: jest.fn(),
	warn: jest.fn(),
	info: jest.fn(),
	debug: jest.fn(),
	// Keep error so test failures are visible
	error: jest.fn(),
};
