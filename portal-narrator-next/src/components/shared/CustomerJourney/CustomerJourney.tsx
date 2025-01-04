import React from 'react'

import { IRemoteJourneyAttributes, IRemoteJourneyConfig, IRemoteJourneyEvents } from '@/stores/journeys'

import CustomerJourneyAttributesPanel from './CustomerJourneyAttributesPanel'
import CustomerJourneyTimelinePanel from './CustomerJourneyTimelinePanel'

interface Props {
  events: IRemoteJourneyEvents | null
  attributes: IRemoteJourneyAttributes | null
  config: IRemoteJourneyConfig
}

const CustomerJourney = ({ events, attributes, config }: Props) => {
  return (
    <div className="grid min-w-96 grid-cols-1 lg:grid-cols-3">
      {attributes && <CustomerJourneyAttributesPanel customer={config.customer} attributes={attributes} />}

      {events && <CustomerJourneyTimelinePanel events={events} customer={config.customer} showTitle={!attributes} />}
    </div>
  )
}

export default CustomerJourney
