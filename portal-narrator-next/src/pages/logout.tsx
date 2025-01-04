import { useAuth0 } from 'components/context/auth/hooks'
import { CenteredLoader } from 'components/shared/icons/Loader'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { parseQueryValue } from '@/util/nextjs'
import { makeTitle } from '@/util/title'

interface Props {
  title?: string

  server?: {
    // From getSentryServerSideProps
    trace?: string
  }
}

/**
 * Logout Page
 *
 * A user can go to this route directly to logout
 * Auth0 redirects to this route post logout, and if we pass a returnTo value here then this page
 * will continue the redirect
 */
const PortalLogoutPage = ({ title, server }: Props) => {
  const { logout, authCompany } = useAuth0()
  const pageTitle = makeTitle(title)

  const router = useRouter()
  const returnTo = parseQueryValue(router.query.returnTo)

  useEffect(() => {
    if (!router.isReady) {
      return
    }

    const isPostLogout = !!returnTo

    if (isPostLogout) {
      // User is returned here after logging out.
      // Redirecting to the returnTo param will bring them to a login screen that is primed to go
      window.location.replace(returnTo)
    } else {
      // User has gotten to this route directly, initiate logout flow
      logout({ returnTo: `/${authCompany || ''}` })
    }
  }, [router, returnTo, logout, authCompany])

  return (
    <>
      <Head>
        {server?.trace && <meta key="sentry-trace" name="sentry-trace" content={server.trace} />}
        <title key="title">{pageTitle}</title>
      </Head>
      <CenteredLoader id="logout-no-company-loader" />
    </>
  )
}

export default PortalLogoutPage
