import { NextApiRequest, NextApiResponse } from 'next'

import { auth0 } from '@/util/server/auth0'

async function getAuth0Token(req: NextApiRequest, res: NextApiResponse) {
  const { accessToken } = await auth0.getAccessToken(req, res)
  return accessToken
}

async function getHeaders(req: NextApiRequest, res: NextApiResponse) {
  const headers: Record<string, string> = {
    accept: '*/*',
  }

  if (req.headers['x-api-key']) headers['X-API-KEY'] = req.headers['x-api-key'] as string
  else {
    const token = await getAuth0Token(req, res)
    headers['Authorization'] = `Bearer ${token}`
  }

  return headers
}

/**
 * Endpoint to get an attachment from the Mavis API.
 *
 * It acts as a proxy to the Mavis attachments endpoint. Its main function is to authenticate requests
 * and relay file data from the Mavis API to the client.
 *
 * @returns The attachment raw binary data.
 */
export default async function get(req: NextApiRequest, res: NextApiResponse) {
  const path = req.query.path?.[0]
  const headers = await getHeaders(req, res)

  // TODO: Use the user's company datacenter.
  const url = `${process.env.NEXT_PUBLIC_MAVIS_US_URL}/api/attachments/${path}`
  const response = await fetch(url, { headers })

  if (!response.ok) return res.status(400).end()

  const contentType = response.headers.get('content-type') ?? 'application/octet-stream'
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  return res
    .status(response.status)
    .setHeader('content-type', contentType)
    .setHeader('Cache-Control', 'private, immutable, no-transform, max-age=2629746')
    .send(buffer)
}
