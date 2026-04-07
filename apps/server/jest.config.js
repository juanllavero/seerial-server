/** @type {import('jest').Config} */
const uuidShim = '<rootDir>/src/__tests__/helpers/uuid-shim.cjs';
const cliShim = '<rootDir>/src/__tests__/helpers/cli-shim.cjs';
const electronShim = '<rootDir>/src/__tests__/helpers/electron-shim.cjs';

const sharedTransform = {
  '^.+\\.ts$': 'ts-jest',
};

const sharedModuleNameMapper = {
  '^uuid$': uuidShim,
  '^@seerial/cli$': cliShim,
  '^electron$': electronShim,
  '^@/index$': '<rootDir>/src/__tests__/helpers/index-shim.cjs',
  '^@/(.*)$': '<rootDir>/src/$1',
  '^(\\.{1,2}/.*)\\.js$': '$1',
};

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  transform: sharedTransform,
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/index.ts', '!src/routes/routes.ts'],
  coverageThreshold: {
    global: {
      lines: 60,
      branches: 50,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 30000,
  moduleNameMapper: sharedModuleNameMapper,
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/__tests__/unit/**/*.test.ts'],
      transform: sharedTransform,
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
      moduleNameMapper: sharedModuleNameMapper,
      testTimeout: 10000,
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/__tests__/integration/**/*.test.ts'],
      transform: sharedTransform,
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
      moduleNameMapper: sharedModuleNameMapper,
      testTimeout: 30000,
    },
    {
      displayName: 'live',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/__tests__/live/**/*.test.ts'],
      transform: sharedTransform,
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
      moduleNameMapper: sharedModuleNameMapper,
      testTimeout: 60000,
    },
  ],
};
