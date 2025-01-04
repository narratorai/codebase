import React from 'react'

import CustomerJourneyTimeline from '@/components/shared/CustomerJourneyTimeline'
import CustomerJourneyTitle from '@/components/shared/CustomerJourneyTitle'
import { IRemoteJourneyCustomer, IRemoteJourneyEvents } from '@/stores/journeys'

interface Props {
  events: IRemoteJourneyEvents
  customer: IRemoteJourneyCustomer
  showTitle?: boolean
}

const CustomerJourneyTimelinePanel = ({ events, customer, showTitle }: Props) => (
  <div className="col-span-2 gap-6 px-8 py-6 flex-y-center">
    {showTitle && (
      <CustomerJourneyTitle customerEmail={customer.customer} customerName={customer.customerDisplayName} />
    )}
    <div className="w-full px-1.5">
      <h5>Activity</h5>
    </div>
    <CustomerJourneyTimeline events={events.data} />
  </div>
)

export default CustomerJourneyTimelinePanel
