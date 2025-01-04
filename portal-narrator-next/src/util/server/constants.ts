import { isDeployed } from '@/util/env'

/**
 * Get the base URL for the auth0 application.
 *
 * - use localhost in dev
 * - use VERCEL_URL in production
 * - fall-back to AUTH0_BASE_URL when not
 * - set https if url is not localhost
 */
const getBaseUrl = () => {
  let base: string
  if (!isDeployed && !process.env.AUTH0_BASE_URL) {
    base = 'http://localhost:3000'
  } else if (process.env.AUTH0_BASE_URL) {
    base = process.env.AUTH0_BASE_URL
  } else {
    base = `https://portal-git-${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF?.replaceAll('/', '-')}.dev.narrator.ai`
  }

  if (!base.startsWith('http')) {
    if (base.includes('localhost')) {
      base = `http://${base}`
    } else {
      base = `https://${base}`
    }
  }
  return base
}

export const AUTH0_BASE_URL = getBaseUrl()
