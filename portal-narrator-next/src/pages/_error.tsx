// Only used in production!!
// https://nextjs.org/docs/advanced-features/custom-error-page#customizing-the-error-page

import { NextPage } from 'next'
import NextErrorComponent, { ErrorProps } from 'next/error'

import Sentry from '@/util/sentry'

const ErrorPage: NextPage<ErrorProps> = (props) => {
  return <NextErrorComponent statusCode={props.statusCode} />
}

ErrorPage.getInitialProps = async (contextData) => {
  // In case this is running in a serverless function, await this in order to give Sentry
  // time to send the error before the lambda exits
  await Sentry.captureUnderscoreErrorException(contextData)

  // This will contain the status code of the response
  return NextErrorComponent.getInitialProps(contextData)
}

export default ErrorPage
