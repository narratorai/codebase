import { getSession } from '@auth0/nextjs-auth0/edge'
import { NextRequest, NextResponse } from 'next/server'

import logger from '@/util/logger'

import { AUTH0_BASE_URL } from './util/server/constants'

// IMPORTANT: This env var is required to use the auth0 edge SDK
process.env.AUTH0_BASE_URL = AUTH0_BASE_URL

/**
 * Middleware to check if the user is switching companies.
 * If the user is switching companies, redirect them to the login page.
 *
 * @param {NextRequest} req
 */
export default async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const session = await getSession(req, res)
  const sessionOrgName = session?.user.org_name
  const companySlug = req.nextUrl.pathname.split('/')[2] // Extracting data from /v2/:companySlug/:path*

  // The export report page does not require a session to be present,
  // thus the sessionOrgName can be undefined
  if (sessionOrgName && sessionOrgName !== companySlug) {
    const loginUrl = new URL('/api/auth/login', req.nextUrl.origin)
    loginUrl.searchParams.append('returnTo', req.nextUrl.pathname)
    logger.debug({ companySlug, sessionOrgName }, 'User is switching companies')

    return NextResponse.redirect(loginUrl.toString())
  }

  return res
}

export const config = {
  matcher: '/v2/:path*',
}
