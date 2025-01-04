import { NextApiRequest, NextApiResponse } from 'next'
import { reportError } from 'util/errors'

import logger from '@/util/logger'
import { parseQueryValue } from '@/util/nextjs'
import { afterCallback, auth0, AUTH0_BASE_URL, getLoginOptions, getOrgNameFromUrl } from '@/util/server/auth0'
import { getOrgId, getOrgName } from '@/util/server/org-cache'

/**
 * Server-side auth0 handler
 *  - uses organizations for B2B access
 *  - org is required
 */
export default auth0.handleAuth({
  async callback(req: NextApiRequest, res: NextApiResponse) {
    try {
      let state: { returnTo?: string; orgId?: string } = {}
      try {
        state = JSON.parse(req.query.state ? Buffer.from(req.query.state as string, 'base64').toString() : '{}')
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        // req.log.warn({ err }, 'Failed to parse auth state in callback')
      }

      let orgId: string | undefined = state.orgId
      let orgName: string | undefined
      if (orgId) {
        orgName = await getOrgName(orgId)
      } else if (state.returnTo) {
        orgName = await getOrgNameFromUrl(state.returnTo)
        if (orgName) {
          orgId = await getOrgId(orgName)
        }
      }

      const options = await getLoginOptions(orgId, orgName)
      await auth0.handleCallback(req, res, {
        afterCallback,
        ...options,
      })
    } catch (error) {
      reportError(error as Error, null, { boundary: 'auth0-callback' })

      throw error
    }
  },

  async login(req: NextApiRequest, res: NextApiResponse) {
    try {
      // Check if user already has a valid session
      const session = await auth0.getSession(req, res)
      const hasSession = !!session
      const sessionOrgId = session?.user.org_id
      const sessionOrgName = session?.user.org_name || (await getOrgName(sessionOrgId))

      const returnToFromQuery = parseQueryValue(req.query.returnTo)
      const returnToOrgName =
        parseQueryValue(req.query.organization_name) || (await getOrgNameFromUrl(returnToFromQuery))
      const returnToOrgId =
        parseQueryValue(req.query.organization) || (returnToOrgName ? await getOrgId(returnToOrgName) : null)

      const isChangingOrg = hasSession && sessionOrgId !== returnToOrgId
      const effectiveOrgId = returnToOrgId || sessionOrgId
      const effectiveOrgName = returnToOrgName || sessionOrgName

      if (hasSession && sessionOrgName && returnToOrgName && isChangingOrg) {
        logger.debug({ from: sessionOrgName, to: returnToOrgName }, 'User is changing org')
      }

      const loginConfig = {
        invitation: parseQueryValue(req.query.invitation),
        silent: hasSession && !isChangingOrg,
      }

      const options = await getLoginOptions(effectiveOrgId, effectiveOrgName, loginConfig)
      await auth0.handleLogin(req, res, options)
    } catch (err) {
      reportError(err as Error, null, { boundary: 'auth0-login' })
      throw err
    }
  },

  async logout(req: NextApiRequest, res: NextApiResponse) {
    try {
      const returnTo = parseQueryValue(req.query.returnTo) || '/'
      const returnToUrl = new URL(returnTo, AUTH0_BASE_URL)
      const logoutReturnTo = new URL('/logout', AUTH0_BASE_URL)

      if (returnToUrl.searchParams.has('returnTo')) {
        logoutReturnTo.searchParams.set('returnTo', returnToUrl.searchParams.get('returnTo') as string)
      } else {
        logoutReturnTo.searchParams.set('returnTo', returnTo)
      }

      await auth0.handleLogout(req, res, {
        returnTo: logoutReturnTo.pathname + logoutReturnTo.search + logoutReturnTo.hash,
      })
    } catch (error) {
      reportError(error as Error, null, { boundary: 'auth0-logout' })
      throw error
    }
  },

  onError(req: NextApiRequest, res: NextApiResponse, error) {
    redirectToErrorScreen(req, res, error)
  },
})

function redirectToErrorScreen(req: NextApiRequest, res: NextApiResponse, error: unknown) {
  const err = error as { status?: number } & Error

  // Redirect to an auth-error screen
  // Preserve auth0's query params so we can render the error
  const callbackErrorRedirect = new URL('/auth-error', AUTH0_BASE_URL)
  const omitErrorKeys = ['state', 'auth0']
  Object.entries(req.query).forEach(([key, val]) => {
    val = parseQueryValue(val)
    if (!omitErrorKeys.includes(key) && val) {
      callbackErrorRedirect.searchParams.set(key, val)
    }
  })
  if (err.status) {
    callbackErrorRedirect.searchParams.set('status', err.status.toString())
  }
  res.redirect(callbackErrorRedirect.toString())
}
