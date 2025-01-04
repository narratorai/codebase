import { map } from 'lodash'
import React from 'react'

import { IRemoteJourneyEvent } from '@/stores/journeys'

import DateEvent from './DateEvent'
import TimeEvent from './TimeEvent'

interface Props {
  priorDate: string
  group: IRemoteJourneyEvent[]
  lastGroup: boolean
}

const EventGroup = ({ priorDate, group, lastGroup }: Props) => (
  <div className="relative flex-y">
    <DateEvent priorDate={priorDate} date={group[0].ts} />
    {map(group, (event, index) => (
      <TimeEvent key={event.id} event={event} last={lastGroup && index === group.length - 1} />
    ))}
  </div>
)

export default EventGroup
