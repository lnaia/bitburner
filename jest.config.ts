import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  clearMocks: true,
  coverageReporters: ['lcov', ['text', { skipFull: true }]],
  collectCoverage: true,
  coverageDirectory: './coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
};

export default config;
