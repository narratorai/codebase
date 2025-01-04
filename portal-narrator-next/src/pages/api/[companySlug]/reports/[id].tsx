import type { NextApiRequest, NextApiResponse } from 'next'
import { enum as zenum, object, string } from 'zod'

import { getLogger } from '@/util/logger'
import { createPDF, createScreenshot } from '@/util/playwright'

const logger = getLogger()

const schema = object({
  companySlug: string().max(255),
  format: zenum(['pdf', 'png', 'jpeg']),
  id: string().uuid(),
  runKey: string().max(255).optional(),
})

function getBaseUrl(req: NextApiRequest) {
  const { host, 'x-forwarded-proto': protocol } = req.headers
  return `${protocol}://${host}`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { data: sanitizedQuery, error } = schema.safeParse(req.query)
  if (error) return res.status(422).send(error)

  const { companySlug, format, id, runKey } = sanitizedQuery
  const baseUrl = getBaseUrl(req)
  const url = `${baseUrl}/v2/${companySlug}/reports/${id}/export?runKey=${runKey}`
  const headers = {
    'x-api-key': req.headers['x-api-key'] as string,
  }

  try {
    if (format === 'pdf') {
      const buffer = await createPDF(url, { headers })
      const fileName = `${id}.pdf`

      res
        .setHeader('Content-Type', 'application/pdf')
        .setHeader('Content-Disposition', `attachment; filename=${fileName}`)
        .setHeader('Content-Length', buffer.length)
        .send(buffer)
    } else {
      const buffer = await createScreenshot(url, format, { headers })
      const fileName = `${id}.${format}`

      res
        .setHeader('Content-Type', `image/${format}`)
        .setHeader('Content-Disposition', `attachment; filename=${fileName}`)
        .setHeader('Content-Length', buffer.length)
        .send(buffer)
    }
  } catch (error) {
    logger.error(error)
    res.status(500).send('Error exporting report')
  }
}
