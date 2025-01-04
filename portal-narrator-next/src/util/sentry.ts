// eslint-disable-next-line no-restricted-imports
import * as Sentry from '@sentry/nextjs'
import { GetServerSideProps } from 'next'

export default Sentry

/**
 * This can be used as `getServerSideProps` on pages to wrap them in Sentry tracing.
 * You will need to inject a trace header into the page meta via props, see example in `DynamicPortalRoute`
 *
 * To use you can add:
 *   export { getSentryServerSideProps as getServerSideProps } from '@/util/sentry'
 * to your page component, or compose it into a custom `getServerSideProps`
 *
 * NOTE using this forces the page into being server-generated, and should not be used for pages
 * that can be rendered statically / don't do anything interesting on the server
 */
export const getSentryServerSideProps: GetServerSideProps = async (ctx) => {
  const transaction = Sentry.startTransaction({
    op: 'transaction',
    name: 'server.render',
  })

  Sentry.configureScope((scope) => {
    scope.setSpan(transaction)
  })

  ctx.req.on('close', () => {
    transaction.finish()
  })

  return {
    props: {
      server: {
        trace: transaction.toTraceparent(),
      },
    },
  }
}
