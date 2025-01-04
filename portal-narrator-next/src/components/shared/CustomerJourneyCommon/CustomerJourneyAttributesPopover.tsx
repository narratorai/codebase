import React from 'react'

import { Popover, PopoverContent, Portal } from '@/components/shared/Popover'
import { IRemoteJourneyAttribute } from '@/stores/journeys'

import CustomerJourneyAttributes from './CustomerJourneyAttributes'
import CustomerJourneyAttributesTrigger from './CustomerJourneyAttributesTrigger'

interface Props {
  attributes: IRemoteJourneyAttribute[]
}

const CustomerJourneyPopoverAttributes = ({ attributes }: Props) => (
  <Popover>
    <CustomerJourneyAttributesTrigger />
    <Portal>
      <PopoverContent
        avoidCollisions
        collisionPadding={16}
        sideOffset={4}
        className="w-full min-w-60 max-w-sm rounded-lg bg-white p-4 shadow-md bordered-gray-100"
      >
        <CustomerJourneyAttributes attributes={attributes} />
      </PopoverContent>
    </Portal>
  </Popover>
)

export default CustomerJourneyPopoverAttributes
