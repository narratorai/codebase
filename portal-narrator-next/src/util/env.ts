export const isServer = typeof window === 'undefined'
export const isClient = !isServer
export const isWebworker = isClient && self.document === undefined

// Is this a deployment vs running locally in development
export const isDeployed = process.env.NODE_ENV === 'production'

// This this connected to nonprod
export const isNonProd = process.env.NEXT_PUBLIC_GRAPH_DOMAIN !== 'graph.narrator.ai'

// Env vars set in Vercel
export const isProduction = process.env.NEXT_PUBLIC_IS_PRODUCTION === 'true'
export const isPreview = process.env.NEXT_PUBLIC_IS_PREVIEW === 'true'
export const isDev = !isDeployed || (!isProduction && !isPreview)
