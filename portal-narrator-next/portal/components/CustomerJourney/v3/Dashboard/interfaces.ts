import { IActivityIndexV2Query } from 'graph/generated'

export type Activities = IActivityIndexV2Query['all_activities']

export type DayRangeValues = 1 | 7 | 30 | 60 | 90

export interface CustomerExample {
  customer: string
  customer_display_name: null | string
  occurrence: string
  ts: string
}
