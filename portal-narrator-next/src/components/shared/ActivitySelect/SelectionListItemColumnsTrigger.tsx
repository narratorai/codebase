/* eslint-disable simple-import-sort/imports */
import { Trigger as PopoverTrigger } from '@/components/shared/Popover'
import React from 'react'

import { Tag, Label as TagLabel } from '@/components/shared/Tag'
import { Arrow, Content, Label, Portal, Tooltip, TooltipTrigger } from '@/components/shared/Tooltip'

import { COLUMN_TOOLTIP_DELAY, COLUMNS_TRIGGER_TOOLTIP_MESSAGE } from './constants'

const SelectionListItemColumnsTrigger = () => (
  <Tooltip delayDuration={COLUMN_TOOLTIP_DELAY}>
    <TooltipTrigger>
      <PopoverTrigger onClick={(e) => e.stopPropagation()}>
        <Tag size="lg" color="white" border>
          <TagLabel>...</TagLabel>
        </Tag>
      </PopoverTrigger>
    </TooltipTrigger>
    <Portal>
      <Content>
        <Label>{COLUMNS_TRIGGER_TOOLTIP_MESSAGE}</Label>
        <Arrow />
      </Content>
    </Portal>
  </Tooltip>
)

export default SelectionListItemColumnsTrigger
