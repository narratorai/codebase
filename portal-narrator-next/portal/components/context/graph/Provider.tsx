import { ApolloClient, ApolloProvider } from '@apollo/client'
import { useAuth0 } from 'components/context/auth/hooks'
import React, { useEffect, useState } from 'react'
import { makeApolloClient } from 'util/graphql/apollo'
import usePrevious from 'util/usePrevious'

import { getLogger } from '@/util/logger'

import { CenteredLoader } from '../../shared/icons/Loader'

const logger = getLogger()

interface Props {
  children: React.ReactNode
}

const GraphProvider = ({ children }: Props) => {
  const { authCompany, isAuthenticated, getTokenSilently } = useAuth0()
  const [client, setClient] = useState<ApolloClient<any>>()
  const prevCompanySlug = usePrevious(authCompany)

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    let newClient: ApolloClient<any> | undefined

    if (!client || authCompany !== prevCompanySlug) {
      logger.debug({ company: authCompany }, `Starting apollo client`)
      newClient = makeApolloClient({ getToken: getTokenSilently })
      setClient(newClient)
    }

    return () => {
      if (client && newClient) {
        const extracted = client.extract(true)
        newClient.restore(extracted)
        newClient.reFetchObservableQueries(true)

        logger.debug({ company: prevCompanySlug }, `Stopping previous apollo client`)
        client.stop()
      }
    }
  }, [client, setClient, isAuthenticated, getTokenSilently, authCompany, prevCompanySlug])

  if (!client) {
    return <CenteredLoader id="graph-loader" />
  }

  return <ApolloProvider client={client}>{children}</ApolloProvider>
}

export default GraphProvider
