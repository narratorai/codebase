import { snakeCase } from 'lodash'
import LogRocket from 'logrocket'
import { reportError } from 'util/errors'

import { inferCompanySlug } from '@/util/auth'
import { getLogger } from '@/util/logger'
import Sentry from '@/util/sentry'

import { IdentifyPluginPayload, TrackPluginPayload } from './interfaces'
const logger = getLogger()

export function customValidationPlugin() {
  // return object for analytics to use
  return {
    name: 'custom-event-validation',
    trackStart: ({ payload, abort }: { payload: TrackPluginPayload; abort: (msg: string) => void }) => {
      if (snakeCase(payload.event) !== payload.event) {
        // Warn in dev mode
        if (process.env.NODE_ENV === 'development') {
          logger.error({ payload }, 'Event name must be snake cased')
        }
        // Report error to sentry if a bad event makes it to prod:
        reportError('Event name must be snake cased', null, payload)
        return abort('Event name must be snake cased')
      }
    },
  }
}

export function logrocketPlugin() {
  // return object for analytics to use
  return {
    name: 'analytics-plugin-logrocket',
    track: ({ payload }: { payload: TrackPluginPayload }) => {
      LogRocket.track(payload.event)
    },
    identify: ({ payload }: { payload: IdentifyPluginPayload }) => {
      const {
        options: { user, ldFlags },
      } = payload

      LogRocket.identify(user.sub, {
        name: user.name,
        email: user.email,
        // Custom user variables can go here
        // Note these will be the same across all of their sessions, use track calls to track per session
      })

      // Prefix flags with flag_ and track them
      for (const key in ldFlags) {
        LogRocket.track(`flag_${key}=${ldFlags[key]}`)
      }
    },
  }
}

export function sentryPlugin() {
  // return object for analytics to use
  return {
    name: 'analytics-plugin-sentry',
    identify: ({ payload }: { payload: IdentifyPluginPayload }) => {
      const {
        options: { user, ldFlags },
      } = payload

      Sentry.setUser({
        id: user.sub,
        email: user.email,
      })
      LogRocket.getSessionURL((sessionURL) => {
        Sentry.configureScope((scope) => {
          scope.setExtras({
            sessionURL,
            flags: ldFlags,
          })
        })
      })
    },
  }
}

export function helpScoutPlugin() {
  // return object for analytics to use
  return {
    name: 'analytics-plugin-helpscout-beacon',
    page: ({ payload }: any) => {
      // https://developer.helpscout.com/beacon-2/web/javascript-api/#beacon-event-eventobject
      if (window.Beacon) {
        window.Beacon('event', {
          type: 'page-viewed',
          url: payload.properties.url,
          title: payload.properties.title,
        })
      }
    },
    identify: ({ payload }: { payload: IdentifyPluginPayload }) => {
      const {
        options: { user, companySlug },
      } = payload

      if (window.Beacon) {
        window.Beacon('identify', {
          email: user.email,
          name: user.name,
          company: companySlug,
          company_url: `https://portal.narrator.ai/${companySlug}`,
          // custom variables below:
          // https://developer.helpscout.com/beacon-2/web/javascript-api/#beaconidentify-userobject
          cust_journey: `https://portal.narrator.ai/narrator/customer_journey/activity_stream?customer=${encodeURIComponent(
            user.email
          )}`,
          logrocket: `https://app.logrocket.com/5nc1c7/portal?filters=%5B%7B%22type%22%3A%22email%22%2C%22operator%22%3A%7B%22type%22%3A%22IS%22%7D%2C%22strings%22%3A%5B%22${encodeURIComponent(
            user.email
          )}%22%5D%7D%5D`,
          // TODO - get secure mode working!
          // signature: 'YOUR_SERVER_GENERATED_SIGNATURE_HERE',
        })
      }
    },
  }
}

export function trackCompanySlug() {
  // return object for analytics to use
  return {
    name: 'track-company-slug',
    trackStart: ({ payload }: { payload: TrackPluginPayload }) => {
      const companySlug = inferCompanySlug(window.location.pathname)

      if (companySlug) {
        const enrichedProperties = Object.assign({}, payload.properties, {
          company_slug: companySlug,
        })

        // Return updated object. This will flow into the tracking call
        return Object.assign({}, payload, { properties: enrichedProperties })
      }
    },
  }
}
