import { gql } from '@apollo/client'
import { TLRU } from 'tlru'

import { isServer } from '@/util/env'
import { getServiceAdminGraphClient } from '@/util/server/graph-admin'

if (!isServer) {
  throw new Error('Module cannot be used client side')
}

const _emailToId = new TLRU<string, string>({
  defaultLRU: true,
  maxStoreSize: 1000,
  maxAgeMs: 60 * 60 * 1000, // 1 hour
})

export const getUserId = async (email?: string) => {
  if (!email) {
    return undefined
  }

  if (_emailToId.has(email)) {
    return _emailToId.get(email, true) as string
  }

  const graphClient = await getServiceAdminGraphClient()

  const result = await graphClient.query({
    query: gql`
      query PortalServiceUserEmailToId($email: String) {
        user(where: { email: { _eq: $email } }) {
          id
        }
      }
    `,
    variables: { email },
  })

  const id = result.data.user?.[0]?.id as string | undefined
  if (id) {
    _emailToId.set(email, id)
  }
  return id
}
