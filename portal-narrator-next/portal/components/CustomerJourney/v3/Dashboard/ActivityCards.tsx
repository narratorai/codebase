import { Activities } from 'components/Activities/v2/interfaces'
import { chunk, map } from 'lodash'

import ActivityCardRow from './ActivityCardRow'
import { ACTIVITY_CARD_ROW_LENGTH } from './constants'
import { DayRangeValues } from './interfaces'

interface Props {
  activities: Activities
  tableId: string
  dayRange: DayRangeValues
  onSelectCustomer: (customerEmail: string) => void
}

const ActivityCards = ({ activities, tableId, dayRange, onSelectCustomer }: Props) => {
  const activitiesByRow = chunk(activities, ACTIVITY_CARD_ROW_LENGTH)

  return map(activitiesByRow, (activities) => (
    <ActivityCardRow
      activities={activities as Activities}
      tableId={tableId}
      onSelectCustomer={onSelectCustomer}
      dayRange={dayRange}
    />
  ))
}

export default ActivityCards
