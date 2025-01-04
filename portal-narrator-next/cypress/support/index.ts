/* eslint-disable @typescript-eslint/no-namespace */

/// <reference types="cypress" />

import { LoginOpts } from './auth0'

declare global {
  namespace Cypress {
    interface Chainable {
      getBySel(dataTestAttribute: string | string[], args?: any): Chainable

      /**
       * Logs-in user by using UI
       */
      login(opts: LoginOpts): void

      /**
       * Waits for all spinners to load
       */
      waitForSpinners(times?: number): Chainable
    }
  }
}

export {}
