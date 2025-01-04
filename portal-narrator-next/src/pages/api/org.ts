import { NextApiRequest, NextApiResponse } from 'next'
import { reportError } from 'util/errors'

import { parseQueryValue } from '@/util/nextjs'
import { getOrgId, getOrgName } from '@/util/server/org-cache'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const queryId = parseQueryValue(req.query.id)
    const queryName = parseQueryValue(req.query.name)

    if (queryId) {
      const name = await getOrgName(queryId)
      if (name) {
        return res.status(200).json({
          org_id: queryId,
          org_name: name,
        })
      }
    }

    if (queryName) {
      const id = await getOrgId(queryName)
      if (id) {
        return res.status(200).json({
          org_id: id,
          org_name: queryName,
        })
      }
    }

    return res.status(400).json({})
  } catch (err) {
    reportError(err as Error, null, { boundary: 'org-handler' })
    return res.status(500).json({})
  }
}
