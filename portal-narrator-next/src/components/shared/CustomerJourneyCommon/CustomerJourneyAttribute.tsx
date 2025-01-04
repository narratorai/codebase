/* eslint-disable simple-import-sort/imports */
import { formatShortString } from '@/util/formatters'
import React from 'react'

import { Tag, Label as TagLabel } from '@/components/shared/Tag'
import { Arrow, Content, Label, Portal, Tooltip, Trigger } from '@/components/shared/Tooltip'

import { ATTRIBUTE_TOOLTIP_DELAY, ATTRIBUTE_TOOLTIP_MESSAGE, ATTRIBUTE_VALUE_TRUNCATE_LIMIT } from './constants'

interface Props {
  name: string
  value: string
}

const CustomerJourneyAttribute = ({ name, value }: Props) => {
  const shortValue = formatShortString(value, { truncateLimit: ATTRIBUTE_VALUE_TRUNCATE_LIMIT })

  const handleClick = (text: string) => {
    navigator.clipboard.writeText(text) // TODO: Consider factoring out the navigator operations
  }

  return (
    <Tooltip delayDuration={ATTRIBUTE_TOOLTIP_DELAY}>
      <Trigger onClick={() => handleClick(value)}>
        <Tag size="lg" color="transparent" border>
          <TagLabel>
            <span className="pr-1 font-bold">{`${name}:`}</span>
            <span>{shortValue}</span>
          </TagLabel>
        </Tag>
      </Trigger>
      <Portal>
        <Content>
          <Label>{`${ATTRIBUTE_TOOLTIP_MESSAGE} ${value}`}</Label>
          <Arrow />
        </Content>
      </Portal>
    </Tooltip>
  )
}

export default CustomerJourneyAttribute
