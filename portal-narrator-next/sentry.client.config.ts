// This file configures the initialization of Sentry on the browser.
// The config you add here will be used whenever a page is visited.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { BrowserTracing } from '@sentry/browser'
// eslint-disable-next-line no-restricted-imports
import * as Sentry from '@sentry/nextjs'

import { isDev } from './src/util/env'
import history from './src/util/history'

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  enabled: !isDev && !!SENTRY_DSN,
  dsn: SENTRY_DSN,
  tracesSampleRate: 1,
  environment: process.env.NEXT_PUBLIC_IS_PRODUCTION ? 'production' : 'preview',
  normalizeDepth: 10,

  // Client-side only
  ignoreErrors: [
    // https://stackoverflow.com/a/50387233
    'ResizeObserver loop limit exceeded',
  ],
  integrations: (integrations) => {
    return integrations.concat(
      new BrowserTracing({
        tracingOrigins: ['localhost', '.narrator.ai'],
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: types are for node sentry but we're using react sentry here via webpack alias
        routingInstrumentation: Sentry.reactRouterV5Instrumentation(history),
      })
    )
  },
})
