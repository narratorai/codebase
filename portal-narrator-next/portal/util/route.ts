// Instrumented version of react-router Route component
// Use this instead of react-router route directly!
// https://docs.sentry.io/platforms/javascript/guides/react/configuration/integrations/react-router/

// This is the only place we should import react-router's route!
// eslint-disable-next-line no-restricted-imports
import { Route } from 'react-router'

// Note importing sentry/react directly because this is react specific and not typical for nextjs
// eslint-disable-next-line no-restricted-imports
import * as Sentry from '@sentry/react'

export default Sentry.withSentryRouting(Route)
