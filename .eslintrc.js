module.exports = {
  // Specifies the ESLint parser
  parser: '@typescript-eslint/parser',

  // Which files to not lint
  ignorePatterns: [
    '.eslintrc.js',
    'src/domains/__mocks__/**/*',
    'src/http/**/*',
  ],

  parserOptions: {
    // Project required to enable no-floating-promises rule
    project: './tsconfig.json',
    // Allows for the parsing of modern ECMAScript features
    ecmaVersion: 2020,
    // Allows for the use of imports
    sourceType: 'module',
  },

  // The base rules this project extends from
  extends: [
    "eslint:recommended",
    // Uses the recommended rules from the @typescript-eslint/eslint-plugin
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],

  // additional function from 3rd parties
  plugins: [
    'deprecate',
  ],

  // Rules in addition to the base
  rules: {
    // Deprecated code rules
    'deprecate/function': 2,
    'deprecate/import': 2,
    'deprecate/member-expression': 2,

    // Eslint overrides
    'curly': ['error', 'all'],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'max-lines-per-function': ['error', 50],

    // Typescript overrides
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { vars: 'all', args: 'none', ignoreRestSiblings: false },
    ],
    '@typescript-eslint/no-floating-promises': [
      'error',
      { ignoreVoid: true }
    ]
  },
  overrides: [
    {
      files: ['**/*.spec.ts'],
      rules: {
        'max-lines-per-function': 'off',
      },
    },
  ],
};
