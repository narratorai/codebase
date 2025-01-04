'use client'

import { useUser } from '@auth0/nextjs-auth0/client'
import { useFlags, withLDProvider } from 'launchdarkly-react-client-sdk'
import { has, isNil } from 'lodash'

/**
 * Check if a feature flag is enabled.
 *
 * LaunchDarkly is used as the backend for feature flags.
 */
export function useFeatureFlag(flagKey: string) {
  const flags = useFlags()
  return has(flags, flagKey) ? flags[flagKey] : false
}

/**
 * LaunchDarkly provider. Requires a user to be logged in.
 */
export const LaunchDarklyProvider = ({ children }: { children: React.ReactNode }) => {
  const auth0User = useUser()
  const { user } = auth0User

  if (isNil(user)) return children

  const context = {
    anonymous: false,
    avatar: user.picture,
    custom: {
      companySlug: 'narrator-demo2',
    },
    email: user.email as string,
    key: user.sub as string,
    kind: 'user',
    name: user.name as string,
  }

  const LDProvider = withLDProvider({
    clientSideID: process.env.NEXT_PUBLIC_LD_CLIENT_ID as string,
    context,
    options: { bootstrap: 'localStorage', fetchGoals: false, streaming: false },
    reactOptions: {
      useCamelCaseFlagKeys: false,
    },
  })(() => children)

  return <LDProvider />
}
