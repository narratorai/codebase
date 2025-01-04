import { TLRU } from 'tlru'
import { makeApolloClient } from 'util/graphql/apollo' // TODO: Consider eliminating this dependency (e.g., move the code here)
import { GetToken } from 'util/interfaces' // TODO: Consider eliminating this dependency (e.g., move the code here)

import { isServer } from '@/util/env'

if (!isServer) {
  throw new Error('Module cannot be used client side')
}

interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope?: string | undefined
  id_token?: string | undefined
  refresh_token?: string | undefined
}

const _tokenCache = new TLRU<string, TokenResponse>({
  maxStoreSize: 1,
  defaultLRU: false,
})

export const getServiceAdminGraphToken = async () => {
  const getAdminToken = async () => {
    if (_tokenCache.has('token')) {
      // Get the token but do not revive its TTL
      return _tokenCache.get('token', false)
    }
    return await refreshAdminToken()
  }

  const refreshAdminToken = async () => {
    const adminToken = await _fetchToken()
    _tokenCache.set('token', adminToken, adminToken.expires_in * 1000 - 10 * 1000)
    return adminToken
  }

  const _fetchToken = async () => {
    // M2M exchange for admin token
    const tokenResponse = await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/oauth/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        audience: process.env.AUTH0_AUDIENCE_GRAPH,
        grant_type: 'client_credentials',
        client_id: process.env.AUTH0_ADMIN_CLIENT_ID,
        client_secret: process.env.AUTH0_ADMIN_CLIENT_SECRET,
      }),
    })
    const adminToken = (await tokenResponse.json()) as TokenResponse
    return adminToken
  }

  return { getAdminToken, refreshAdminToken }
}

export const getServiceAdminGraphClient = async () => {
  const { getAdminToken } = await getServiceAdminGraphToken()
  const getToken: GetToken = async () => {
    const token = await getAdminToken()
    return token?.access_token as string
  }
  return makeApolloClient({ getToken })
}
