import { NextApiRequest, NextApiResponse } from 'next'
import { reportError } from 'util/errors'

import { auth0, AUTH0_BASE_URL } from '@/util/server/auth0'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await auth0.getSession(req, res)

    if (!session) {
      throw new Error('Missing session')
    }

    const reqUrl = new URL(req.url as string, AUTH0_BASE_URL)
    const redirectUrl = new URL(`https://${process.env.GITHUB_SYNC_APP_HOSTNAME}/v1/api/github/oauth/callback`)

    // Copy all the query params we get from the github callback to the redirect
    for (const [key, val] of reqUrl.searchParams.entries()) {
      redirectUrl.searchParams.set(key, val)
    }

    res.redirect(redirectUrl.toString())
  } catch (err) {
    reportError(err as Error, null, { boundary: 'github-callback' })
    return res.status(500).json({})
  }
}

export default auth0.withApiAuthRequired(handler)
