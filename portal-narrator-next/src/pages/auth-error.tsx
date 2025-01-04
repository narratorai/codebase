import CallbackError from 'components/context/auth/CallbackError'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { useCallback, useEffect } from 'react'
import sanitize from 'util/sanitize'

import { logout } from '@/util/auth'
import history from '@/util/history'
import { parseQueryValue } from '@/util/nextjs'
import { makeTitle } from '@/util/title'

interface Props {
  title?: string

  errorParams?: {
    error: string
    error_description: string
    [key: string]: string
  }

  server?: {
    // From getSentryServerSideProps
    trace?: string
  }
}

const PortalAuthErrorPage = ({ title, server, errorParams }: Props) => {
  const pageTitle = makeTitle(title)

  useEffect(() => {
    // Swallow any search params on load
    history.replace({ ...history.location, search: undefined })
  })

  // Force a return to / for a full logout
  const doLogout = useCallback(() => {
    logout({ returnTo: '/' })
  }, [])

  return (
    <>
      <Head>
        {server?.trace && <meta key="sentry-trace" name="sentry-trace" content={server.trace} />}
        <title key="title">{pageTitle}</title>
      </Head>
      <CallbackError errorParams={errorParams} logout={doLogout} />
    </>
  )
}

export default PortalAuthErrorPage

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  // Parse + sanitize query params and inject as props
  const errorParams: Record<string, string> = {}
  const queryParams = ctx.query
  for (const key in queryParams) {
    const val = parseQueryValue(queryParams[key])
    if (val) {
      errorParams[key] = sanitize(val)
    }
  }

  return {
    props: {
      errorParams,
    },
  }
}
