import '@/util/sentry'
// Fonts
import '@fontsource/source-sans-pro/300-italic.css'
import '@fontsource/source-sans-pro/300.css'
import '@fontsource/source-sans-pro/400-italic.css'
import '@fontsource/source-sans-pro/400.css'
import '@fontsource/source-sans-pro/600-italic.css'
import '@fontsource/source-sans-pro/600.css'
import '@fontsource/source-sans-pro/700-italic.css'
import '@fontsource/source-sans-pro/700.css'
// Global Stylesheets
import 'portal/print.css'
import 'portal/react-contexify-overrides.css'
import 'portal/reset.css'
import 'react-contexify/dist/ReactContexify.min.css'
// This file pulls in the base antd CSS which has some sensible defaults so we don't get a
// flash of unstyled if/when we are lazy loading antd components
import 'antd/dist/antd.less'

import { UserProfile, UserProvider } from '@auth0/nextjs-auth0/client'
import LogRocket from 'logrocket'
import setupLogRocketReact from 'logrocket-react'
import { NextComponentType, NextPageContext } from 'next'
import { AppProps as NextAppProps } from 'next/app'
import Head from 'next/head'
import Router from 'next/router'
import React, { useEffect } from 'react'
import analytics from 'util/analytics'

import { isClient } from '@/util/env'
import { makeTitle } from '@/util/title'

// Record a pageview when route changes
Router.events.on('routeChangeComplete', () => {
  analytics.page()
})

if (isClient && process.env.NEXT_PUBLIC_LOGROCKET_ID) {
  LogRocket.init(process.env.NEXT_PUBLIC_LOGROCKET_ID, {
    release: process.env.BUILD_ID,

    // You may exempt elements from being automatically sanitized by adding the data-public attribute to them.
    dom: {
      textSanitizer: true,
      inputSanitizer: true,
    },
    network: {
      requestSanitizer: (request) => {
        // scrub request bodies
        // TODO we could selectively allow some request bodies through
        request.body = undefined

        // scrub auth header
        request.headers['authorization'] = undefined
        request.headers['Authorization'] = undefined

        // scrub cookies
        request.headers['cookies'] = undefined
        request.headers['Cookies'] = undefined

        return request
      },
      responseSanitizer: (response) => {
        // scrub response body
        // TODO we could selectively allow some response bodies through
        response.body = undefined

        response.headers['set-cookie'] = undefined
        response.headers['Set-Cookie'] = undefined

        return response
      },
    },
  })
  setupLogRocketReact(LogRocket)
}

// Setup Monaco workers

// NOTE these files are copies from the published the-sequel package into `public/.monaco/` during a postinstall
// If you ever need to add more, update scripts/postinstall.sh
if (isClient) {
  window.MonacoEnvironment = {
    getWorkerUrl: function (_: any, label: string): string {
      if (label === 'json') {
        return '/.monaco/json.worker.js'
      }
      return '/.monaco/editor.worker.js'
    },
  }
}

// https://nextjs.org/docs/advanced-features/measuring-performance
// export function reportWebVitals(metric: NextWebVitalsMetric) {
//   // TODO do something with these!
//   logger.debug(metric, 'Web Vital Report')
// }

// This app component implements a dynamic layout pattern
// Any page component can specify a static "Layout" property to override
// see https://github.com/vercel/next.js/tree/canary/examples/with-dynamic-app-layout

interface AppProps<P> extends NextAppProps<P> {
  err?: any
  Component: NextComponentType<NextPageContext, any, any> & {
    Layout?: React.ComponentType
  }
}

type Props = AppProps<{
  title?: string
  user?: UserProfile
}>

const App = ({ Component, pageProps, err }: Props) => {
  // If you've used `withPageAuthRequired`, pageProps.user can pre-populate the hook
  // if you haven't used `withPageAuthRequired`, pageProps.user is undefined so the hook
  // fetches the user from the API route
  const { user } = pageProps

  useEffect(() => {
    if (!window.Cypress) {
      // Register the service worker, except when running E2E tests
      window.workbox?.register()
    }
  }, [])

  return (
    <>
      <Head>
        <meta
          key="viewport"
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5.0, minimum-scale=0.75"
        ></meta>
        <title key="title">{makeTitle(pageProps.title)}</title>
      </Head>
      <UserProvider user={user}>
        {/* err prop is workaround for https://github.com/vercel/next.js/issues/8592 */}
        <Component {...pageProps} err={err} />
      </UserProvider>
    </>
  )
}

export default App
