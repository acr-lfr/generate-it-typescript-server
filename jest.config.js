const ignore = [
  '/.openapi-nodegen/',
  '/node_modules/',
  '/build/',
  '/dist/',
];

module.exports = {
  moduleFileExtensions: [
    'js',
    'jsx',
    'json',
    'ts',
    'tsx',
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/domains/*.{js,ts}',
    'src/services/*.{js,ts}',
    'src/utils/*.{js,ts}',
  ],
  coverageDirectory: 'coverage',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testMatch: ['**/*.spec.ts'],
  transformIgnorePatterns: ignore,
  testPathIgnorePatterns: ignore,
  modulePathIgnorePatterns: ignore,
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@constants$': '<rootDir>/src/constants',
    '^@database$': '<rootDir>/src/database',
    '^@domains$': '<rootDir>/src/domains',
    '^@http$': '<rootDir>/src/http',
    '^@services$': '<rootDir>/src/services',
    '^@utils': '<rootDir>/src/utils',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: [
    './jest.setup.js',
  ],
  testURL: 'http://localhost/',
};
