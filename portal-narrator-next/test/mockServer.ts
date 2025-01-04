import { rest } from 'msw'
import { setupServer } from 'msw/node'

export const handlers = [
  // passthrough https://example.com for testing retryFetch
  rest.get('https://example.com', (req) => req.passthrough()),
  rest.get(`${process.env.NEXT_PUBLIC_MAVIS_US_URL}/admin/v1/billing/session`, (req, res, ctx) =>
    res(ctx.json({ url: 'https://dashboard.stripe.com/test' }))
  ),
]

export const server = setupServer(...handlers)
