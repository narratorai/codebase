import { gql } from '@apollo/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { reportError } from 'util/errors'

import { auth0, AUTH0_BASE_URL } from '@/util/server/auth0'
import { getServiceAdminGraphClient } from '@/util/server/graph-admin'
import { getCompanyId, getOrgName } from '@/util/server/org-cache'
import { getUserId } from '@/util/server/user-cache'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await auth0.getSession(req, res)

    if (!session) {
      throw new Error('Missing session')
    }

    const reqUrl = new URL(req.url as string, AUTH0_BASE_URL)
    if (!reqUrl.searchParams.has('state')) {
      throw new Error('Missing state')
    }

    // Note that we can't trust the values in state because anyone could inject whatever they wanted here.
    // After decoding it, validate its properties before continuing
    const state = JSON.parse(Buffer.from(reqUrl.searchParams.get('state') || '', 'base64').toString())

    const sessionOrgId = session.user.org_id
    const sessionOrgName = session.user.org_name || (await getOrgName(sessionOrgId))

    const sessionUserId = await getUserId(session.user.email)
    const sessionCompanyId = await getCompanyId(sessionOrgId)

    if (state.company !== sessionOrgName) {
      throw new Error('Company mismatch')
    }

    if (state.user !== session.user.email) {
      throw new Error('User mismatch')
    }

    if (!state.installationId) {
      throw new Error('Missing installation id')
    }

    // As the portal service, save installation id in graph
    const graphClient = await getServiceAdminGraphClient()
    await graphClient.mutate({
      mutation: gql`
        mutation UpsertGithubInstallation($user_id: uuid!, $company_id: uuid!, $installation_id: Int!) {
          insert_company_github_sync(
            objects: { company_id: $company_id, user_id: $user_id, installation_id: $installation_id }
            on_conflict: { constraint: company_github_sync_installation_id_key, update_columns: [updated_at] }
          ) {
            returning {
              id
            }
          }
        }
      `,
      variables: {
        user_id: sessionUserId,
        company_id: sessionCompanyId,
        installation_id: state.installationId,
      },
    })

    // Finally, redirect back to UI
    const { pathname, search, hash } = new URL(state.fromUrl)
    const redirectUrl = new URL(AUTH0_BASE_URL)
    redirectUrl.pathname = pathname
    redirectUrl.search = search
    redirectUrl.hash = hash

    res.redirect(redirectUrl.toString())
  } catch (err) {
    reportError(err as Error, null, { boundary: 'github-success' })
    return res.status(500).json({})
  }
}

export default auth0.withApiAuthRequired(handler)
