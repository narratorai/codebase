import { Props as DynamicPlotProps } from 'components/shared/DynamicPlot'
import { Moment } from 'moment-timezone'

export interface ICustomerJourneyActivityRowFeature {
  for_link: boolean
  for_copy: boolean
  label: string
  value: string
}

export interface ICustomerJourneyActivityRow {
  activity: string
  activity_id: string
  activity_name: string
  activity_occurrence: number
  dot_color: string
  feature_1: any
  feature_2: any
  feature_3: any
  features: ICustomerJourneyActivityRowFeature[]
  customer?: string
  link: string | null
  revenue_impact: number | null
  source_id: string
  ts: string
  repeated_activities?: Partial<Omit<ICustomerJourneyActivityRow, 'repeated_activities'>>[]
  _id: number
}

export interface ICustomerJourneyActivityRowWithMoment extends ICustomerJourneyActivityRow {
  moment: Moment
}

export type CustomerKindTypes = 'anonymous_customer_id' | 'customer' | 'join_customer'

export interface ICustomerJourneyQueryParams {
  table: string
  customer?: string
  customer_kind?: string
  activities?: string[]
  start_activity?: string
  only_first_occurrence?: boolean
  timestamp?: string
  asc?: boolean
  time_filter?: string
  as_visual?: boolean
  run_live?: string
  depth?: string | number // convert to a number in form though
  hide_activities?: boolean
  time_between?: string | number // convert to a number in form though
  time_between_resolution?: string
}

export interface ValuesFromParams extends Omit<ICustomerJourneyQueryParams, 'time_filter'> {
  // time_filter is saved in the url as btoa string
  // but parsed into object in <Customer />
  time_filter: {
    operator?: string
    [key: string]: any
  }
}

export interface IGetCustomerJourneyData {
  asc: boolean
  customer_kind?: CustomerKindTypes
  customer?: string
  table: string
  go_to_row_id?: number
  data: {
    columns: {
      friendly_name: string
      name: string
      type: string
    }[]
    rows: ICustomerJourneyActivityRow[]
    job_id: string | null
    retrieved_at: string
  }
  plot?: DynamicPlotProps
  retrieved_at?: string
}
