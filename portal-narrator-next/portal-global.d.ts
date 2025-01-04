import type { Workbox } from 'workbox-window'

// Causes problems with type-checking if we load this here
// import type { Cypress } from 'cypress'

// window overrides
export declare global {
  interface Window {
    // Service worker
    workbox?: Workbox

    // HelpScout
    Beacon: (cmd: string, ...args: any[]) => void

    // Should really be :MonacoEnvironment but I don't think we expose that from the-sequel
    MonacoEnvironment: any

    // E2E test only
    Cypress?: {
      spec: {
        name: string
      }
    }
  }

  type DataTestAttributes = {
    'data-test'?: string
    'data-test-id'?: string
  }
}
