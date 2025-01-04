import React from 'react'

import { Arrow, Content, Label, Portal, Tooltip, Trigger } from '@/components/shared/Tooltip'
import { useCompany } from '@/stores/companies'
import { formatDateTime, formatShortTime } from '@/util/formatters'

import { TIME_TOOLTIP_DELAY } from './constants'

interface Props {
  value: string
}

const CustomerJourneyTime = ({ value }: Props) => {
  const company = useCompany()

  const shortTime = formatShortTime(value, company)
  const dateTime = formatDateTime(value, company)
  const separatedShortTime = `\u2022 ${shortTime}`

  return (
    <Tooltip delayDuration={TIME_TOOLTIP_DELAY}>
      <Trigger className="cursor-text">
        <span className="text-gray-400">{separatedShortTime}</span>
      </Trigger>
      <Portal>
        <Content>
          <Label>{dateTime}</Label>
          <Arrow />
        </Content>
      </Portal>
    </Tooltip>
  )
}

export default CustomerJourneyTime
