import { format } from 'date-fns'
import { groupBy, map } from 'lodash'
import React from 'react'

import { IRemoteJourneyEvent } from '@/stores/journeys'

import EventGroup from './EventGroup'

interface Props {
  events: IRemoteJourneyEvent[]
}

const CustomerJourneyTimeline = ({ events }: Props) => {
  const groups = groupBy(events, (event) => format(event.ts, 'yyyyMMdd'))
  const keys = Object.keys(groups).sort()

  if (keys.length === 0) return null

  return (
    <div className="w-full min-w-96 flex-y">
      {map(keys, (key, index) => (
        <EventGroup
          key={key}
          priorDate={groups[keys[index > 0 ? index - 1 : 0]][0].ts}
          group={groups[key]}
          lastGroup={index === keys.length - 1}
        />
      ))}
    </div>
  )
}

export default CustomerJourneyTimeline
