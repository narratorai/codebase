import {
  IPortalServiceGetOrgIdFromSlugQuery,
  IPortalServiceGetSlugFromOrgIdQuery,
  PortalServiceGetOrgIdFromSlugDocument,
  PortalServiceGetSlugFromOrgIdDocument,
} from 'graph/generated' // TODO: Consider eliminating this dependency (e.g., move the code here)
import { TLRU } from 'tlru'

import { notCompanySlugs } from '@/util/auth'
import { isServer } from '@/util/env'
import { getServiceAdminGraphClient } from '@/util/server/graph-admin'

if (!isServer) {
  throw new Error('Module cannot be used client side')
}

const _nameToId = new TLRU<string, string>({
  defaultLRU: true,
  maxStoreSize: 100,
  maxAgeMs: 20 * 60 * 1000, // 20 minutes
})

const _idToName = new TLRU<string, string>({
  defaultLRU: true,
  maxStoreSize: 100,
  maxAgeMs: 20 * 60 * 1000, // 20 minutes
})

const _idToCompanyId = new TLRU<string, string>({
  defaultLRU: true,
  maxStoreSize: 100,
  maxAgeMs: 20 * 60 * 1000, // 20 minutes
})

export const getOrgId = async (slug?: string) => {
  if (!slug) {
    return undefined
  }
  if (notCompanySlugs.includes(slug)) {
    return undefined
  }

  if (_nameToId.has(slug)) {
    return _nameToId.get(slug, true) as string
  }

  const graphClient = await getServiceAdminGraphClient()

  const result = await graphClient.query<IPortalServiceGetOrgIdFromSlugQuery>({
    query: PortalServiceGetOrgIdFromSlugDocument,
    variables: { slug },
  })

  const id = result.data.company_auth0?.[0]?.org_id as string | undefined
  if (id) {
    _nameToId.set(slug, id)
  }
  return id
}

export const getOrgName = async (orgId?: string) => {
  if (!orgId) {
    return undefined
  }

  if (_idToName.has(orgId)) {
    return _idToName.get(orgId, true) as string
  }
  const graphClient = await getServiceAdminGraphClient()

  const result = await graphClient.query<IPortalServiceGetSlugFromOrgIdQuery>({
    query: PortalServiceGetSlugFromOrgIdDocument,
    variables: { id: orgId },
  })

  const name = result.data.company_auth0?.[0]?.company?.slug as string | undefined
  if (name) {
    _idToName.set(orgId, name)
  }
  return name
}

export const getCompanyId = async (orgId?: string) => {
  if (!orgId) {
    return undefined
  }

  if (_idToCompanyId.has(orgId)) {
    return _idToCompanyId.get(orgId, true) as string
  }
  const graphClient = await getServiceAdminGraphClient()

  const result = await graphClient.query<IPortalServiceGetSlugFromOrgIdQuery>({
    query: PortalServiceGetSlugFromOrgIdDocument,
    variables: { id: orgId },
  })

  const id = result.data.company_auth0?.[0]?.company?.id as string | undefined
  if (id) {
    _idToCompanyId.set(orgId, id)
  }
  return id
}
