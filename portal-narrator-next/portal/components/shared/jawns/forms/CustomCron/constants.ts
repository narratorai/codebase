import _ from 'lodash'
import { CustomCronSegmentations } from './interfaces'
import { ordinalSuffixOf } from 'util/helpers'

const SEGMENTATION_VALUES: CustomCronSegmentations[] = ['minute', 'hour', 'day', 'week', 'month', 'year']

export const SEGMENTATION_OPTIONS = _.map(SEGMENTATION_VALUES, (segmentation) => ({
  label: `${segmentation}s`,
  value: segmentation,
}))

export const MINTUE_OPTIONS = _.map(_.range(0, 60), (minute) => ({ label: _.toString(minute), value: minute }))

export const DAY_OPTIONS = [
  { label: 'S', value: 0 },
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
]

// 1-31 days
export const MONTH_DAYS_OPTIONS = _.map(_.range(1, 32), (day) => ({
  label: `${ordinalSuffixOf(day)}`,
  value: day,
}))

export const MONTH_OPTIONS = [
  {
    label: 'January',
    value: 1,
  },
  {
    label: 'February',
    value: 2,
  },
  {
    label: 'March',
    value: 3,
  },
  {
    label: 'April',
    value: 4,
  },
  {
    label: 'May',
    value: 5,
  },
  {
    label: 'June',
    value: 6,
  },
  {
    label: 'July',
    value: 7,
  },
  {
    label: 'August',
    value: 8,
  },
  {
    label: 'September',
    value: 9,
  },
  {
    label: 'October',
    value: 10,
  },
  {
    label: 'November',
    value: 11,
  },
  {
    label: 'December',
    value: 12,
  },
]

export const MAX_FREQUENCIES: { [key: string]: number } = {
  minute: 59,
  hour: 23,
  day: 31,
  week: 1,
  month: 6,
  year: 1,
}
