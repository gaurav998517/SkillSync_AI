module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/src/tests'],
    testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
    clearMocks: true,
    globalSetup: '<rootDir>/src/tests/setup/globalSetup.js',
    globalTeardown: '<rootDir>/src/tests/setup/globalTeardown.js',
    setupFiles: ['<rootDir>/src/tests/setup/jest.setup.js'],
    moduleNameMapper: {
        '^@xenova/transformers$': '<rootDir>/src/tests/setup/transformersMock.js'
    },
    testTimeout: 30000, // 30s timeout for DB operations
};
