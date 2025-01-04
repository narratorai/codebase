import { Moment } from 'moment-timezone'

export type CustomCronSegmentations = 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'

export interface CustomCronFormProps {
  frequency: number
  segmentation: CustomCronSegmentations
  repeats_at?: Moment
  minute_of_hour?: number[]
  starts_on_hour?: Moment
  repeats_on_week_days?: number[]
  repeats_on_month_days?: number[]
  starts_on_month?: number
  starts_on_year?: Moment
}
