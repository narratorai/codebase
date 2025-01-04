import { AfterCallback, initAuth0, LoginOptions, Session } from '@auth0/nextjs-auth0'
import { NextApiRequest, NextApiResponse } from 'next'

import { inferCompanySlug } from '@/util/auth'
import { isServer } from '@/util/env'
import { getOrgName } from '@/util/server/org-cache'

import { AUTH0_BASE_URL } from './constants'
export { AUTH0_BASE_URL } from './constants'

if (!isServer) {
  throw new Error('Module cannot be used client side')
}

export const auth0 = initAuth0({
  // FIXME array of secrets so we can roll it without logging everyone out
  // secret: [process.env.AUTH0_SECRET_BLUE, process.env.AUTH0_SECRET_GREEN],
  baseURL: AUTH0_BASE_URL,
  session: {
    rolling: true,
    rollingDuration: 60 * 60 * 24 * 30, // 30 days
    absoluteDuration: 60 * 60 * 24 * 365, // 1 year
  },
  routes: {
    callback: '/api/auth/callback',
    postLogoutRedirect: '/logout',
  },
  enableTelemetry: false,
})

export const DEFAULT_AUTHORIZATION_PARAMS: LoginOptions['authorizationParams'] = Object.freeze({
  response_type: 'code',
  scope: 'openid profile email offline_access',
  audience: process.env.AUTH0_AUDIENCE_GRAPH,
})

export type GetLoginOptionsConfig = {
  // Pass when accepting an organization invite
  invitation?: string
  // Pass to go to a registration screen
  signup?: boolean
  // When switching between orgs or refreshing token
  silent?: boolean
}

export async function getLoginOptions(
  orgId?: string,
  orgName?: string,
  config?: GetLoginOptionsConfig
): Promise<LoginOptions> {
  return {
    authorizationParams: {
      ...DEFAULT_AUTHORIZATION_PARAMS,
      redirect_uri: `${AUTH0_BASE_URL}/api/auth/callback`,
      organization: orgId,
      organization_name: orgName,
      invitation: config?.invitation,
      screen_hint: config?.signup ? 'signup' : undefined,
      prompt: config?.silent ? 'none' : undefined,
    },
    getLoginState: () => ({
      orgId,
    }),
  }
}

export async function getOrgNameFromUrl(url: string | undefined) {
  if (!url) {
    return undefined
  }

  const { pathname } = new URL(url, AUTH0_BASE_URL)
  return inferCompanySlug(pathname)
}

export const afterCallback: AfterCallback = async (_req: NextApiRequest, _res: NextApiResponse, session: Session) => {
  // Put the resolved org name on the session for convenience
  if (session.user.org_id) {
    session.user.org_name = await getOrgName(session.user.org_id)
  }

  // Delete the id token, its not necessary in the session and just makes it larger than it needs to be
  delete session.idToken

  return session
}
