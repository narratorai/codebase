import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: 'gtdx31',
  chromeWebSecurity: false,
  blockHosts: [
    '*.t.narrator.ai',
    '*.sentry.io',
    '*.helpscout.net',
    '*.lr-in.com',
    '*.lr-in-prod.com',
    'events.launchdarkly.com',
  ],
  retries: {
    runMode: 2,
    openMode: 0,
  },
  defaultCommandTimeout: 10000,
  pageLoadTimeout: 10000,
  viewportWidth: 1440,
  viewportHeight: 900,
  scrollBehavior: 'center',
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
  },
})
