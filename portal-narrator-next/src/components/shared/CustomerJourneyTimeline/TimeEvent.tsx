/* eslint-disable react/jsx-max-depth */
import React from 'react'

import { Activity, Attributes, Link, Occurrence, Revenue, Time } from '@/components/shared/CustomerJourneyCommon'
import { IRemoteJourneyEvent } from '@/stores/journeys'

import { MAX_VISIBLE_ATTRIBUTES } from './constants'
import TimeBullet from './TimeBullet'

interface Props {
  event: IRemoteJourneyEvent
  last: boolean
}

const TimeEvent = ({ event, last }: Props) => (
  <div className="gap-6 flex-x">
    <TimeBullet last={last} />
    <div className="w-full gap-2 pb-10 flex-y">
      <div className="w-full justify-between gap-4 flex-x-center">
        <div className="gap-4 flex-x-center">
          <div className="gap-1 flex-x-center">
            <Activity value={event.activity} />
            <Time value={event.ts} />
          </div>
          <Occurrence value={event.occurrence} />
          {event.revenue !== null && <Revenue value={event.revenue} />}
        </div>
        {event.link && <Link href={event.link} />}
      </div>
      <Attributes attributes={event.attributes} visibleCount={MAX_VISIBLE_ATTRIBUTES} />
    </div>
  </div>
)

export default TimeEvent
