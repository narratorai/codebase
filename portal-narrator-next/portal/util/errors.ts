import _ from 'lodash'
import LogRocket from 'logrocket'

import { getLogger } from '@/util/logger'
import Sentry from '@/util/sentry'

const logger = getLogger()

// Stolen from sentry utils
// https://github.com/getsentry/sentry-javascript/blob/268c7e764f3b76a46d1e0d8447fa0da740498fbf/packages/utils/src/object.ts#L148-L157
/** Calculates bytes size of input string */
function utf8Length(value: string): number {
  // tslint:disable-next-line:no-bitwise
  return ~-encodeURI(value).split(/%..|./).length
}

/** Calculates bytes size of input object */
function jsonSize(value: any): number {
  return utf8Length(JSON.stringify(value))
}

const MAX_EXTRA_SIZE_KB = 50

export const reportError = (msg: string | Error, err?: Error | null, extra?: object): string | undefined => {
  let eventId

  let scopeExtra = extra
  if (jsonSize(scopeExtra) > MAX_EXTRA_SIZE_KB * 1024) {
    Sentry.captureMessage(`Attempted to send extra payload over ${MAX_EXTRA_SIZE_KB}kb`)
    logger.warn({ msg, err, extra }, 'Sentry: extra payload too large. Removing from error report')
    scopeExtra = {
      extra_truncated: true,
    }
  }

  Sentry.withScope((scope) => {
    scope.setExtras({
      display: msg,
      ...scopeExtra,
    })

    const reported = err || msg

    logger.debug({ reported, extra }, 'Reporting error')

    try {
      _.isError(reported) ? LogRocket.captureException(reported) : LogRocket.captureMessage(reported)
    } catch (_err) {
      reportError('Failed to report error to LogRocket', _err as Error)
    }

    // Returns a Sentry eventId we could use for tracking and/or to display the sentry feedback UI
    try {
      eventId = _.isError(reported) ? Sentry.captureException(reported) : Sentry.captureMessage(reported)
    } catch (_err) {
      logger.error({ msg, err, _err, extra }, 'Failed to report to Sentry')
    }
  })

  return eventId
}
