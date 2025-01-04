// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

// @ts-check

/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  testEnvironment: 'jsdom',

  setupFilesAfterEnv: ['<rootDir>/test/jest/setup.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  testMatch: ['<rootDir>/**/*.{spec,test}.{js,jsx,ts,tsx}'],

  resetMocks: true,
  testLocationInResults: true,

  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],

  collectCoverageFrom: ['**/*.{js,jsx,ts,tsx}', '!**/*.d.ts', '!**/node_modules/**', '!.next/**', '!out/**'],
  coverageReporters: ['json', 'lcov', 'text-summary', 'clover'],

  moduleNameMapper: {
    '\\.svg$': '<rootDir>/test/jest/__mocks__/svgrMock.js',
    '^.+\\.(css|less|png|jpg|ttf|woff|woff2)$': 'identity-obj-proxy',

    // Handle module aliases (this will be automatically configured eventually)
    // For now, it must remain in sync with paths in tsconfig.json -- note they are in different format
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/pages/(.*)$': '<rootDir>/pages/$1',

    // Next relative imports
    '^@/(.*)$': '<rootDir>/$1',

    // Static assets
    '^static/(.*)$': '<rootDir>/public/static/$1',

    // Relative imports
    '^components/(.*)$': '<rootDir>/portal/components/$1',
    '^util/(.*)$': '<rootDir>/portal/util/$1',
    '^graph/(.*)$': '<rootDir>/portal/graph/$1',
    '^machines/(.*)$': '<rootDir>/portal/machines/$1',
  },

  workerIdleMemoryLimit: '512MB',
}

module.exports = async () => ({
  ...(await createJestConfig(config)()),
  transformIgnorePatterns: [
    '/node_modules/(?!(antd|rc-pagination|rc-calendar|rc-tooltip|hast-util-sanitize|react-syntax-highlighter/dist/esm/languages/prism|nanoid|react-syntax-highlighter/dist/esm/styles/prism|query-string|decode-uri-component|split-on-first|filter-obj|unist-util-visit|unist-util-is|unist-util-visit-parents|analytics-node|uuid|camelcase-keys|map-obj|camelcase|quick-lru|ky)/)',
  ],
})
