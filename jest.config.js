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
  transformIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/dist/',
  ],
  testMatch: ['**/*.spec.ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/dist/',
  ],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: [
    './jest.setup.js',
  ],
  testURL: 'http://localhost/',
};
