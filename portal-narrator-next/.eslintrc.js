// @ts-check

/** @type {import('eslint').Linter.Config} */
const config = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'next/core-web-vitals',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:jsx-a11y/recommended',
    'prettier',
    'plugin:prettier/recommended',
    'plugin:storybook/recommended',
  ],
  plugins: ['@graphql-eslint', 'simple-import-sort', 'perfectionist'],
  ignorePatterns: [
    '.next',
    'node_modules/',
    'build/',
    'portal/graph/generated/',
    '**/*.svg',
    '**/*.css',
    '**/*.png',
    '**/*.jpg',
    '**/*.svg',
    '*.lock',
    'tsconfig.json',
  ],
  rules: {
    'no-console': 'error',
    'simple-import-sort/imports': 'warn',
    'simple-import-sort/exports': 'warn',
    'max-lines-per-function': ['error', { max: 100, skipComments: true }],
    'max-nested-callbacks': ['error', 2],

    // Include .prettierrc.js rules
    'prettier/prettier': ['error', {}, { usePrettierrc: true }],

    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        vars: 'all',
        args: 'after-used',
        argsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],

    'jsx-a11y/no-autofocus': 'off',

    'react/jsx-boolean-value': 'error',
    'react/jsx-no-useless-fragment': 'error',
    'react/jsx-max-depth': ['error', { max: 4 }],
    'react/no-unescaped-entities': 'off',
    'react/no-unstable-nested-components': 'warn',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',

    'perfectionist/sort-interfaces': [
      'warn',
      {
        groups: ['unknown', 'method'],
      },
    ],
    // 'perfectionist/sort-objects': 'warn',
    'perfectionist/sort-intersection-types': 'warn',
    'perfectionist/sort-jsx-props': 'error',

    'no-restricted-imports': [
      'error',
      {
        paths: [
          // Make sure we load the right sentry
          {
            name: '@sentry/node',
            message: 'Please load sentry from @/util/sentry instead',
          },
          {
            name: '@sentry/react',
            message: 'Please load sentry from @/util/sentry instead',
          },
          {
            name: '@sentry/nextjs',
            message: 'Please load sentry from @/util/sentry instead',
          },
          // Ensure we use instrumented Route component
          {
            name: 'react-router',
            importNames: ['Route'],
            message: 'Please use Route from util/route instead.',
          },
          {
            name: 'react-router-dom',
            importNames: ['Route'],
            message: 'Please use Route from util/route instead.',
          },
          {
            name: 'final-form-arrays',
            message: 'Please load from util/forms instead - fixes final form array issues in portal',
          },
        ],
      },
    ],
  },
  overrides: [
    {
      files: ['*.graphql'],
      parser: '@graphql-eslint/eslint-plugin',
      plugins: ['@graphql-eslint'],
    },
    {
      files: ['portal/**'],
      rules: {
        // PORTAL MIGRATION
        // These rules are turned down temportarily
        // Restoring them to default would be a win!
        '@typescript-eslint/no-non-null-asserted-optional-chain': 'warn',
        '@typescript-eslint/ban-ts-comment': 'warn',
        '@typescript-eslint/no-var-requires': 'warn',
        '@typescript-eslint/no-non-null-assertion': 'warn',
        '@typescript-eslint/no-empty-function': 'warn',
        '@typescript-eslint/no-namespace': 'warn',

        'react/display-name': 'warn',

        'jsx-a11y/click-events-have-key-events': 'warn',
        'jsx-a11y/no-static-element-interactions': 'warn',
      },
    },
    {
      files: ['**/*.test.{js,ts,jsx,tsx}'],
      env: {
        jest: true,
      },
    },
    {
      files: ['cypress/**'],
      env: {
        'cypress/globals': true,
      },
      plugins: ['cypress'],
      extends: ['plugin:cypress/recommended'],
    },
    {
      files: ['package.json'],
      rules: {
        '@typescript-eslint/no-unused-expressions': 'off',
      },
    },
  ],
  reportUnusedDisableDirectives: true,
}

module.exports = config
