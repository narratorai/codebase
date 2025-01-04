import React from 'react'

import { Date } from '@/components/shared/CustomerJourneyCommon'

import DateBullet from './DateBullet'

interface Props {
  priorDate: string
  date: string
}

const DateEvent = ({ priorDate, date }: Props) => (
  <div className="gap-6 flex-x">
    <DateBullet first={priorDate === date} />
    <div className="gap-1 pb-4 flex-x-center">
      <Date priorDate={priorDate} date={date} />
    </div>
  </div>
)

export default DateEvent
