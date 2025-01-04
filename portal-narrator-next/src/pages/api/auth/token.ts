import { NextApiRequest, NextApiResponse } from 'next'
import { reportError } from 'util/errors'

import { auth0 } from '@/util/server/auth0'

const MAX_ATTEMPT_COUNT = 5

/**
 * Retrieve an access token from Auth0.
 *
 * It's also used when an access token has expired -- Auth0 will automatically
 * trade a refresh token for a new access token. This allows us to not log in
 * and avoids Portal having to refresh the page.
 */
async function fetchToken(req: NextApiRequest, res: NextApiResponse) {
  let attemptCount = 0

  // We attempt to call getAccessToken a few times if it doesn't work initially.
  // Sometimes when the user has multiple tabs open the sequence of calls to this API
  // all at once can result in an access denied.
  while (attemptCount < MAX_ATTEMPT_COUNT) {
    try {
      attemptCount++
      const token = await auth0.getAccessToken(req, res)

      return res.json({ accessToken: token.accessToken, type: 'bearer' })
    } catch (err: any) {
      reportError(err as Error, null, { boundary: 'auth0-token' })
      return res.status(500).json({ message: err.message })
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { headers } = req

  // Just forward the API key if it's present.
  if (headers['x-api-key']) {
    const accessToken = headers['x-api-key']
    return res.json({ accessToken, type: 'api-key' })
  } else {
    return await auth0.withApiAuthRequired(fetchToken)(req, res)
  }
}
