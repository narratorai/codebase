// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

// eslint-disable-next-line no-restricted-imports
import * as Sentry from '@sentry/nextjs'
import { cloneDeep, mapValues } from 'lodash'

import { isDev } from './src/util/env'

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  enabled: !isDev && !!SENTRY_DSN,
  dsn: SENTRY_DSN,
  tracesSampleRate: 1,
  environment: process.env.NEXT_PUBLIC_IS_PRODUCTION ? 'production' : 'preview',
  normalizeDepth: 10,

  beforeSend(event) {
    // Make sure we dont sent session cookies to sentry
    const modified = cloneDeep(event)

    if (modified.request?.cookies) {
      modified.request.cookies = mapValues(modified.request.cookies, () => {
        return '[Redacted]'
      })
    }

    if (modified.request?.headers?.cookie) {
      modified.request.headers.cookie = '[Redacted]'
    }

    if (modified.request?.headers?.['set-cookie']) {
      modified.request.headers['set-cookie'] = '[Redacted]'
    }

    return modified
  },
})
