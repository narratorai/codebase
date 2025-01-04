// @ts-check
/* eslint-disable @typescript-eslint/no-require-imports */
const { createSecureHeaders } = require('next-secure-headers')
const { antdOverrides } = require('@narratorai/theme')
const withPlugins = require('next-compose-plugins')
const { withSentryConfig } = require('@sentry/nextjs')
const withLess = require('next-with-less')

// Duped from src/util/env because we can't import that here
const isProduction = process.env.NEXT_PUBLIC_IS_PRODUCTION === 'true'
const isPreview = process.env.NEXT_PUBLIC_IS_PREVIEW === 'true'
const isDeployed = process.env.NODE_ENV === 'production'
const isNonProd = process.env.NEXT_PUBLIC_GRAPH_DOMAIN !== 'graph.narrator.ai'
const isDev = !isDeployed || (!isProduction && !isPreview)

const basePath = ''

const generateBuildId = async () => {
  return process.env.GITHUB_SHA || process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_HASH || 'development'
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // TODO cleanup all the strict mode warnings!
  // https://nextjs.org/docs/api-reference/next.config.js/react-strict-mode
  // reactStrictMode: true,

  // Setting to true beaks nextjs-auth0
  // https://nextjs.org/docs/api-reference/next.config.js/trailing-slash
  trailingSlash: false,

  // Use the CDN in production and localhost for development.
  // assetPrefix: isDeployed ? 'https://cdn.mydomain.com' : '',

  // Only set for the SentryWebpackPlugin to be able to resolve sourcemaps correctly
  // https://nextjs.org/docs/api-reference/next.config.js/basepath
  basePath,

  // https://nextjs.org/docs/api-reference/next.config.js/disabling-x-powered-by
  poweredByHeader: false,

  // https://nextjs.org/docs/advanced-features/source-maps
  productionBrowserSourceMaps: true,

  generateBuildId,

  experimental: {
    serverComponentsExternalPackages: ['pino'],
    webpackBuildWorker: true,
    workerThreads: true,
  },

  transpilePackages: ['@ant-design/icons', '@ant-design/icons-svg'],

  eslint: {
    // Github Actions will run eslint for us
    // See https://nextjs.org/docs/app/building-your-application/optimizing/memory-usage#disable-static-analysis
    ignoreDuringBuilds: true,
  },

  // https://nextjs.org/docs/api-reference/next.config.js/custom-webpack-config
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Disable webpack caching in builds to prevent OOM errors
    // See https://nextjs.org/docs/app/building-your-application/optimizing/memory-usage#disable-webpack-cache
    if (config.cache && !dev) {
      config.cache = Object.freeze({ type: 'memory' })
    }

    // Inject buildId into env
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.BUILD_ID': JSON.stringify(buildId),
        'process.env.SENTRY_RELEASE': JSON.stringify(buildId),
        // apollo-client uses this
        __DEV__: JSON.stringify(isDev),
      })
    )

    // Load SVGs with SVGR instead of the next/image component
    // https://react-svgr.com/docs/webpack/
    config.module.rules.push({
      test: /\.svg$/i,
      use: ['@svgr/webpack'],
    })

    config.resolve.fallback = { fs: false }

    // Return the modified config
    return config
  },

  // https://nextjs.org/docs/api-reference/next.config.js/headers
  // https://github.com/jagaapple/next-secure-headers
  async headers() {
    // Assemble the Sentry CSP reporting endpoint based on the Sentry DSN
    let sentryCSPEndpoint
    if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
      // @ts-expect-error This is a string set by doppler
      const sentryDSN = new URL(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)
      sentryCSPEndpoint = new URL(`${sentryDSN.protocol}//${sentryDSN.host}/api${sentryDSN.pathname}/security/`)
      const sentryCSPEndpointParams = new URLSearchParams()

      sentryCSPEndpointParams.set('sentry_key', sentryDSN.username)
      sentryCSPEndpointParams.set('sentry_environment', isProduction ? 'production' : isPreview ? 'preview' : 'dev')
      sentryCSPEndpointParams.set('sentry_release', await generateBuildId())
      sentryCSPEndpoint.search = sentryCSPEndpointParams.toString()
    }

    return [
      {
        source: '/(.*)',
        headers: [
          ...createSecureHeaders({
            forceHTTPSRedirect: [true, { maxAge: 31536000, includeSubDomains: true, preload: isDeployed }],
            frameGuard: ['allow-from', { uri: 'https://js.stripe.com' }],
            referrerPolicy: 'no-referrer',
            xssProtection: 'block-rendering',
            contentSecurityPolicy: {
              directives: {
                reportURI: sentryCSPEndpoint,
                defaultSrc: ["'none'"],
                baseURI: ["'none'"],
                objectSrc: ["'self'"],
                manifestSrc: ["'self'"],
                connectSrc: [
                  // Narrator Internal
                  "'self'",
                  'https://*.narrator.ai',
                  `https://${process.env.NEXT_PUBLIC_GRAPH_DOMAIN}/healthz`,
                  `https://${process.env.NEXT_PUBLIC_GRAPH_DOMAIN}/v1/graphql`,
                  `wss://${process.env.NEXT_PUBLIC_GRAPH_DOMAIN}/v1/graphql`,

                  // Stripe integration
                  'https://*.stripe.com',

                  // Local Mavis
                  // TODO figure out a way to include this only for internal users!
                  'http://localhost:8000',

                  // Pre-signed S3 links
                  // TODO figure out a better way to do this than allowing all s3!!!!
                  'https://*.s3.amazonaws.com',

                  // User Avatars
                  'https://*.googleusercontent.com',
                  'https://*.gravatar.com',
                  'https://*.wp.com/cdn.auth0.com/',

                  // StatusPage -- which one based on env
                  isNonProd ? 'https://narratortest.statuspage.io' : 'https://www.narratorstatus.com',

                  // Sentry
                  'https://*.ingest.sentry.io',

                  // LaunchDarkly
                  'https://app.launchdarkly.com',
                  'https://events.launchdarkly.com',

                  // LogRocket
                  'https://r.intake-lr.com',
                  'https://r.lrkt-in.com',

                  // HelpScout
                  'https://beaconapi.helpscout.net',
                  'https://chatapi.helpscout.net',
                  'https://d3hb14vkzrxvla.cloudfront.net',
                  'wss://ws-helpscout.pusher.com',

                  // Segment
                  'https://api.segment.io',

                  // CloudFlare Stream + Images
                  'https://cloudflarestream.com',
                ],
                scriptSrc: [
                  "'self'",
                  // TODO use a nonce on inline scripts
                  "'unsafe-inline'",
                  // ajv (used by react-jsonschema-form) uses eval -- so we must include it here despite the security implications
                  // Otherwise, we would only want this in dev so Nextjs can do its hot reload, ie:
                  // isDeployed ? null : "'unsafe-eval'",
                  "'unsafe-eval'",
                  'https://sc.t.narrator.ai',
                  'https://beacon-v2.helpscout.net',
                  'https://cdn.intake-lr.com',
                  'https://cdn.lrkt-in.com',
                  'https://*.stripe.com',
                ].filter(Boolean),
                // "unsafe-inline" is required because of CSS-in-JS
                // TODO use a nonce on inline styles
                styleSrc: ["'self'", "'unsafe-inline'"],
                fontSrc: ["'self'", 'https://assets.narrator.ai', 'data:'],
                frameSrc: [
                  isNonProd ? 'https://nonprod.auth.narrator.ai' : 'https://auth.narrator.ai',
                  'https://*.stripe.com',
                  "'self'",
                ],
                mediaSrc: ["'self'", 'blob:', 'https://beacon-v2.helpscout.net'],
                imgSrc: [
                  "'self'",
                  'data:',
                  'blob:',
                  // Less than ideal but we need to allow any images for companies with branding set up
                  // TODO figure out a way to proxy these and be more restrictive
                  'https:',
                ],
                workerSrc: ["'self'", 'blob:'],
                childSrc: ["'self'", 'blob:'],
              },
            },
          }),

          // Fake CORS header. We don't want CORS at all, but Vercel won't allow us to remove the default * header
          // We don't use cross-origin requests, otherwise this static value would be problematic and we'd need to make it dynamic, which does not seem possible at this time
          { key: 'access-control-allow-origin', value: 'https://portal.narrator.ai' },
        ],
      },
    ]
  },
}

const buildConfig = withPlugins(
  [
    [
      withLess,
      {
        lessLoaderOptions: {
          lessOptions: {
            modifyVars: antdOverrides,
          },
        },
      },
    ],
  ],
  nextConfig
)

module.exports = (phase) => {
  // Letting next inject its default config (would be 2nd param to this function) causes all kinds of
  // validation warnings. Skipping here.
  const config = buildConfig(phase, {})

  // Finally, wrap with sentry
  return withSentryConfig(
    {
      ...config,
      sentry: {
        hideSourceMaps: true,
        widenClientFileUpload: true,
        disableLogger: true,
      },
    },
    {
      // Additional config options for the Sentry Webpack plugin. Keep in mind that
      // the following options are set automatically, and overriding them is not
      // recommended:
      //   release, url, org, project, authToken, configFile, stripPrefix,
      //   urlPrefix, include, ignore
      silent: true, // Suppresses all logs
      dryRun: isDev,
      // For all available options, see:
      // https://github.com/getsentry/sentry-webpack-plugin#options.
    }
  )
}
