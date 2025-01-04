/* eslint-disable simple-import-sort/imports */
import { Trigger as PopoverTrigger } from '@/components/shared/Popover'
import React from 'react'

import { Tag, Label as TagLabel } from '@/components/shared/Tag'
import { Arrow, Content, Label, Portal, Tooltip, TooltipTrigger } from '@/components/shared/Tooltip'

import { ATTRIBUTE_TOOLTIP_DELAY, ATTRIBUTES_TRIGGER_TOOLTIP_MESSAGE } from './constants'

const CustomerJourneyAttributesTrigger = () => (
  <Tooltip delayDuration={ATTRIBUTE_TOOLTIP_DELAY}>
    <TooltipTrigger>
      <PopoverTrigger>
        <Tag size="lg" color="transparent" border>
          <TagLabel>...</TagLabel>
        </Tag>
      </PopoverTrigger>
    </TooltipTrigger>
    <Portal>
      <Content>
        <Label>{ATTRIBUTES_TRIGGER_TOOLTIP_MESSAGE}</Label>
        <Arrow />
      </Content>
    </Portal>
  </Tooltip>
)

export default CustomerJourneyAttributesTrigger
