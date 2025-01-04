import { map, slice } from 'lodash'
import React from 'react'

import { IRemoteJourneyAttribute } from '@/stores/journeys'

import CustomerJourneyAttribute from './CustomerJourneyAttribute'
import CustomerJourneyAttributesPopover from './CustomerJourneyAttributesPopover'

interface Props {
  attributes: IRemoteJourneyAttribute[]
  visibleCount?: number
}

const CustomerJourneyAttributes = ({ attributes, visibleCount = Infinity }: Props) => {
  const visibleAttributes = slice(attributes, 0, visibleCount)
  const hiddenAttributes = slice(attributes, visibleCount)
  const showHiddenAttributes = hiddenAttributes.length > 0

  return (
    <div className="flex-wrap gap-2 flex-x-center">
      {map(
        visibleAttributes,
        (attribute) =>
          attribute.value && (
            <CustomerJourneyAttribute
              key={`${attribute.name}.${attribute.value}`}
              name={attribute.name}
              value={attribute.value}
            />
          )
      )}
      {showHiddenAttributes && <CustomerJourneyAttributesPopover attributes={hiddenAttributes} />}
    </div>
  )
}

export default CustomerJourneyAttributes
