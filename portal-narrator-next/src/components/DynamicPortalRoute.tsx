import type { User } from 'components/context/auth/Provider'
import { GetServerSideProps } from 'next'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import { useRouter } from 'next/router'

import { parseQueryValue } from '@/util/nextjs'
import { makeTitle } from '@/util/title'

// Dynamically import portal and dont try to server-render it
const PortalRoot = dynamic<{ companySlug?: string }>(() => import('portal/Root'), { ssr: false })

interface Props {
  title?: string
  user?: User

  server?: {
    // From getSentryServerSideProps
    trace?: string
  }
}

const DynamicPortalRoute = ({ title, user, server }: Props) => {
  const router = useRouter()

  // Resolve company from url, or fallback to user org id
  const { company_slug } = router.query
  const companySlug = parseQueryValue(company_slug) || user?.org_name

  const pageTitle = makeTitle(title || company_slug)

  return (
    <>
      <Head>
        {server?.trace && <meta key="sentry-trace" name="sentry-trace" content={server.trace} />}
        <title key="title">{pageTitle}</title>
      </Head>
      <PortalRoot companySlug={companySlug} />
    </>
  )
}

export default DynamicPortalRoute

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { auth0 } = await import('@/util/server/auth0')
  const { getSentryServerSideProps } = await import('@/util/sentry')

  const sentryProps = await getSentryServerSideProps(ctx)
  const auth0Props = await auth0.withPageAuthRequired()(ctx)

  // If auth0 wants to redirect, do that
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (auth0Props.redirect) {
    return auth0Props
  }

  // Otherwise, return both sentry and auth0 props
  return {
    props: {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      ...sentryProps.props,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      ...auth0Props.props,
    },
  }
}
