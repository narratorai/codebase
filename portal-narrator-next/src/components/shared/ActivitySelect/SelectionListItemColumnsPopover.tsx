import React from 'react'

import { Popover, PopoverContent, Portal } from '@/components/shared/Popover'
import { IRemoteColumn } from '@/stores/activities'

import SelectionListItemColumns from './SelectionListItemColumns'
import SelectionListItemColumnsTrigger from './SelectionListItemColumnsTrigger'

interface Props {
  columns: IRemoteColumn[]
}

const CustomerJourneyPopoverAttributes = ({ columns }: Props) => (
  <Popover>
    <SelectionListItemColumnsTrigger />
    <Portal>
      <PopoverContent
        avoidCollisions
        collisionPadding={16}
        sideOffset={4}
        className="w-full min-w-60 max-w-sm rounded-lg bg-white p-4 shadow-md bordered-gray-100"
      >
        <SelectionListItemColumns columns={columns} />
      </PopoverContent>
    </Portal>
  </Popover>
)

export default CustomerJourneyPopoverAttributes
