import { ICompany, ICompany_Status_Enum, useCompanySubscription } from 'graph/generated'
import { pick } from 'lodash'
import { useContext } from 'react'
import { CompanyContext } from './Provider'

export const useCompanyContext = () => useContext(CompanyContext)

export const useCompany = () => {
  const ctx = useCompanyContext()
  const company = ctx.result?.data?.company[0]

  return company as ICompany
}

export const useCompanyRefetch = () => {
  const ctx = useCompanyContext()
  const refetch = ctx.result?.refetch
  return refetch
}

// NOTE: This is used during onboarding to listen to `company.status` updates as well
// as company.tables.
// So we get an auto refresh from NEW --> ONBOARDING --> ACTIVE --> "HAS TRANSFORMATION"
export const useOnboardingSubscribedCompany = () => {
  const company = useCompany()

  // tl;dr: This subscription is skipped for onboarded clients
  //
  // Skip if you're already ACTIVE or already have `company.table`
  // so we don't open the subscription for existing onboarded companies
  const shouldSkip = company.status === ICompany_Status_Enum.Active && company.tables.length > 0

  const { data: companyStatusData } = useCompanySubscription({
    variables: {
      company_slug: company.slug,
    },
    skip: shouldSkip,
  })

  // Since we always want to return company data (even if subscription is skipped), we
  // `_.pick` the fields we are subscribed to from `useCompany()`
  const returnedCompany = companyStatusData?.company?.[0] || pick(company, ['id', 'status', 'created_at', 'tables'])

  return returnedCompany as Pick<ICompany, 'id' | 'status' | 'created_at' | 'tables'>
}
