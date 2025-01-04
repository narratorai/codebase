import jwtDecode, { JwtPayload } from 'jwt-decode'
import ky from 'ky'

type AuthTokenResponse = {
  accessToken: string
  type: 'bearer' | 'api-key'
}

let _auth_token: AuthTokenResponse | null = null

async function fetchAuthToken() {
  return ky.get('/api/auth/token').json<AuthTokenResponse>()
}

function isTokenValid(token: string) {
  try {
    const decoded = jwtDecode<JwtPayload>(token)
    const tokenExpired = (decoded.exp as number) - Math.floor(Date.now() / 1000) <= 0
    return !tokenExpired
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return false
  }
}

/**
 * Gets an access token from Auth0, caches it, and requests a new one when
 * the cached one has expired.
 *
 * If the API responds with an API key, it will be used instead.
 */
export async function getAPIToken() {
  if (_auth_token && isTokenValid(_auth_token.accessToken)) {
    return _auth_token
  }

  try {
    const authToken = await fetchAuthToken()
    _auth_token = authToken

    return authToken
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    throw new Error('Failed to obtain token')
  }
}
