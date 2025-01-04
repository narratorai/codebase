import type { LoginOptions, LogoutOptions } from '@auth0/nextjs-auth0'
import { useUser } from '@auth0/nextjs-auth0/client'
import { defaultTo } from 'lodash'

// Routes that may come in as the first path that are _not_ company slugs
export const notCompanySlugs = [
  'null',
  'undefined',
  'callback',
  'callback-error',
  'auth',
  'auth-error',
  'error',
  'login',
  'signin',
  'logout',
  'signout',
  'signup',
  'register',
  'invite',
  'join',
  'new',
  'welcome',
  'admin',
  'api',
  'mavis',
  'auth',
  'www',
  'portal',
  'graph',
  'dev',
  'nonprod',
  'production',
  'favicon.ico',
  'favicon.png',
  'favicon-512.png',
]

/**
 * Get the company slug from the pathname.
 *
 * @param pathname - The pathname to infer the company slug from
 * @returns Company slug
 */
export const inferCompanySlug = (pathname: string) => {
  const [prefix, path] = pathname.split('/').filter(Boolean)
  const companySlug = prefix === 'v2' ? path : prefix

  if (companySlug && !notCompanySlugs.includes(companySlug)) {
    return companySlug
  }
}

export const login = (options?: Pick<LoginOptions, 'returnTo'>) => {
  const { location } = window
  const returnTo = options?.returnTo || location.pathname + location.search + location.hash
  const authUrl = new URL('/api/auth/login', location.origin)
  authUrl.searchParams.append('returnTo', returnTo)

  window.location.replace(authUrl.toString())
}

export const logout = (options?: LogoutOptions) => {
  const { location } = window
  const returnTo = new URL(options?.returnTo || location.pathname + location.search + location.hash, location.origin)

  const logoutReturnToParams = new URLSearchParams()
  const companySlug = inferCompanySlug(location.pathname)

  // When the user goes to /logout directly, we don't want to return there
  if (notCompanySlugs.some((path) => returnTo.pathname.startsWith(`/${path}`))) {
    logoutReturnToParams.set('returnTo', `/${companySlug || ''}`)
  } else {
    logoutReturnToParams.set('returnTo', returnTo.pathname + returnTo.search + returnTo.hash)
  }

  window.location.href = `/api/auth/logout?returnTo=${encodeURIComponent(`/logout?${logoutReturnToParams.toString()}`)}`
}

export function useCurrentAuth0User() {
  const { isLoading, user } = useUser()
  const { email, name, picture } = user || {}

  return {
    email: defaultTo(email, undefined),
    isLoading,
    name: defaultTo(name, undefined),
    picture: defaultTo(picture, undefined),
  }
}
