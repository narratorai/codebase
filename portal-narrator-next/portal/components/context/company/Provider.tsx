import { QueryResult } from '@apollo/client'
import { CenteredLoader } from 'components/shared/icons/Loader'
import { ICompanySeedQuery, ICompanySeedQueryVariables, useCompanySeedQuery } from 'graph/generated'
import { isEmpty } from 'lodash'
import React, { useEffect } from 'react'
import { reportError } from 'util/errors'

import { notCompanySlugs } from '@/util/auth'

import { useAuth0 } from '../auth/hooks'

export interface ICompanyContext {
  result?: QueryResult<ICompanySeedQuery, ICompanySeedQueryVariables>
}

export const CompanyContext = React.createContext<ICompanyContext>({})

interface Props {
  children: React.ReactNode
}

const CompanyProvider = ({ children }: Props) => {
  const { getTokenSilently, authCompany } = useAuth0()

  const result = useCompanySeedQuery({
    partialRefetch: true,
    returnPartialData: true,
    variables: {
      company_slug: authCompany as string,
    },
    skip: !authCompany,
  })

  const noCompanyFound = !result.loading && result.data && isEmpty(result.data?.company)

  useEffect(() => {
    if (result.loading) {
      return
    }

    if (result.error) {
      reportError('GraphQL Company Seed Error', result.error, {
        query: 'SeedCompany',
      })
    }

    if (result.data) {
      // TODO - decide if how want to use subscribeToMore
      // We were experieincing full refreshs on changes: https://twist.com/a/58740/ch/261471/t/1609168

      // // We can listen to ALL updates to SubscribedCompanySeedDocument and decide what
      // // to do with those updates
      // // https://www.apollographql.com/docs/react/data/subscriptions/#subscribetomore
      // result.subscribeToMore({
      //   document: SubscribedCompanySeedDocument,
      //   variables: { company_slug: companySlug },
      //   updateQuery: (prev, { subscriptionData }) => {
      //     debug('SubscribedCompanySeedDocument SUBSCRIPTION UPDATE', subscriptionData)
      //     // TODO - set something to let the user know that the data has updated!
      //     // We could wait for the user to take an action in a banner with result.refetch()
      //     return prev
      //   },
      // })

      const company = result.data.company[0]
      if (!company) {
        reportError(new Error('Missing company access'), null, {
          companySlug: authCompany,
          authCompany,
        })

        // If a user does not have access to the company,
        // show them unauthorized page
        window.location.replace('/welcome')
      }
    }
  }, [getTokenSilently, result, authCompany])

  // Don't return a loading state if the user has no company
  // - they will be redirected to the welcome page
  if (!authCompany || notCompanySlugs.includes(authCompany) || noCompanyFound) {
    return null
  }

  if (!result?.data?.company?.[0]) {
    return <CenteredLoader id="company-loader" />
  }

  return <CompanyContext.Provider value={{ result }}>{children}</CompanyContext.Provider>
}

export default CompanyProvider
