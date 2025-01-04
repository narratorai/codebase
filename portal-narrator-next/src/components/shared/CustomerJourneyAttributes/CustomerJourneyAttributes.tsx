import React from 'react'

import { Attributes } from '@/components/shared/CustomerJourneyCommon'
import { IRemoteJourneyAttribute } from '@/stores/journeys'

import NullAttributes from './NullAttributes'

interface Props {
  attributes: IRemoteJourneyAttribute[]
  nullAttributes: string[]
}

const CustomerJourneyAttributes = ({ attributes, nullAttributes }: Props) => {
  if (attributes.length === 0 && nullAttributes.length === 0) return null

  return (
    <div className="w-full min-w-60 gap-6 flex-y">
      <Attributes attributes={attributes} />
      <NullAttributes nullAttributes={nullAttributes} />
    </div>
  )
}

export default CustomerJourneyAttributes
