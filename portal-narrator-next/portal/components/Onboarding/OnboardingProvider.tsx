import { ApolloError } from '@apollo/client'
import { App } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { Typography } from 'components/shared/jawns'
import { ICompany, ICompany_Status_Enum, useOnboardingDataQuery } from 'graph/generated'
import { includes, isEmpty, noop } from 'lodash'
import { usePathname } from 'next/navigation'
import React, { useCallback, useContext, useEffect } from 'react'
import { Redirect } from 'react-router'

interface OnboardingProviderProps {
  loading: boolean
  error?: ApolloError
  refetchOnboardingData(): void
  hasFullyOnboarded: boolean
  hasConnectedWarehouse: boolean
  hasTransformations: boolean
  hasProductionQueries: boolean
  hasDatasets: boolean
  isCompanyArchived: boolean
}

const defaultOnboardingProviderProps: OnboardingProviderProps = {
  loading: true,
  error: undefined,
  refetchOnboardingData: noop,
  hasFullyOnboarded: false,
  hasConnectedWarehouse: false,
  hasTransformations: false,
  hasProductionQueries: false,
  hasDatasets: false,
  isCompanyArchived: false,
}

export const OnboardingContext = React.createContext<OnboardingProviderProps>(defaultOnboardingProviderProps)
export const useOnboardingContext = () => useContext(OnboardingContext)

/**
 * Show notification if they haven't connected their warehouse
 * (and they aren't already on the warehouse page or setting up their payment)
 *
 * @param company
 */
const useConnectWarehouseNotification = (company: ICompany) => {
  const { notification } = App.useApp()
  const { isCompanyAdmin } = useUser()
  const pathname = usePathname()

  const companyMissingPayment = company.status === ICompany_Status_Enum.MissingPayment
  const hasConnectedWarehouse = company.status === ICompany_Status_Enum.Active
  const showConnectedWarehouseNotification =
    !hasConnectedWarehouse && !includes(pathname, '/manage/warehouse') && !companyMissingPayment

  useEffect(() => {
    if (showConnectedWarehouseNotification) {
      const description = isCompanyAdmin ? (
        <Typography>
          You can connect to your warehouse{' '}
          <a target="_blank" href={`/${company.slug}/manage/warehouse`} rel="noreferrer">
            here
          </a>
        </Typography>
      ) : (
        <Typography>Contact a company admin to connect your warehouse</Typography>
      )

      notification.warning({
        key: 'has-not-connected-warehouse-warning',
        placement: 'topRight',
        duration: null,
        message: "You haven't connected your warehouse",
        description,
      })
    }
  }, [company.slug, showConnectedWarehouseNotification, isCompanyAdmin, notification])
}

interface Props {
  children: React.ReactNode
}

const OnboardingProvider = ({ children }: Props) => {
  const company = useCompany()

  const {
    data: onboardingData,
    loading,
    error,
    refetch,
  } = useOnboardingDataQuery({
    variables: {
      company_id: company.id,
    },
  })

  const hasTransformations = !isEmpty(onboardingData?.transformations)
  const hasProductionQueries = !isEmpty(onboardingData?.productionQueries)
  const hasDatasets = !isEmpty(onboardingData?.datasets)
  const companyMissingPayment = company.status === ICompany_Status_Enum.MissingPayment
  const isCompanyArchived = company.status === ICompany_Status_Enum.Archived
  const hasConnectedWarehouse = company.status === ICompany_Status_Enum.Active

  // We consider a company as "fully onboarded" when:
  //  - has connected warehouse (company.status == Active)
  //  - company.tables exist
  //  - has production queries
  //  - has dataset created
  const hasFullyOnboarded = hasConnectedWarehouse && !isEmpty(company.tables) && hasProductionQueries && hasDatasets

  useConnectWarehouseNotification(company)

  const refetchOnboardingData = useCallback(() => {
    // Once company has fully onboarded, calling the refetchOnboardingData function has no effect
    if (!hasFullyOnboarded) {
      refetch()
    }
  }, [hasFullyOnboarded, refetch])

  if (companyMissingPayment) return <Redirect to={`/${company.slug}/onboarding`} />
  return (
    <OnboardingContext.Provider
      value={{
        loading,
        error,
        refetchOnboardingData,
        hasFullyOnboarded,
        hasConnectedWarehouse,
        hasTransformations,
        hasProductionQueries,
        hasDatasets,
        isCompanyArchived,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export default OnboardingProvider
