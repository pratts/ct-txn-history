// jest.config.js
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    testMatch: [
        '**/__tests__/**/*.test.ts',
        '**/?(*.)+(spec|test).ts'
    ],
    transform: {
        '^.+\\.ts$': 'ts-jest'
    },
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/main.ts'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    // Add this to handle ES modules if needed
    extensionsToTreatAsEsm: ['.ts'],
    globals: {
        'ts-jest': {
            useESM: false
        }
    }
};