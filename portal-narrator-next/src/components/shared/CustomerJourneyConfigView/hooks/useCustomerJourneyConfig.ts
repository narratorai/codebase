import { useMemo } from 'react'

import { useCompany } from '@/stores/companies'
import { IRemoteJourneyConfig } from '@/stores/journeys'

import {
  compileCustomerJourneyConfigActivities,
  compileCustomerJourneyConfigCustomer,
  compileCustomerJourneyConfigDateRange,
} from '../util'

const useCustomerJourneyConfig = (config: IRemoteJourneyConfig) => {
  const company = useCompany()
  const { customer, activities, activityAction, fromTime, toTime } = config
  const customerLine = useMemo(() => compileCustomerJourneyConfigCustomer(customer), [customer])
  const activitiesLine = useMemo(
    () => compileCustomerJourneyConfigActivities(activities, activityAction),
    [activities, activityAction]
  )
  const dateRangeLine = useMemo(
    () => compileCustomerJourneyConfigDateRange(fromTime, toTime, company),
    [fromTime, toTime, company]
  )

  return {
    customerLine,
    activitiesLine,
    dateRangeLine,
  }
}

export default useCustomerJourneyConfig
