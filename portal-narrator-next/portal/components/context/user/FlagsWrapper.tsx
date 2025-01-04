import { useAuth0 } from 'components/context/auth/hooks'
import { withLDProvider } from 'launchdarkly-react-client-sdk'

import { isDev } from '@/util/env'
import { getLogger } from '@/util/logger'

import { useUser } from './hooks'

const logger = getLogger()

interface Props {
  children: React.ReactNode
}

const FlagsWrapper = ({ children }: Props) => {
  const { user } = useUser()
  const { user: authUser, authCompany } = useAuth0()

  const ChildFragment = () => children

  // We allow query parameters like ?flag_<name>=<value> in order to override launch darkly's variation decisions.
  // This is mostly for E2E testing, and dev sanity. These params will not work for normal use on deployments.
  let flagOverrides
  if (window.location.search && (window.Cypress || isDev)) {
    const queryParams = new URLSearchParams(window.location.search)
    const flagParams = [...queryParams.entries()].filter(([key]) => key.startsWith('flag_'))

    if (flagParams.length) {
      flagOverrides = Object.fromEntries(
        flagParams.map(([key, value]) => {
          const k = key.replace('flag_', '')
          let v: boolean | string = value
          // cast string booleans as booleans
          if (v === 'true') {
            v = true
          }
          if (v === 'false') {
            v = false
          }
          return [k, v]
        })
      )

      logger.debug({ flagOverrides }, 'Using flag query parameter overrides')
    }
  }

  if (process.env.NEXT_PUBLIC_LD_CLIENT_ID && authUser) {
    const Wrapped = withLDProvider({
      clientSideID: process.env.NEXT_PUBLIC_LD_CLIENT_ID,
      // https://launchdarkly.github.io/js-client-sdk/interfaces/_launchdarkly_js_client_sdk_.ldoptions.html
      options: {
        // if ?flag_ query parameters are present, use those if conditions for overriding are met
        // otherwise persist flags into localstorage
        bootstrap: flagOverrides ?? 'localStorage',

        // disable streaming updates as this can thrash sessions if flags are updated while users are on the app
        streaming: false,
        // not using A/B testing so skip the extra request
        fetchGoals: false,
        // use custom launchdarly relay
        // https://docs.launchdarkly.com/home/advanced/relay-proxy/using
        // baseUrl: 'TODO',
        // streamUrl: 'TODO',
        // eventsUrl: 'TODO',
      },
      reactOptions: {
        // Less convenient, but required to work with code references
        // https://docs.launchdarkly.com/docs/git-code-references
        useCamelCaseFlagKeys: false,
      },
      user: {
        anonymous: false,
        key: authUser.sub as string,
        // TODO migrate to this better key format
        // key: `${authCompany}|${user.email}`,
        email: user.email,
        name: authUser.name as string,
        avatar: authUser.picture as string,
        custom: {
          companySlug: authCompany || '',
        },
      },
    })(ChildFragment)

    return <Wrapped />
  }

  return <ChildFragment />
}

export default FlagsWrapper
