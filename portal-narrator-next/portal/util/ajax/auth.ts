import axios from 'axios'
import jwtDecode, { JwtPayload } from 'jwt-decode'

let _auth_token: string | null = null

async function fetchAuthToken() {
  const response = await axios.get<{ accessToken: string }>('/api/auth/token')

  if (response.status !== 200) {
    throw new Error('Failed to fetch token')
  }

  return response.data.accessToken
}

function isTokenValid(token: string) {
  try {
    const decoded = jwtDecode<JwtPayload>(token)
    const tokenExpired = (decoded.exp as number) - Math.floor(Date.now() / 1000) <= 0
    return !tokenExpired
  } catch (error) {
    return false
  }
}

/**
 * Gets an access token from Auth0, caches it, and requests a new one when
 * the cached one has expired.
 */
export async function getAuthToken() {
  if (_auth_token && isTokenValid(_auth_token)) {
    return _auth_token
  }

  try {
    const freshToken = await fetchAuthToken()

    _auth_token = freshToken

    return freshToken
  } catch (error) {
    throw new Error('Failed to obtain token')
  }
}
